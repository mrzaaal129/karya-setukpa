import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MultiPageEditor from '../components/MultiPageEditor';
import { PageSettings } from '../types';
import { ArrowLeft } from 'lucide-react';

const MultiPageEditorDemo: React.FC = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState('');

    const [settings] = useState<PageSettings>({
        paperSize: 'A4',
        orientation: 'portrait',
        margins: { top: 3, right: 3, bottom: 3, left: 4 },
        font: { family: 'Times New Roman', size: 12, lineHeight: 1.5 },
        paragraph: { indent: 1.27, spacing: 1.5 }
    });

    // Kop surat SETUKPA
    const headerContent = `
    <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 8px; margin-bottom: 16px;">
      <p style="font-weight: bold; margin: 0; font-size: 12pt;">LEMBAGA PENDIDIKAN DAN PELATIHAN POLRI</p>
      <p style="font-weight: bold; margin: 0; font-size: 12pt;">SEKOLAH PEMBENTUKAN PERWIRA</p>
    </div>
  `;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Kembali"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Demo: Multi-Page Rich Text Editor
                            </h1>
                            <p className="text-xs text-gray-500">
                                Editor dengan halaman otomatis, kop surat, dan penomoran halaman
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
                <MultiPageEditor
                    initialContent="<h1>KARYA TULIS TERAPAN</h1><p>Mulai menulis makalah Anda di sini...</p>"
                    onChange={setContent}
                    settings={settings}
                    header={headerContent}
                    showHeaderOnFirstPageOnly={false}
                />
            </div>
        </div>
    );
};

export default MultiPageEditorDemo;
