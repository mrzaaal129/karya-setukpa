import React, { useState, useRef } from 'react';
import { PaperTemplate } from '../types';
import { exportTemplateToPDF, printTemplate } from '../utils/pdfExport';
import { DownloadIcon, PrinterIcon, EyeIcon, ZoomInIcon, ZoomOutIcon } from './icons';

interface TemplatePreviewProps {
    template: PaperTemplate;
    onClose: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, onClose }) => {
    const [zoom, setZoom] = useState(100);
    const [isExporting, setIsExporting] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            await exportTemplateToPDF('template-preview-content', template);
            alert('✅ PDF berhasil diexport!');
        } catch (error) {
            console.error('Export failed:', error);
            alert('❌ Gagal export PDF. Silakan coba lagi.');
        } finally {
            setIsExporting(false);
        }
    };

    const handlePrint = () => {
        try {
            printTemplate('template-preview-content');
        } catch (error) {
            console.error('Print failed:', error);
            alert('❌ Gagal print. Silakan coba lagi.');
        }
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

    const paperWidth = template.settings.orientation === 'landscape' ? '297mm' : '210mm';
    const paperHeight = template.settings.orientation === 'landscape' ? '210mm' : '297mm';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white w-full h-full flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">📄 Preview Template</h2>
                        <p className="text-sm text-gray-600">{template.name}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Zoom Controls */}
                        <div className="flex items-center gap-2 border-r border-gray-300 pr-3">
                            <button
                                onClick={handleZoomOut}
                                className="p-2 hover:bg-gray-100 rounded transition-colors"
                                title="Zoom Out"
                            >
                                <ZoomOutIcon className="w-4 h-4 text-gray-700" />
                            </button>
                            <span className="text-sm font-semibold text-gray-700 min-w-[60px] text-center">
                                {zoom}%
                            </span>
                            <button
                                onClick={handleZoomIn}
                                className="p-2 hover:bg-gray-100 rounded transition-colors"
                                title="Zoom In"
                            >
                                <ZoomInIcon className="w-4 h-4 text-gray-700" />
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <PrinterIcon className="w-4 h-4" />
                            Print
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Tutup
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-auto bg-gray-200 p-8">
                    <div
                        ref={previewRef}
                        className="mx-auto"
                        style={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'top center',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <div id="template-preview-content" className="space-y-8">
                            {template.pages.map((page, idx) => (
                                <div
                                    key={page.id}
                                    className="bg-white shadow-2xl mx-auto relative page-break border border-gray-300"
                                    style={{
                                        width: paperWidth,
                                        height: paperHeight,
                                        overflow: 'hidden',
                                        boxSizing: 'border-box',
                                        padding: `${template.settings.margins.top}cm ${template.settings.margins.right}cm ${template.settings.margins.bottom}cm ${template.settings.margins.left}cm`,
                                        fontFamily: template.settings.font.family,
                                        fontSize: `${template.settings.font.size}pt`,
                                        lineHeight: template.settings.font.lineHeight,
                                    }}
                                >
                                    {/* Page Content */}
                                    <div
                                        dangerouslySetInnerHTML={{ __html: page.content }}
                                        className="preview-content"
                                    />

                                    {/* Page Number */}
                                    {page.numbering.type !== 'none' && (
                                        <div
                                            className="absolute text-sm text-gray-600"
                                            style={{
                                                [page.numbering.position === 'top' ? 'top' : 'bottom']: '1cm',
                                                left: '50%',
                                                transform: 'translateX(-50%)'
                                            }}
                                        >
                                            {page.numbering.type === 'roman'
                                                ? toRoman(idx + 1)
                                                : idx + 1
                                            }
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        /* Print-optimized styles for consistent preview */
        @media print {
          .page-break {
            page-break-after: always;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
        
        /* Reset default browser styles */
        .preview-content * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        /* Preserve editor formatting */
        .preview-content {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        
        /* Headers - match editor styles */
        .preview-content h1 {
          font-size: 18pt;
          font-weight: bold;
          margin: 0.5em 0;
          line-height: 1.2;
        }
        
        .preview-content h2 {
          font-size: 16pt;
          font-weight: bold;
          margin: 0.4em 0;
          line-height: 1.2;
        }
        
        .preview-content h3 {
          font-size: 14pt;
          font-weight: bold;
          margin: 0.3em 0;
          line-height: 1.2;
        }
        
        /* Paragraphs */
        .preview-content p {
          margin: 0.3em 0;
          text-align: justify;
          text-indent: 0;
          line-height: inherit;
        }
        
        /* Lists */
        .preview-content ul, .preview-content ol {
          margin: 0.5em 0;
          padding-left: 2em;
        }
        
        .preview-content li {
          margin: 0.2em 0;
        }
        
        /* Tables */
        .preview-content table {
          border-collapse: collapse;
          width: auto;
          margin: 0.5em 0;
        }
        
        .preview-content td, .preview-content th {
          padding: 0.3em 0.5em;
          vertical-align: top;
        }
        
        /* Images */
        .preview-content img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        /* Preserve inline styles from editor */
        .preview-content [style] {
          /* Keep inline styles as-is */
        }
        
        /* Text formatting */
        .preview-content strong, .preview-content b {
          font-weight: bold;
        }
        
        .preview-content em, .preview-content i {
          font-style: italic;
        }
        
        .preview-content u {
          text-decoration: underline;
        }
        
        /* Center alignment */
        .preview-content [style*="text-align: center"],
        .preview-content [style*="text-align:center"] {
          text-align: center !important;
        }
        
        /* Divs and containers */
        .preview-content div {
          /* Preserve div spacing */
        }
      `}</style>
        </div>
    );
};

// Helper function to convert number to Roman numerals
const toRoman = (num: number): string => {
    const romanNumerals: [number, string][] = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];

    let result = '';
    for (const [value, numeral] of romanNumerals) {
        while (num >= value) {
            result += numeral;
            num -= value;
        }
    }
    return result.toLowerCase();
};

export default TemplatePreview;
