import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PageSettings, PageNumbering } from '../types';
import TinyMCEEditor from './TinyMCEEditor';

interface TemplatePageEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  settings: PageSettings;
  mode?: 'preview' | 'edit';
  readOnly?: boolean;
  onPaste?: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  pageNumber?: number;
  numbering?: PageNumbering;
}

const FONT_FAMILIES = [
  'Times New Roman',
  'Arial',
  'Calibri',
  'Georgia',
  'Verdana',
  'Courier New',
  'Comic Sans MS',
  'Trebuchet MS'
];

const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];

function toRoman(num: number): string {
  if (isNaN(num) || num < 1) return '';
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];

  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

const TemplatePageEditor: React.FC<TemplatePageEditorProps> = ({
  content = '',
  onChange = () => { },
  settings,
  mode = 'preview',
  readOnly = false,
  onPaste,
  pageNumber,
  numbering
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [currentFont, setCurrentFont] = useState('Times New Roman');
  const [currentSize, setCurrentSize] = useState('12');
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content]);

  const updateToolbarState = useCallback(() => {
    if (!editorRef.current || !document.getSelection()?.rangeCount) return;

    const formats: Record<string, boolean> = {};
    formats.bold = document.queryCommandState('bold');
    formats.italic = document.queryCommandState('italic');
    formats.underline = document.queryCommandState('underline');
    formats.strikethrough = document.queryCommandState('strikeThrough');
    formats.justifyLeft = document.queryCommandState('justifyLeft');
    formats.justifyCenter = document.queryCommandState('justifyCenter');
    formats.justifyRight = document.queryCommandState('justifyRight');
    formats.justifyFull = document.queryCommandState('justifyFull');

    setActiveFormats(formats);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // FIX: Wrap updateToolbarState in an anonymous function to ensure correct callback signature for requestAnimationFrame.
    const handleStateChange = () => requestAnimationFrame(() => updateToolbarState());
    document.addEventListener('selectionchange', handleStateChange);
    editor.addEventListener('click', handleStateChange);
    editor.addEventListener('keyup', handleStateChange);

    return () => {
      document.removeEventListener('selectionchange', handleStateChange);
      editor.removeEventListener('click', handleStateChange);
      editor.removeEventListener('keyup', handleStateChange);
    };
  }, [updateToolbarState]);

  const paperDimensions = {
    A4: { widthCm: 21, heightCm: 29.7 },
    Letter: { widthCm: 21.6, heightCm: 27.9 },
  };

  const updateScale = useCallback(() => {
    if (mode !== 'preview' || !viewportRef.current) {
      setScale(1);
      return;
    }
    const { width: viewportWidth } = viewportRef.current.getBoundingClientRect();
    const paperWidthPx = paperDimensions[settings.paperSize].widthCm * 37.795;
    const newScale = (viewportWidth - 32) / paperWidthPx;
    setScale(Math.min(1, newScale));
  }, [mode, settings.paperSize]);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  const handleInput = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateToolbarState();
    handleInput();
  };

  const changeFontFamily = (font: string) => {
    setCurrentFont(font);
    execCommand('fontName', font);
  };

  const changeFontSize = (size: string) => {
    setCurrentSize(size);
    execCommand('fontSize', '7');
    const fontElements = editorRef.current?.querySelectorAll('font[size="7"]');
    fontElements?.forEach(el => {
      el.removeAttribute('size');
      (el as HTMLElement).style.fontSize = size + 'pt';
    });
    handleInput();
  };

  const insertTable = () => {
    const rows = prompt('Jumlah baris:', '3');
    const cols = prompt('Jumlah kolom:', '3');

    if (rows && cols && parseInt(rows) > 0 && parseInt(cols) > 0) {
      let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 1em 0;">';
      tableHTML += '<thead><tr>';
      for (let j = 0; j < parseInt(cols); j++) {
        tableHTML += `<th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0;">Header ${j + 1}</th>`;
      }
      tableHTML += '</tr></thead><tbody>';

      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += '<td style="border: 1px solid #000; padding: 8px;">Cell</td>';
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</tbody></table><p><br></p>';

      execCommand('insertHTML', tableHTML);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const imgHTML = `<img src="${base64}" style="max-width: 100%; height: auto; display: block; margin: 1em auto;" alt="Gambar" />`;
        execCommand('insertHTML', imgHTML);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertImageURL = () => {
    const url = prompt('Masukkan URL gambar:');
    if (url) {
      const imgHTML = `<img src="${url}" style="max-width: 100%; height: auto; display: block; margin: 1em auto;" alt="Gambar" />`;
      execCommand('insertHTML', imgHTML);
    }
  };

  const pageStyle: React.CSSProperties = {
    width: `${paperDimensions[settings.paperSize].widthCm}cm`,
    minHeight: `${paperDimensions[settings.paperSize].heightCm}cm`,
    ...(mode === 'preview' && { transform: `scale(${scale})` }),
  };

  const contentStyle: React.CSSProperties = {
    paddingTop: `${settings.margins.top}cm`,
    paddingBottom: `${settings.margins.bottom}cm`,
    paddingLeft: `${settings.margins.left}cm`,
    paddingRight: `${settings.margins.right}cm`,
    fontFamily: settings.font.family,
    fontSize: `${settings.font.size}pt`,
    lineHeight: settings.font.lineHeight,
  };

  const ToolbarButton: React.FC<{
    active?: boolean;
    onClick: () => void;
    title: string;
    icon?: React.ReactNode;
    label: string;
  }> = ({ active, onClick, title, icon, label }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium rounded transition-colors flex items-center gap-1.5 ${active
        ? 'bg-blue-100 text-blue-700 border border-blue-300'
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      title={title}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const editorComponent = (
    <>
      <style>{`
        .editor-content {
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: pre-wrap;
        }
        .editor-content p {
          margin-bottom: 1em;
          margin-top: 0;
        }
        .editor-content p:last-child {
          margin-bottom: 0;
        }
        .editor-content h1,
        .editor-content h2,
        .editor-content h3,
        .editor-content h4,
        .editor-content h5,
        .editor-content h6 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-weight: bold;
        }
        .editor-content h1 { font-size: 2em; }
        .editor-content h2 { font-size: 1.5em; }
        .editor-content h3 { font-size: 1.17em; }
        .editor-content ul,
        .editor-content ol {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          padding-left: 2em;
        }
        .editor-content li {
          margin-bottom: 0.25em;
        }
        .editor-content blockquote {
          margin: 1em 0;
          padding-left: 1em;
          border-left: 3px solid #ccc;
          color: #666;
        }
        .editor-content table {
          border-collapse: collapse;
          margin: 1em 0;
        }
        .editor-content td,
        .editor-content th {
          border: 1px solid #000;
          padding: 8px;
        }
        .editor-content img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
      <div className="paper-sheet relative" style={pageStyle}>
        {/* Page Number - TOP CENTER */}
        {numbering && numbering.position === 'top-center' && numbering.type !== 'none' && pageNumber && (
          <div
            className="absolute text-center w-full"
            style={{
              top: `${settings.margins.top / 2}cm`,
              fontSize: `${settings.font.size}pt`,
              fontFamily: settings.font.family,
            }}
          >
            {numbering.type === 'roman' ? toRoman(pageNumber).toLowerCase() : pageNumber}
          </div>
        )}

        {!readOnly && (
          <div className="bg-white border-b border-gray-300 p-3 space-y-3">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

            {/* Row 1: Font Controls */}
            <div className="flex items-center gap-2 flex-wrap pb-3 border-b">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Font:</label>
                <select
                  value={currentFont}
                  onChange={(e) => changeFontFamily(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: currentFont }}
                >
                  {FONT_FAMILIES.map(font => (
                    <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Size:</label>
                <select
                  value={currentSize}
                  onChange={(e) => changeFontSize(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 w-20"
                >
                  {FONT_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Color:</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => { setTextColor(e.target.value); execCommand('foreColor', e.target.value); }}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  title="Text Color"
                />
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => { setHighlightColor(e.target.value); execCommand('backColor', e.target.value); }}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  title="Highlight"
                />
              </div>
            </div>

            {/* Row 2: Format Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <ToolbarButton
                active={activeFormats.bold}
                onClick={() => execCommand('bold')}
                title="Bold (Ctrl+B)"
                icon={<span className="font-bold">B</span>}
                label="Bold"
              />
              <ToolbarButton
                active={activeFormats.italic}
                onClick={() => execCommand('italic')}
                title="Italic (Ctrl+I)"
                icon={<span className="italic">I</span>}
                label="Italic"
              />
              <ToolbarButton
                active={activeFormats.underline}
                onClick={() => execCommand('underline')}
                title="Underline (Ctrl+U)"
                icon={<span className="underline">U</span>}
                label="Underline"
              />
              <ToolbarButton
                active={activeFormats.strikethrough}
                onClick={() => execCommand('strikeThrough')}
                title="Strikethrough"
                icon={<span className="line-through">S</span>}
                label="Strike"
              />

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

              <ToolbarButton
                active={activeFormats.justifyLeft}
                onClick={() => execCommand('justifyLeft')}
                title="Align Left"
                icon={<span>≡</span>}
                label="Left"
              />
              <ToolbarButton
                active={activeFormats.justifyCenter}
                onClick={() => execCommand('justifyCenter')}
                title="Align Center"
                icon={<span>≡</span>}
                label="Center"
              />
              <ToolbarButton
                active={activeFormats.justifyRight}
                onClick={() => execCommand('justifyRight')}
                title="Align Right"
                icon={<span>≡</span>}
                label="Right"
              />
              <ToolbarButton
                active={activeFormats.justifyFull}
                onClick={() => execCommand('justifyFull')}
                title="Justify"
                icon={<span>≡</span>}
                label="Justify"
              />

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

              <ToolbarButton
                onClick={() => execCommand('insertUnorderedList')}
                title="Bullet List"
                icon={<span>•</span>}
                label="Bullets"
              />
              <ToolbarButton
                onClick={() => execCommand('insertOrderedList')}
                title="Numbered List"
                icon={<span>1.</span>}
                label="Numbering"
              />

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

              <ToolbarButton
                onClick={insertTable}
                title="Insert Table"
                icon={<span>⊞</span>}
                label="Table"
              />
              <ToolbarButton
                onClick={() => fileInputRef.current?.click()}
                title="Upload Image"
                icon={<span>🖼️</span>}
                label="Image"
              />
              <ToolbarButton
                onClick={insertImageURL}
                title="Insert Image from URL"
                icon={<span>🔗</span>}
                label="URL Image"
              />

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

              <ToolbarButton
                onClick={() => execCommand('formatBlock', 'h1')}
                title="Heading 1"
                label="Heading 1"
              />
              <ToolbarButton
                onClick={() => execCommand('formatBlock', 'h2')}
                title="Heading 2"
                label="Heading 2"
              />
              <ToolbarButton
                onClick={() => execCommand('formatBlock', 'p')}
                title="Normal"
                label="Normal"
              />
            </div>
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable={!readOnly}
          onInput={handleInput}
          onPaste={onPaste}
          className="editor-content"
          style={contentStyle}
          suppressContentEditableWarning
        />

        {/* Page Number - BOTTOM CENTER */}
        {numbering && numbering.position === 'bottom-center' && numbering.type !== 'none' && pageNumber && (
          <div
            className="absolute text-center w-full"
            style={{
              bottom: `${settings.margins.bottom / 2}cm`,
              fontSize: `${settings.font.size}pt`,
              fontFamily: settings.font.family,
            }}
          >
            {numbering.type === 'roman' ? toRoman(pageNumber).toLowerCase() : pageNumber}
          </div>
        )}
      </div>
    </>
  );

  if (mode === 'preview') {
    return <div ref={viewportRef} className="paper-viewport">{editorComponent}</div>;
  }

  return editorComponent;
};

export default TemplatePageEditor;
