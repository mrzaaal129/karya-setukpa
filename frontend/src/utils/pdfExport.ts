// PDF Export utility using html2pdf.js
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { PaperTemplate } from '../types';

export interface PDFExportOptions {
    filename?: string;
    margin?: number[];
    pagebreak?: { mode: string; avoid?: string[] };
}

/**
 * Export template to PDF
 * @param elementId - ID of HTML element to convert
 * @param template - Template data for settings
 * @param options - Additional export options
 */
export const exportTemplateToPDF = async (
    elementId: string,
    template: PaperTemplate,
    options?: PDFExportOptions
): Promise<void> => {
    const element = document.getElementById(elementId);

    if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
    }

    const defaultOptions = {
        margin: [
            template.settings.margins.top,
            template.settings.margins.right,
            template.settings.margins.bottom,
            template.settings.margins.left
        ],
        filename: options?.filename || `${template.name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: {
            unit: 'cm',
            format: 'a4',
            orientation: template.settings.orientation || 'portrait',
            compress: true
        },
        pagebreak: options?.pagebreak || {
            mode: ['avoid-all', 'css', 'legacy'],
            avoid: ['h1', 'h2', 'h3']
        }
    };

    try {
        await html2pdf()
            .set(defaultOptions)
            .from(element)
            .save();
    } catch (error) {
        console.error('PDF export failed:', error);
        throw new Error('Failed to export PDF. Please try again.');
    }
};

/**
 * Generate PDF blob for preview
 */
export const generatePDFBlob = async (
    elementId: string,
    template: PaperTemplate
): Promise<Blob> => {
    const element = document.getElementById(elementId);

    if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
    }

    const options = {
        margin: [
            template.settings.margins.top,
            template.settings.margins.right,
            template.settings.margins.bottom,
            template.settings.margins.left
        ],
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: {
            unit: 'cm',
            format: 'a4',
            orientation: template.settings.orientation || 'portrait'
        }
    };

    const pdf = await html2pdf()
        .set(options)
        .from(element)
        .outputPdf('blob');

    return pdf;
};

/**
 * Print template directly
 */
export const printTemplate = (elementId: string): void => {
    const element = document.getElementById(elementId);

    if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        throw new Error('Could not open print window');
    }

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Template</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: 'Times New Roman', serif;
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};
