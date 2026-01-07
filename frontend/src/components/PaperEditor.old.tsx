import React, { useRef, useEffect, useState } from 'react';
import {
    Undo2, Redo2, Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Indent, Outdent,
    Link2, Image as ImageIcon, Table, Palette, Highlighter, Eraser,
    Minus, GripHorizontal, FileImage
} from 'lucide-react';

interface PaperEditorProps {
    content: string;
    onChange: (content: string) => void;
    settings: {
        paperSize: 'A4' | 'Letter';
        orientation: 'portrait' | 'landscape';
        margins: { top: number; right: number; bottom: number; left: number };
        font: { family: string; size: number; lineHeight: number };
    };
}

const PaperEditor: React.FC<PaperEditorProps> = ({ content, onChange, settings }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
                    const imgHtml = `<img src="${event.target.result}" style="max-width: 100%; height: auto; resize: both; overflow: auto;" />`;
                    execCmd('insertHTML', imgHtml);
                }
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const triggerImageUpload = () => {
        fileInputRef.current?.click();
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
        const linesHtml = `<div style="text-align: center; font-size: 48pt; font-weight: bold; line-height: 1; margin: 1cm 0;">|||</div><p><br></p>`;
        execCmd('insertHTML', linesHtml);
    };

    const insertHorizontalLine = () => {
        execCmd('insertHorizontalRule');
    };

    const isPortrait = settings.orientation === 'portrait';
    const paperWidth = isPortrait ? '210mm' : '297mm';
    const paperHeight = isPortrait ? '297mm' : '210mm';

    const btn = (isActive: boolean) =>
        `p-2 rounded transition-all ${isActive ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`;

    return (
        <>
            <style>{`
        @media print {
          .toolbar { display: none !important; }
          @page { size: A4 portrait; margin: ${settings.margins.top}cm ${settings.margins.right}cm ${settings.margins.bottom}cm ${settings.margins.left}cm; }
        }
        .editor-content { font-family: ${settings.font.family}; font-size: ${settings.font.size}pt; line-height: ${settings.font.lineHeight}; }
        .editor-content h1 { page-break-before: always; font-size: 18pt; font-weight: bold; text-align: center; margin: 1em 0; }
        .editor-content h1:first-child { page-break-before: avoid; }
        .editor-content h2 { font-size: 16pt; font-weight: bold; margin: 0.8em 0; }
        .editor-content h3 { font-size: 14pt; font-weight: bold; margin: 0.6em 0; }
        .editor-content p { text-align: justify; margin: 0.5em 0; }
        .editor-content ul { list-style-type: disc; margin: 0.5em 0; padding-left: 2.5em; }
        .editor-content ul ul { list-style-type: circle; }
        .editor-content ul ul ul { list-style-type: square; }
        .editor-content ol { list-style-type: decimal; margin: 0.5em 0; padding-left: 2.5em; }
        .editor-content ol ol { list-style-type: lower-alpha; }
        .editor-content ol ol ol { list-style-type: lower-roman; }
        .editor-content li { margin: 0.3em 0; }
        .editor-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        .editor-content table td, .editor-content table th { padding: 8px; }
        .editor-content img { max-width: 100%; height: auto; cursor: pointer; }
        
        /* Scrollbar styling for editor */
        .editor-scroll::-webkit-scrollbar { width: 8px; }
        .editor-scroll::-webkit-scrollbar-track { bg-gray-100; }
        .editor-scroll::-webkit-scrollbar-thumb { bg-gray-300; rounded: 4px; }
      `}</style>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
            />

            <div className="flex flex-col h-full bg-white">
                <div className="toolbar border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
                    <div className="flex flex-wrap items-center gap-1">
                        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-2">
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('undo'); }} className={btn(false)} title="Undo">
                                <Undo2 size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('redo'); }} className={btn(false)} title="Redo">
                                <Redo2 size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
                            <select onChange={(e) => execCmd('fontName', e.target.value)} className="px-2 py-1 text-sm border border-gray-300 rounded">
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Arial">Arial</option>
                                <option value="Calibri">Calibri</option>
                                <option value="Georgia">Georgia</option>
                            </select>
                            <select onChange={(e) => execCmd('fontSize', e.target.value)} className="px-2 py-1 text-sm border border-gray-300 rounded">
                                {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72].map(s => (
                                    <option key={s} value={Math.ceil(s / 12)}>{s}pt</option>
                                ))}
                            </select>
                        </div>

                        <div className="border-r border-gray-200 pr-2 mr-2">
                            <select onChange={(e) => { if (e.target.value) { execCmd('formatBlock', e.target.value); e.target.value = ''; } }} className="px-2 py-1 text-sm border border-gray-300 rounded" defaultValue="">
                                <option value="">Styles</option>
                                <option value="h1">Heading 1 (BAB)</option>
                                <option value="h2">Heading 2 (Sub-BAB)</option>
                                <option value="h3">Heading 3</option>
                                <option value="p">Normal</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-2">
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

                        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
                            <label className="cursor-pointer p-2 rounded hover:bg-gray-100" title="Text Color">
                                <Palette size={18} />
                                <input type="color" onChange={(e) => execCmd('foreColor', e.target.value)} className="hidden" />
                            </label>
                            <label className="cursor-pointer p-2 rounded hover:bg-gray-100" title="Highlight">
                                <Highlighter size={18} />
                                <input type="color" onChange={(e) => execCmd('backColor', e.target.value)} className="hidden" />
                            </label>
                        </div>

                        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-2">
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

                        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-2">
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} className={btn(activeFormats.insertUnorderedList)} title="Bullet List">
                                <List size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }} className={btn(activeFormats.insertOrderedList)} title="Numbered List">
                                <ListOrdered size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('indent'); }} className={btn(false)} title="Indent">
                                <Indent size={18} />
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('outdent'); }} className={btn(false)} title="Outdent">
                                <Outdent size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-2">
                            <button onClick={insertLink} className={btn(false)} title="Insert Link">
                                <Link2 size={18} />
                            </button>
                            <button onClick={triggerImageUpload} className={btn(false)} title="Upload Image">
                                <FileImage size={18} />
                            </button>
                            <button onClick={insertTable} className={btn(false)} title="Insert Table">
                                <Table size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-2">
                            <button onClick={insertVerticalLines} className={btn(false)} title="Insert Vertical Lines (|||)">
                                <GripHorizontal size={18} className="rotate-90" />
                            </button>
                            <button onClick={insertHorizontalLine} className={btn(false)} title="Horizontal Line">
                                <Minus size={18} />
                            </button>
                        </div>

                        <button onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }} className={btn(false)} title="Clear Formatting">
                            <Eraser size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-gray-100 p-8 editor-scroll">
                    <div
                        className="mx-auto bg-white shadow-2xl editor-content relative"
                        style={{
                            width: paperWidth,
                            height: paperHeight,
                            padding: `${settings.margins.top}cm ${settings.margins.right}cm ${settings.margins.bottom}cm ${settings.margins.left}cm`,
                            overflow: 'hidden',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleInput}
                            className="outline-none h-full w-full"
                        />

                        {/* Visual Page Boundary Indicator */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-100 opacity-50 pointer-events-none" title="End of Page"></div>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-2">
                        Batas akhir halaman A4. Konten yang melebihi batas tidak akan tercetak.
                    </p>
                </div>

                <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-600">
                    💡 <strong>Tips:</strong> Gunakan tombol gambar untuk upload dari komputer. Klik gambar untuk resize.
                </div>
            </div>
        </>
    );
};

export default PaperEditor;
