import prisma from '../lib/prisma.js';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');
// Handle CommonJS/ESM interop for pdf-parse
let pdf = pdfModule;
if (typeof pdf !== 'function' && typeof pdf.default === 'function') {
    pdf = pdf.default;
}
// Validate pdf function availability
if (typeof pdf !== 'function') {
    console.error('Failed to initialize pdf-parse. Module:', pdfModule);
}
import stringSimilarity from 'string-similarity';
import sanitizeHtml from 'sanitize-html';
import { Paper } from '@prisma/client';

export class ConsistencyService {
    /**
     * Extracts text from a file buffer (PDF or DOCX).
     */
    async extractText(buffer: Buffer, mimetype: string): Promise<string> {
        try {
            if (mimetype === 'application/pdf') {
                const data = await pdf(buffer);
                return data.text;
            } else if (
                mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                mimetype === 'application/msword'
            ) {
                const result = await mammoth.extractRawText({ buffer: buffer });
                return result.value;
            } else {
                throw new Error(`Unsupported file type: ${mimetype}. Only PDF and DOCX are supported.`);
            }
        } catch (error: any) {
            console.error('Error in extractText:', error);
            throw new Error(`Failed to extract text from file: ${error.message || error}`);
        }
    }

    /**
     * Cleans and normalizes text for comparison.
     * Removes extra whitespace, newlines, and converts to lowercase.
     */
    normalizeText(text: string): string {
        if (!text) return '';
        return text
            .toLowerCase()
            .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
            .trim();
    }

    /**
     * Calculates similarity score between two texts (0.0 to 100.0).
     */
    calculateSimilarity(text1: string, text2: string): number {
        const normalized1 = this.normalizeText(text1);
        const normalized2 = this.normalizeText(text2);

        if (!normalized1 || !normalized2) {
            return 0; // Cannot compare empty texts
        }

        // Use Dice coefficient from string-similarity library
        const diceScore = parseFloat((stringSimilarity.compareTwoStrings(normalized1, normalized2) * 100).toFixed(2));

        // Calculate Containment Score (How much of Text1 is inside Text2)
        // This handles cases where Text2 (PDF) has extra content like Cover/Appendix
        const containmentScore = this.calculateContainmentScore(normalized1, normalized2);

        // Return the higher of the two scores
        return Math.max(diceScore, containmentScore);
    }

    /**
     * Calculates Containment Score using Shingling (N-grams).
     * Robust against minor formatting differences.
     */
    calculateContainmentScore(source: string, target: string): number {
        if (!source || !target) return 0;

        // 1. Aggressive Normalization (alpha-numeric only)
        const cleanSource = this.aggressiveNormalize(source);
        const cleanTarget = this.aggressiveNormalize(target);

        // 2. Generate N-grams (Shingles) from Source
        // Lowering N to 3 makes it very robust for 'mostly same' content
        const N = 3;
        const sourceWords = cleanSource.split(' ').filter(w => w.length > 0);

        if (sourceWords.length < N) {
            // Text too short for N-grams, fall back to simple inclusion
            return cleanTarget.includes(cleanSource) ? 100 : 0;
        }

        const sourceShingles = new Set<string>();
        for (let i = 0; i <= sourceWords.length - N; i++) {
            const shingle = sourceWords.slice(i, i + N).join(' ');
            sourceShingles.add(shingle);
        }

        if (sourceShingles.size === 0) return 0;

        // 3. Check overlaps
        let matchCount = 0;
        for (const shingle of sourceShingles) {
            if (cleanTarget.includes(shingle)) {
                matchCount++;
            }
        }

        const score = (matchCount / sourceShingles.size) * 100;
        return parseFloat(score.toFixed(2));
    }

