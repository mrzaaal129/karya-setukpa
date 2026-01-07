import React, { useRef } from 'react';
import { 
  BoldIcon, ItalicIcon, UnderlineIcon, TableIcon, ImageIcon, 
  LinkIcon, UndoIcon, RedoIcon 
} from './icons';

interface WordToolbarProps {
  onCommand: (command: string, value?: string) => void;
  activeFormats: Record<string, boolean>;
}

const WordToolbar: React.FC<WordToolbarProps> = ({ onCommand, activeFormats }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const FONTS = ['Times New Roman', 'Arial', 'Calibri', 'Georgia', 'Verdana', 'Courier New'];
  const SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const imgHTML = `<img src="${base64}" style="max-width: 100%; height: auto; display: block; margin: 1em auto;" alt="Gambar" />`;
        onCommand('insertHTML', imgHTML);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      onCommand('insertHTML', tableHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Masukkan URL:');
    if (url) onCommand('createLink', url);
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    title: string;
    icon?: React.ReactNode;
    label?: string;
  }> = ({ onClick, active, title, icon, label }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded transition-all font-medium flex items-center gap-1.5 ${
        active 
          ? 'bg-blue-500 text-white shadow-md' 
          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
      }`}
      title={title}
    >
      {icon}
      {label && <span className="text-sm">{label}</span>}
    </button>
  );

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300 p-3 space-y-3 sticky top-0 z-20 shadow-md">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      
      {/* Row 1: Font & Size */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-300">
          <label className="text-xs font-bold text-gray-600">Font:</label>
          <select 
            onChange={(e) => onCommand('fontName', e.target.value)}
            className="text-sm border-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            {FONTS.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-300">
          <label className="text-xs font-bold text-gray-600">Size:</label>
          <select 
            onChange={(e) => onCommand('fontSize', e.target.value)}
            className="text-sm border-none focus:ring-2 focus:ring-blue-500 rounded w-20"
            defaultValue="12"
          >
            {SIZES.map(size => (
              <option key={size} value={size}>{size}pt</option>
            ))}
          </select>
        </div>

        <div className="h-8 w-px bg-gray-400"></div>

        <ToolbarButton onClick={() => onCommand('undo')} title="Undo (Ctrl+Z)" icon={<UndoIcon className="w-4 h-4" />} />
        <ToolbarButton onClick={() => onCommand('redo')} title="Redo (Ctrl+Y)" icon={<RedoIcon className="w-4 h-4" />} />
      </div>

      {/* Row 2: Formatting */}
      <div className="flex items-center gap-2 flex-wrap">
        <ToolbarButton 
          onClick={() => onCommand('bold')} 
          active={activeFormats.bold}
          title="Bold (Ctrl+B)" 
          icon={<BoldIcon className="w-5 h-5" />}
          label="Bold"
        />
        <ToolbarButton 
          onClick={() => onCommand('italic')} 
          active={activeFormats.italic}
          title="Italic (Ctrl+I)" 
          icon={<ItalicIcon className="w-5 h-5" />}
          label="Italic"
        />
        <ToolbarButton 
          onClick={() => onCommand('underline')} 
          active={activeFormats.underline}
          title="Underline (Ctrl+U)" 
          icon={<UnderlineIcon className="w-5 h-5" />}
          label="Underline"
        />

        <div className="h-8 w-px bg-gray-400"></div>

        <ToolbarButton onClick={() => onCommand('justifyLeft')} active={activeFormats.justifyLeft} title="Align Left" label="⇤ Left" />
        <ToolbarButton onClick={() => onCommand('justifyCenter')} active={activeFormats.justifyCenter} title="Center" label="⇔ Center" />
        <ToolbarButton onClick={() => onCommand('justifyRight')} active={activeFormats.justifyRight} title="Align Right" label="Right ⇥" />
        <ToolbarButton onClick={() => onCommand('justifyFull')} active={activeFormats.justifyFull} title="Justify" label="≡ Justify" />

        <div className="h-8 w-px bg-gray-400"></div>

        <ToolbarButton onClick={() => onCommand('insertUnorderedList')} title="Bullet List" label="• Bullets" />
        <ToolbarButton onClick={() => onCommand('insertOrderedList')} title="Numbered List" label="1. Numbering" />

        <div className="h-8 w-px bg-gray-400"></div>

        <ToolbarButton onClick={insertTable} title="Insert Table" icon={<TableIcon className="w-5 h-5" />} label="Table" />
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Insert Image" icon={<ImageIcon className="w-5 h-5" />} label="Image" />
        <ToolbarButton onClick={insertLink} title="Insert Link" icon={<LinkIcon className="w-5 h-5" />} label="Link" />

        <div className="h-8 w-px bg-gray-400"></div>

        <ToolbarButton onClick={() => onCommand('removeFormat')} title="Clear Formatting" label="✖ Clear" />
      </div>
    </div>
  );
};

export default WordToolbar;