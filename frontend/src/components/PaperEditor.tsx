import React, { useRef, useEffect, useState } from 'react';
import {
    Undo2, Redo2, Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Indent, Outdent,
    Link2, FileImage, Table, Palette, Highlighter, Eraser,
    Minus, GripHorizontal, ZoomIn, ZoomOut
} from 'lucide-react';
import EditorRuler from './EditorRuler';

interface PaperEditorProps {
    content: string;
    onChange: (content: string) => void;
    settings: {
        paperSize: 'A4' | 'Letter';
        orientation: 'portrait' | 'landscape';
        margins: { top: number; right: number; bottom: number; left: number };
        font: { family: string; size: number; lineHeight: number };
    };
    readOnly?: boolean;
}

const PaperEditor: React.FC<PaperEditorProps> = ({ content, onChange, settings, readOnly = false }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [zoom, setZoom] = useState(1.0);
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        insertUnorderedList: false,
        insertOrderedList: false,
    });

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== content) {
            const selection = window.getSelection();
            const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            editorRef.current.innerHTML = content;
            if (range) {
                try {
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                } catch (e) { }
            }
        }
    }, [content]);

    useEffect(() => {
        const updateFormats = () => {
            try {
                setActiveFormats({
                    bold: document.queryCommandState('bold'),
                    italic: document.queryCommandState('italic'),
                    underline: document.queryCommandState('underline'),
                    strikethrough: document.queryCommandState('strikeThrough'),
                    insertUnorderedList: document.queryCommandState('insertUnorderedList'),
                    insertOrderedList: document.queryCommandState('insertOrderedList'),
                });
            } catch (e) { }
        };

        document.addEventListener('selectionchange', updateFormats);
        return () => document.removeEventListener('selectionchange', updateFormats);
    }, []);

    const execCmd = (command: string, value?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handleInput = () => {
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    const insertLink = () => {
        const url = prompt('Enter URL:');
        if (url) execCmd('createLink', url);
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
        const rows = prompt('Rows:', '3');
        const cols = prompt('Columns:', '3');
        const border = confirm('Show borders?');
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

    // Calculate paper dimensions
    const getPaperDimensions = () => {
        const isPortrait = settings.orientation === 'portrait';
        if (settings.paperSize === 'A4') {
            return {
                widthMm: isPortrait ? 210 : 297,
                heightMm: isPortrait ? 297 : 210,
            };
        } else {
            return {
                widthMm: isPortrait ? 216 : 279,
                heightMm: isPortrait ? 279 : 216,
            };
        }
    };

    const { widthMm, heightMm } = getPaperDimensions();
    const paperWidthPx = (widthMm / 10) * 37.795; // Convert mm to px
    const paperHeightPx = (heightMm / 10) * 37.795;

    const btn = (isActive: boolean) =>
        `p-2 rounded transition-all ${isActive ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`;

    const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 2.0));
    const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.5));
    const handleZoomReset = () => setZoom(1.0);

    return (
        <>
            <style>{`
                @media print {
                    .toolbar, .ruler, .status-bar { display: none !important; }
                    @page { size: ${settings.paperSize} ${settings.orientation}; margin: ${settings.margins.top}cm ${settings.margins.right}cm ${settings.margins.bottom}cm ${settings.margins.left}cm; }
                }
                .editor-content { 
                    font-family: ${settings.font.family}; 
                    font-size: ${settings.font.size}pt; 
                    line-height: ${settings.font.lineHeight};
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                .editor-content h1 { font-size: 18pt; font-weight: bold; text-align: center; margin: 1em 0; }
                .editor-content h2 { font-size: 16pt; font-weight: bold; margin: 0.8em 0; }
                .editor-content h3 { font-size: 14pt; font-weight: bold; margin: 0.6em 0; }
                .editor-content p { text-align: justify; margin: 0.5em 0; text-indent: 1.27cm; }
                .editor-content ul { list-style-type: disc; margin: 0.5em 0; padding-left: 2.5em; }
                .editor-content ol { list-style-type: decimal; margin: 0.5em 0; padding-left: 2.5em; }
                .editor-content li { margin: 0.3em 0; }
                .editor-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                .editor-content table td, .editor-content table th { padding: 8px; }
                .editor-content img { max-width: 100%; height: auto; }
                
                .word-page {
                    background: white;
                    box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                }
                
                .editor-scroll::-webkit-scrollbar { width: 12px; height: 12px; }
                .editor-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
                .editor-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 6px; }
                .editor-scroll::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
            `}</style>

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

            <div className="flex flex-col h-full bg-white">
                {/* Toolbar - Hide if ReadOnly */}
                {!readOnly && (
                    <div className="toolbar border-b border-gray-300 bg-gray-50 px-4 py-2">
                        <div className="flex flex-wrap items-center gap-1">
                            <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('undo'); }} className={btn(false)} title="Undo">
                                    <Undo2 size={18} />
                                </button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('redo'); }} className={btn(false)} title="Redo">
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
                                    {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36].map(s => (
                                        <option key={s} value={Math.ceil(s / 12)}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className={btn(activeFormats.bold)} title="Bold">
                                    <Bold size={18} />
                                </button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className={btn(activeFormats.italic)} title="Italic">
                                    <Italic size={18} />
                                </button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} className={btn(activeFormats.underline)} title="Underline">
                                    <Underline size={18} />
                                </button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('strikeThrough'); }} className={btn(activeFormats.strikethrough)} title="Strikethrough">
                                    <Strikethrough size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }} className={btn(false)} title="Align Left">
                                    <AlignLeft size={18} />
                                </button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }} className={btn(false)} title="Center">
                                    <AlignCenter size={18} />
                                </button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyRight'); }} className={btn(false)} title="Align Right">
                                    <AlignRight size={18} />
                                </button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyFull'); }} className={btn(false)} title="Justify">
                                    <AlignJustify size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} className={btn(activeFormats.insertUnorderedList)} title="Bullets">
                                    <List size={18} />
                                </button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }} className={btn(activeFormats.insertOrderedList)} title="Numbering">
                                    <ListOrdered size={18} />
                                </button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('indent'); }} className={btn(false)} title="Indent">
                                    <Indent size={18} />
                                </button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('outdent'); }} className={btn(false)} title="Outdent">
                                    <Outdent size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
                                <button onClick={() => fileInputRef.current?.click()} className={btn(false)} title="Insert Picture">
                                    <FileImage size={18} />
                                </button>
                                <button onClick={insertTable} className={btn(false)} title="Insert Table">
                                    <Table size={18} />
                                </button>
                                <button onClick={insertVerticalLines} className={btn(false)} title="Insert Lines (|||)">
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
                )}

                {/* Ruler - Hide if ReadOnly */}
                {!readOnly && (
                    <EditorRuler
                        paperWidthMm={widthMm}
                        marginLeft={settings.margins.left}
                        marginRight={settings.margins.right}
                        zoom={zoom}
                    />
                )}

                {/* Editor Area - Word-like */}
                <div className="flex-1 overflow-auto bg-gray-200 editor-scroll">
                    <div className="flex justify-center py-8">
                        <div
                            className="word-page editor-content"
                            style={{
                                width: `${paperWidthPx * zoom}px`,
                                minHeight: `${paperHeightPx * zoom}px`,
                                padding: `${settings.margins.top * 37.795 * zoom}px ${settings.margins.right * 37.795 * zoom}px ${settings.margins.bottom * 37.795 * zoom}px ${settings.margins.left * 37.795 * zoom}px`,
                                transformOrigin: 'top center',
                            }}
                        >
                            <div
                                ref={editorRef}
                                contentEditable={!readOnly}
                                suppressContentEditableWarning
                                onInput={!readOnly ? handleInput : undefined}
                                className="outline-none min-h-full"
                                style={{
                                    fontSize: `${settings.font.size * zoom}pt`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="status-bar bg-gray-100 border-t border-gray-300 px-4 py-1.5 flex items-center justify-between text-xs text-gray-700">
                    <div className="flex items-center gap-4">
                        <span className="font-medium">Page 1</span>
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

export default PaperEditor;
