import { PaperStructure } from '../types';

/**
 * Generate HTML content from chapter structure
 * Professional academic paper format with page breaks between chapters
 */
export const generateChapterContent = (structure: PaperStructure[]): string => {
    let html = '';

    structure.forEach((chapter, chapterIndex) => {
        // Wrap each chapter in a FULL PAGE - CLEAN style (no border/shadow)
        // Just page break and min-height for separation
        html += `<div style="
            min-height: 297mm;
            padding: 3cm 4cm 3cm 3cm;
            background: white;
            page-break-after: always;
            break-after: page;
            box-sizing: border-box;
        ">\n`;

        // Chapter heading - CENTERED and BOLD
        html += `<h1 style="text-align: center; font-size: 14pt; font-weight: bold; margin-top: 0; margin-bottom: 1.5em; text-transform: uppercase;">
      ${chapter.title}
    </h1>\n`;

        // Chapter placeholder - justified text with proper academic formatting
        html += `<p style="text-align: justify; text-indent: 1.27cm; margin-bottom: 1em; line-height: 2;">
      [Tulis isi ${chapter.title} di sini. Minimal ${chapter.minWords} kata. Gunakan spasi ganda (line-height: 2) sesuai standar karya tulis ilmiah.]
    </p>\n`;

        // Subsections
        if (chapter.subsections && chapter.subsections.length > 0) {
            chapter.subsections.forEach((subsection, subIndex) => {
                const subsectionNumber = subIndex + 1;
                let cleanTitle = subsection.title;
                cleanTitle = cleanTitle.replace(/^[A-Z]\.\s*/i, '');
                cleanTitle = cleanTitle.replace(/^[0-9]+\.\s*/, '');

                html += `<h2 style="text-align: left; font-size: 12pt; font-weight: bold; margin-top: 1.5em; margin-bottom: 1em;">
          ${subsectionNumber}. ${cleanTitle}
        </h2>\n`;

                html += `<p style="text-align: justify; text-indent: 1.27cm; margin-bottom: 1em; line-height: 2;">
          [Tulis isi ${subsectionNumber}. ${cleanTitle} di sini. Minimal ${subsection.minWords} kata. Paragraf baru dimulai dengan indent 1.27cm (0.5 inch).]
        </p>\n`;
            });
        }

        // Close page container
        html += `</div>\n`;
    });

    return html;
};

/**
 * Insert chapter structure into existing content
 * Replaces placeholder or appends to content
 */
export const insertChapterStructure = (
    currentContent: string,
    structure: PaperStructure[]
): string => {
    const chapterContent = generateChapterContent(structure);

    // If content is empty or just placeholder, replace it
    if (!currentContent || currentContent.trim() === '' ||
        currentContent.includes('Mulai menulis isi makalah')) {
        return chapterContent;
    }

    // Otherwise, append at the end
    return currentContent + '\n\n' + chapterContent;
};

/**
 * Update chapter content when structure changes
 * Preserves existing content, only updates structure
 */
export const updateChapterStructure = (
    currentContent: string,
    oldStructure: PaperStructure[],
    newStructure: PaperStructure[]
): string => {
    // For now, just regenerate if structure changed significantly
    // In future, could implement smart merging
    if (JSON.stringify(oldStructure) !== JSON.stringify(newStructure)) {
        return generateChapterContent(newStructure);
    }

    return currentContent;
};
