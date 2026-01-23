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
// import stringSimilarity from 'string-similarity'; // Removed for Strict Mode
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

        // Use Dice coefficient? NO. STRICT MODE logic only.
        // We only rely on Containment Score now to ensure 0% on fraud.
        // But to pass 'types', let's keep a basic check or just use containment as primary.

        // Strategy: Strict Containment is the boss.
        const containmentScore = this.calculateContainmentScore(normalized1, normalized2);

        return containmentScore;
    }

    /**
     * Calculates Containment Score using STRICT EXACT MATCHING.
     * 1. Splits both source and target into sentences.
     * 2. Filters out EVERYTHING except long analytical sentences (> 20 words).
     * 3. Matches EXACTLY. No typo tolerance.
     */
    calculateContainmentScore(source: string, target: string): number {
        if (!source || !target) return 0;

        // 1. Helper to split text into distinct, meaningful sentences
        const getSentences = (text: string) => {
            return text
                .replace(/\r?\n/g, ' ') // Merge lines
                .replace(/\s+/g, ' ')   // Normalize spaces
                // Split by periods to act as sentence boundaries
                .split(/[.]/)
                .map(s => this.aggressiveNormalize(s)) // Normalize each sentence
                // AGGRESSIVE FILTER: Only keep sentences with >= 20 words.
                // This removes ALL titles, headers, standard intro phrases, and fluff.
                .filter(s => s.split(' ').length >= 20);
        };

        const sourceSentences = getSentences(source);
        // Optimize target: just keep it as one big normalized string for fast substring search
        const cleanTarget = this.aggressiveNormalize(target);

        if (sourceSentences.length === 0) return 0;

        let matchedCount = 0;

        // 2. Strict Check for each Source Sentence
        for (const srcSentence of sourceSentences) {
            // STRICT: Must be contained EXACTLY in the target text.
            // Typo = Fail.
            if (cleanTarget.includes(srcSentence)) {
                matchedCount++;
            }
        }

        const score = (matchedCount / sourceSentences.length) * 100;
        return parseFloat(score.toFixed(2));
    }

    aggressiveNormalize(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ') // Replace symbols with space to avoid merging
            .replace(/\b\d+\b/g, ' ') // Remove standalone numbers
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Orchestrates the consistency check workflow.
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
            let editorText = this.stripHtml(paper.content || '');

            // Aggregate structure if empty
            if (!editorText.trim()) {
                let structure: any[] = [];
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
                    editorText = structure
                        .map((ch: any) => {
                            const txt = this.stripHtml(ch.content || '');
                            return txt;
                        })
                        .join('. '); // Separator for sentence isolation
                }
            }

            const score = this.calculateSimilarity(editorText, fileText);
            log(`Consistency Check for Paper ${paperId}: Score ${score}%`);

            // 4. Update Database
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
            // Error logging logic remains same...
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
