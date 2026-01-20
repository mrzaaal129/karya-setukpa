import prisma from '../lib/prisma.js'; // Adjust path as needed
import mammoth from 'mammoth';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';
import stringSimilarity from 'string-similarity';
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
        } catch (error) {
            console.error('Error in extractText:', error);
            throw new Error('Failed to extract text from file.');
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
        const similarity = stringSimilarity.compareTwoStrings(normalized1, normalized2);
        // Convert to percentage with 2 decimal places
        return parseFloat((similarity * 100).toFixed(2));
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

            // 3. Normalize and Compare
            // Editor content might be HTML (Rich Text), need to strip tags potentially?
            // Assuming 'content' field in Paper is HTML from Tiptap/TinyMCE.
            const editorText = this.stripHtml(paper.content || '');

            const score = this.calculateSimilarity(editorText, fileText);
            console.log(`Consistency Check for Paper ${paperId}: Score ${score}%`);

            // Determine Status
            // If score is very high (e.g. >90%), maybe ideally auto-verify? 
            // But for now, we set PENDING_VERIFICATION for Superadmin to see.
            let status = 'PENDING_VERIFICATION';

            // 4. Update Database
            const updatedPaper = await prisma.paper.update({
                where: { id: paperId },
                data: {
                    consistencyScore: score,
                    consistencyStatus: status,
                    // Optional: Store log if needed, e.g. snippet of diff
                    consistencyLog: {
                        checkedAt: new Date(),
                        editorLength: editorText.length,
                        fileLength: fileText.length,
                        score: score
                    }
                },
            });

            return updatedPaper;

        } catch (error) {
            console.error('Error in performConsistencyCheck:', error);
            // Fallback: If check fails, don't block upload, just mark as UNCHECKED or Error
            // But rethrow so controller knows? Or silent fail? 
            // Let's create a fail state in DB if possible, or just rethrow.
            await prisma.paper.update({
                where: { id: paperId },
                data: { consistencyStatus: 'ERROR_CHECKING' }
            });
            throw error;
        }
    }

    /**
     * Helper to strip HTML tags from editor content.
     */
    stripHtml(html: string): string {
        return html.replace(/<[^>]*>?/gm, ' '); // Replace tags with space to avoid merging words
    }
}

export const consistencyService = new ConsistencyService();
