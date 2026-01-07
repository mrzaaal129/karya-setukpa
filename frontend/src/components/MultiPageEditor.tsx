import React, { useState, useRef } from 'react';
import {
    Undo2, Redo2, Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Indent, Outdent,
    FileImage, Table, Palette, Highlighter, Eraser,
    Minus, GripHorizontal, ZoomIn, ZoomOut, FilePlus
} from 'lucide-react';
import DocumentPage from './DocumentPage';
import EditorRuler from './EditorRuler';
import { PageSettings } from '../types';

interface MultiPageEditorProps {
    initialContent?: string;
    onChange: (content: string) => void;
    settings: PageSettings;
    header?: string;
    showHeaderOnFirstPageOnly?: boolean;
}

const MultiPageEditor: React.FC<MultiPageEditorProps> = ({
    initialContent = '<p>Mulai menulis di sini...</p>',
    onChange,
    settings,
    header,
    showHeaderOnFirstPageOnly = false
}) => {
    const [pages, setPages] = useState<string[]>([initialContent]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [zoom, setZoom] = useState(1.0);
    const [pageNumberFormat, setPageNumberFormat] = useState<'none' | 'roman' | 'arabic'>('arabic');
    const [pageNumberPosition, setPageNumberPosition] = useState<'top-center' | 'bottom-center' | 'bottom-right'>('bottom-center');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePageContentChange = (pageIndex: number, newContent: string) => {
        const updatedPages = [...pages];
        updatedPages[pageIndex] = newContent;
        setPages(updatedPages);

        // Notify parent of all content
        const allContent = updatedPages.join('\n<!-- PAGE_BREAK -->\n');
        onChange(allContent);
    };

    const addNewPage = () => {
        setPages([...pages, '<p><br></p>']);
        setCurrentPageIndex(pages.length);
    };

    const execCmd = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const imgHtml = `<img src="${event.target.result}" style="max-width: 100%; height: auto;" />`;
                    execCmd('insertHTML', imgHtml);
                }
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const insertTable = () => {
        const rows = prompt('Jumlah baris:', '3');
        const cols = prompt('Jumlah kolom:', '3');
        const border = confirm('Tampilkan border?');
        if (rows && cols) {
            const borderStyle = border ? 'border:1px solid #000;' : 'border:none;';
            let table = `<table style="border-collapse:collapse;width:100%;${borderStyle}"><tbody>`;
            for (let i = 0; i < parseInt(rows); i++) {
                table += '<tr>';
                for (let j = 0; j < parseInt(cols); j++) {
                    table += `<td style="${borderStyle}padding:8px;">&nbsp;</td>`;
                }
                table += '</tr>';
            }
            table += '</tbody></table><p><br></p>';
            execCmd('insertHTML', table);
        }
    };

    const insertVerticalLines = () => {
        const linesHtml = `<div style="text-align: center; font-size: 48pt; font-weight: bold; line-height: 1; margin: 1cm 0; font-family: Arial;">|||</div><p><br></p>`;
        execCmd('insertHTML', linesHtml);
    };

    const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 2.0));
    const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.5));
    const handleZoomReset = () => setZoom(1.0);

    const getPaperDimensions = () => {
        const isPortrait = settings.orientation === 'portrait';
        if (settings.paperSize === 'A4') {
            return { widthMm: isPortrait ? 210 : 297, heightMm: isPortrait ? 297 : 210 };
        } else {
            return { widthMm: isPortrait ? 216 : 279, heightMm: isPortrait ? 279 : 216 };
        }
    };

    const { widthMm, heightMm } = getPaperDimensions();

    const btn = (isActive: boolean = false) =>
        `p-2 rounded transition-all ${isActive ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`;

    return (
        <>
            <style>{`
                @media print {
                    .toolbar, .ruler, .status-bar, .page-controls { display: none !important; }
                    .document-page { page-break-after: always; box-shadow: none !important; margin: 0 !important; }
                }
                .document-content { 
                    font-family: ${settings.font.family}; 
                    font-size: ${settings.font.size}pt; 
                    line-height: ${settings.font.lineHeight};
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                .document-content h1 { font-size: 18pt; font-weight: bold; text-align: center; margin: 1em 0; }
                .document-content h2 { font-size: 16pt; font-weight: bold; margin: 0.8em 0; }
                .document-content h3 { font-size: 14pt; font-weight: bold; margin: 0.6em 0; }
                .document-content p { text-align: justify; margin: 0.5em 0; text-indent: 1.27cm; }
                .document-content ul { list-style-type: disc; margin: 0.5em 0; padding-left: 2.5em; }
                .document-content ol { list-style-type: decimal; margin: 0.5em 0; padding-left: 2.5em; }
                .document-content li { margin: 0.3em 0; }
                .document-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                .document-content table td, .document-content table th { padding: 8px; }
                .document-content img { max-width: 100%; height: auto; }
                
                .editor-scroll::-webkit-scrollbar { width: 12px; height: 12px; }
                .editor-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
                .editor-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 6px; }
                .editor-scroll::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
            `}</style>

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

            <div className="flex flex-col h-full bg-white">
                {/* Toolbar */}
                <div className="toolbar border-b border-gray-300 bg-gray-50 px-4 py-2">
                    <div className="flex flex-wrap items-center gap-1">
                        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('undo'); }} className={btn()} title="Undo">
                                <Undo2 size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('redo'); }} className={btn()} title="Redo">
                                <Redo2 size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
                            <select onChange={(e) => execCmd('fontName', e.target.value)} className="px-2 py-1 text-sm border border-gray-300 rounded bg-white">
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Arial">Arial</option>
                                <option value="Calibri">Calibri</option>
                                <option value="Georgia">Georgia</option>
                            </select>
                            <select onChange={(e) => execCmd('fontSize', e.target.value)} className="px-2 py-1 text-sm border border-gray-300 rounded bg-white w-16">
                                {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24].map(s => (
                                    <option key={s} value={Math.ceil(s / 12)}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className={btn()} title="Bold">
                                <Bold size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className={btn()} title="Italic">
                                <Italic size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} className={btn()} title="Underline">
                                <Underline size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('strikeThrough'); }} className={btn()} title="Strikethrough">
                                <Strikethrough size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }} className={btn()} title="Align Left">
                                <AlignLeft size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }} className={btn()} title="Center">
                                <AlignCenter size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyRight'); }} className={btn()} title="Align Right">
                                <AlignRight size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyFull'); }} className={btn()} title="Justify">
                                <AlignJustify size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} className={btn()} title="Bullets">
                                <List size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }} className={btn()} title="Numbering">
                                <ListOrdered size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('indent'); }} className={btn()} title="Indent">
                                <Indent size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('outdent'); }} className={btn()} title="Outdent">
                                <Outdent size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
                            <button onClick={() => fileInputRef.current?.click()} className={btn()} title="Insert Picture">
                                <FileImage size={18} />
                            </button>
                            <button onClick={insertTable} className={btn()} title="Insert Table">
                                <Table size={18} />
                            </button>
                            <button onClick={insertVerticalLines} className={btn()} title="Insert Lines (|||)">
                                <GripHorizontal size={18} className="rotate-90" />
                            </button>
                        </div>

                        <div className="flex items-center gap-0.5">
                            <label className="cursor-pointer p-2 rounded hover:bg-gray-100" title="Text Color">
                                <Palette size={18} />
                                <input type="color" onChange={(e) => execCmd('foreColor', e.target.value)} className="hidden" />
                            </label>
                            <label className="cursor-pointer p-2 rounded hover:bg-gray-100" title="Highlight">
                                <Highlighter size={18} />
                                <input type="color" onChange={(e) => execCmd('backColor', e.target.value)} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Ruler */}
                <EditorRuler
                    paperWidthMm={widthMm}
                    marginLeft={settings.margins.left}
                    marginRight={settings.margins.right}
                    zoom={zoom}
                />

                {/* Page Controls */}
                <div className="page-controls bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={addNewPage}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                            <FilePlus size={16} />
                            Tambah Halaman Baru
                        </button>
                        <span className="text-sm text-gray-600">
                            Total: {pages.length} halaman
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600">Format Nomor:</label>
                            <select
                                value={pageNumberFormat}
                                onChange={(e) => setPageNumberFormat(e.target.value as any)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                            >
                                <option value="none">Tidak Ada</option>
                                <option value="roman">Romawi (i, ii, iii)</option>
                                <option value="arabic">Angka (1, 2, 3)</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600">Posisi:</label>
                            <select
                                value={pageNumberPosition}
                                onChange={(e) => setPageNumberPosition(e.target.value as any)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                            >
                                <option value="top-center">Atas Tengah</option>
                                <option value="bottom-center">Bawah Tengah</option>
                                <option value="bottom-right">Bawah Kanan</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Editor Area - Multi-page */}
                <div className="flex-1 overflow-auto bg-gray-200 editor-scroll py-8">
                    <div className="flex flex-col items-center gap-0">
                        {pages.map((pageContent, index) => (
                            <DocumentPage
                                key={index}
                                pageNumber={index + 1}
                                totalPages={pages.length}
                                content={pageContent}
                                onContentChange={(newContent) => handlePageContentChange(index, newContent)}
                                settings={settings}
                                header={header}
                                showHeaderOnFirstPageOnly={showHeaderOnFirstPageOnly}
                                pageNumberFormat={pageNumberFormat}
                                pageNumberPosition={pageNumberPosition}
                                showPageNumberOnFirstPage={index === 0 ? false : true}
                                zoom={zoom}
                            />
                        ))}
                    </div>
                </div>

                {/* Status Bar */}
                <div className="status-bar bg-gray-100 border-t border-gray-300 px-4 py-1.5 flex items-center justify-between text-xs text-gray-700">
                    <div className="flex items-center gap-4">
                        <span className="font-medium">Halaman {currentPageIndex + 1} dari {pages.length}</span>
                        <span>{settings.paperSize} • {settings.orientation === 'portrait' ? 'Portrait' : 'Landscape'}</span>
                        <span>{widthMm}mm × {heightMm}mm</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleZoomOut} className="p-1 hover:bg-gray-200 rounded" title="Zoom Out">
                            <ZoomOut size={14} />
                        </button>
                        <button onClick={handleZoomReset} className="px-2 py-0.5 hover:bg-gray-200 rounded font-mono">
                            {Math.round(zoom * 100)}%
                        </button>
                        <button onClick={handleZoomIn} className="p-1 hover:bg-gray-200 rounded" title="Zoom In">
                            <ZoomIn size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MultiPageEditor;
