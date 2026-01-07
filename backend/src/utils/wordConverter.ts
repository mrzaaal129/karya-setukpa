import * as cheerio from 'cheerio';
import sanitizeHtmlLib from 'sanitize-html';

interface TemplatePage {
    id: string;
    type: 'TITLE' | 'APPROVAL' | 'ABSTRACT' | 'TABLE_OF_CONTENTS' | 'CONTENT' | 'BIBLIOGRAPHY' | 'APPENDIX';
    content: string;
    order: number;
}

interface TemplateSettings {
    paperSize: string;
    orientation: string;
    margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
}

/**
 * Convert HTML from mammoth.js to template structure
 */
export function convertHtmlToTemplate(html: string, templateName: string) {
    // Default settings
    const settings: TemplateSettings = {
        paperSize: 'A4',
        orientation: 'portrait',
        margins: {
            top: 3,
            right: 3,
            bottom: 3,
            left: 4
        },
        fontSize: 12,
        fontFamily: 'Times New Roman',
        lineHeight: 2
    };

    // Split content into pages based on headings or page breaks
    const pages = splitContentIntoPages(html);

    return {
        name: templateName,
        description: `Template imported from Word document - ${templateName}`,
        settings,
        pages
    };
}

/**
 * Split HTML content into logical pages
 */
function splitContentIntoPages(html: string): TemplatePage[] {
    const $ = cheerio.load(html);
    const pages: TemplatePage[] = [];
    let pageOrder = 0;

    // Check if there's a title page (first h1 or specific structure)
    const firstH1 = $('h1').first();
    if (firstH1.length > 0) {
        // Create title page
        const titleContent = extractTitlePageContent($, firstH1);
        pages.push({
            id: generateId(),
            type: 'TITLE',
            content: titleContent,
            order: pageOrder++
        });

        // Remove title content from main HTML
        firstH1.remove();
    }

    // Check for abstract (usually after title, before main content)
    const abstractSection = findAbstractSection($);
    if (abstractSection) {
        pages.push({
            id: generateId(),
            type: 'ABSTRACT',
            content: abstractSection,
            order: pageOrder++
        });
    }

    // Main content - split by major headings (h1, h2)
    const mainContent = $.html();
    const contentPages = splitByHeadings(mainContent);

    contentPages.forEach(content => {
        pages.push({
            id: generateId(),
            type: 'CONTENT',
            content: content,
            order: pageOrder++
        });
    });

    // If no pages were created, create a single content page with all content
    if (pages.length === 0) {
        pages.push({
            id: generateId(),
            type: 'CONTENT',
            content: html,
            order: 0
        });
    }

    return pages;
}

/**
 * Extract title page content
 */
function extractTitlePageContent($: cheerio.CheerioAPI, titleElement: cheerio.Cheerio<any>): string {
    let titleHtml = '<div class="title-page">';

    // Get title
    titleHtml += `<h1 style="text-align: center; margin-top: 100px;">${titleElement.text()}</h1>`;

    // Get next few paragraphs that might be subtitle, author, etc.
    let nextElement = titleElement.next();
    let count = 0;
    while (nextElement.length > 0 && count < 5) {
        const tagName = nextElement.prop('tagName')?.toLowerCase();
        if (tagName === 'h1' || tagName === 'h2') break;

        if (tagName === 'p') {
            titleHtml += `<p style="text-align: center;">${nextElement.html()}</p>`;
            nextElement.remove();
        }

        nextElement = nextElement.next();
        count++;
    }

    titleHtml += '</div>';
    return titleHtml;
}

/**
 * Find abstract section in the document
 */
function findAbstractSection($: cheerio.CheerioAPI): string | null {
    // Look for heading containing "abstract", "abstrak", "ringkasan"
    const abstractHeading = $('h1, h2, h3').filter((i, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes('abstract') || text.includes('abstrak') || text.includes('ringkasan');
    }).first();

    if (abstractHeading.length === 0) return null;

    let abstractHtml = '<div class="abstract">';
    abstractHtml += abstractHeading.prop('outerHTML') || '';

    // Get content until next heading
    let nextElement = abstractHeading.next();
    while (nextElement.length > 0) {
        const tagName = nextElement.prop('tagName')?.toLowerCase();
        if (tagName === 'h1' || tagName === 'h2') break;

        abstractHtml += nextElement.prop('outerHTML') || '';
        const toRemove = nextElement;
        nextElement = nextElement.next();
        toRemove.remove();
    }

    abstractHeading.remove();
    abstractHtml += '</div>';

    return abstractHtml;
}

/**
 * Split content by major headings
 */
function splitByHeadings(html: string): string[] {
    const $ = cheerio.load(html);
    const sections: string[] = [];

    // Find all h1 and h2 elements
    const headings = $('h1, h2').toArray();

    if (headings.length === 0) {
        // No headings, return all content as one page
        return [html];
    }

    headings.forEach((heading: any, index: number) => {
        const $heading = $(heading);
        let sectionHtml = '<div class="content-section">';
        sectionHtml += $heading.prop('outerHTML') || '';

        // Get content until next heading
        let nextElement = $heading.next();
        while (nextElement.length > 0) {
            const tagName = nextElement.prop('tagName')?.toLowerCase();

            // Stop at next major heading
            if ((tagName === 'h1' || tagName === 'h2') && nextElement[0] !== headings[index + 1]) {
                break;
            }

            // Stop at next heading in our list
            if (headings[index + 1] && nextElement[0] === headings[index + 1]) {
                break;
            }

            sectionHtml += nextElement.prop('outerHTML') || '';
            nextElement = nextElement.next();
        }

        sectionHtml += '</div>';
        sections.push(sectionHtml);
    });

    return sections;
}

/**
 * Generate unique ID
 */
function generateId(): string {
    return `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clean and sanitize HTML - Uses sanitize-html library for proper XSS prevention
 * This is much more robust than simple tag removal
 */
export function sanitizeHtml(html: string): string {
    return sanitizeHtmlLib(html, {
        allowedTags: [
            // Basic formatting
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
            // Headings
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            // Lists
            'ul', 'ol', 'li',
            // Tables
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            // Other common elements
            'div', 'span', 'blockquote', 'pre', 'code',
            // Images (controlled)
            'img',
            // Links
            'a',
        ],
        allowedAttributes: {
            '*': ['style', 'class', 'id'],
            'a': ['href', 'target', 'rel'],
            'img': ['src', 'alt', 'width', 'height'],
            'table': ['border', 'cellpadding', 'cellspacing'],
            'td': ['colspan', 'rowspan'],
            'th': ['colspan', 'rowspan'],
        },
        allowedSchemes: ['http', 'https', 'data'],
        allowedSchemesByTag: {
            img: ['http', 'https', 'data']
        },
        disallowedTagsMode: 'discard',
        // Remove dangerous attributes
        transformTags: {
            'a': (tagName, attribs) => {
                return {
                    tagName,
                    attribs: {
                        ...attribs,
                        rel: 'noopener noreferrer', // Security for links
                        target: attribs.target || '_blank'
                    }
                };
            }
        }
    });
}