    aggressiveNormalize(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove punctuation/symbols
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Orchestrates the consistency check workflow.
     * 1. Fetches Paper from DB (to get Editor content).
     * 2. Extracts text from the uploaded file.
     * 3. Compares and calculates score.
     * 4. Updates Paper with score and status (PENDING_VERIFICATION).
     */
    async performConsistencyCheck(paperId: string, fileBuffer: Buffer, mimetype: string): Promise<Paper> {
        try {
            // 1. Get Paper Content
            const paper = await prisma.paper.findUnique({
                where: { id: paperId },
            });

            if (!paper) {
                throw new Error('Paper not found');
            }

            // 2. Extract Text from File
            const fileText = await this.extractText(fileBuffer, mimetype);

            let debugLogs: string[] = [];
            const log = (msg: string) => {
                console.log(msg);
                debugLogs.push(msg);
            };

            // 3. Normalize and Compare
            // Editor content might be HTML (Rich Text), need to strip tags potentially?
            // Assuming 'content' field in Paper is HTML from Tiptap/TinyMCE.
            let editorText = this.stripHtml(paper.content || '');

            // FIX: If paper.content is empty (new template structure), aggregate from structure chapters
            if (!editorText.trim()) {
                let structure: any[] = [];

                // Robust parsing for structure (handle string or object)
                if (Array.isArray(paper.structure)) {
                    structure = paper.structure as any[];
                } else if (typeof paper.structure === 'string') {
                    try {
                        structure = JSON.parse(paper.structure);
                    } catch (e: any) {
                        log(`Error parsing structure: ${e.message}`);
                        structure = [];
                    }
                }

                if (structure.length > 0) {
                    log(`[DEBUG] Consistency Check: Found ${structure.length} chapters.`);
                    // Log first chapter content presence
                    log(`[DEBUG] Ch 1 content type: ${typeof structure[0].content}, Length: ${structure[0].content?.length}`);

                    editorText = structure
                        .map((ch: any) => {
                            const txt = this.stripHtml(ch.content || '');
                            // console.log(`[DEBUG] Ch content length after strip: ${txt.length}`);
                            return txt;
                        })
                        .join(' ');

                    log(`[DEBUG] Final Aggregated Editor Text Length: ${editorText.length}`);
                } else {
                    log('[DEBUG] Structure is empty array.');
                }
            } else {
                log(`[DEBUG] Using main paper content (Length: ${editorText.length})`);
            }

            const score = this.calculateSimilarity(editorText, fileText);
            log(`Consistency Check for Paper ${paperId}: Score ${score}% (Editor: ${editorText.length} vs File: ${fileText.length})`);

            // Determine Status
            // If score is very high (e.g. >90%), maybe ideally auto-verify? 
            // But for now, we set PENDING_VERIFICATION for Superadmin to see.
            let status = 'PENDING_VERIFICATION';

            // 4. Update Database with consistency check results
            const updatedPaper = await prisma.paper.update({
                where: { id: paperId },
                data: {
                    consistencyScore: score,
                    consistencyStatus: 'PENDING_VERIFICATION',
                    consistencyLog: {
                        checkedAt: new Date().toISOString(),
                        editorLength: editorText.length,
                        fileLength: fileText.length,
                        score: score,
                        debug: debugLogs
                    }
                },
            });

            return updatedPaper;

        } catch (error: any) {
            console.error('Error in performConsistencyCheck:', error);

            // Log error to DB so we can debug in frontend
            try {
                await prisma.paper.update({
                    where: { id: paperId },
                    data: {
                        consistencyStatus: 'CHECK_ERROR',
                        consistencyLog: {
                            checkedAt: new Date().toISOString(),
                            editorLength: 0,
                            fileLength: 0,
                            score: 0,
                            debug: [
                                `SYSTEM ERROR: ${error.message || error}`,
                                // @ts-ignore
                                `Input Buffer: ${fileBuffer ? fileBuffer.length : 'null'} bytes`,
                                `Mimetype: ${mimetype}`
                            ]
                        }
                    }
                });
            } catch (dbError) {
                console.error('Failed to log error to DB:', dbError);
            }

            throw error;
        }
    }

    // Helper to strip HTML tags from editor content.
    stripHtml(html: string): string {
        try {
            return sanitizeHtml(html, {
                allowedTags: [], // Remove all tags
                allowedAttributes: {}, // Remove all attributes
                textFilter: (text) => text + ' ' // Ensure space between block elements
            });
        } catch (e) {
            // Fallback to regex if sanitizer fails
            return html.replace(/<[^>]*>?/gm, ' ');
        }
    }
}

export const consistencyService = new ConsistencyService();
