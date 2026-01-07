import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnlyOfficeEditor from '../components/OnlyOfficeEditor';
import { ArrowLeft, FileText } from 'lucide-react';

const OnlyOfficeDemo: React.FC = () => {
    const navigate = useNavigate();
    const [documentId] = useState(`demo_${Date.now()}`);

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
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="w-6 h-6" />
                                Demo: OnlyOffice Document Editor
                            </h1>
                            <p className="text-xs text-gray-500">
                                Editor profesional seperti Microsoft Word - 100% kompatibel dengan .docx
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
                <div className="max-w-7xl mx-auto">
                    <p className="text-sm text-blue-800">
                        <strong>Fitur OnlyOffice:</strong> Edit kop surat di header, posisikan gambar dengan drag & drop,
                        semua fitur Word tersedia, auto-save, export ke .docx
                    </p>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
                <OnlyOfficeEditor
                    documentId={documentId}
                    documentTitle="Demo Template Makalah SETUKPA"
                    mode="edit"
                    userId="admin-1"
                    userName="Admin Demo"
                />
            </div>
        </div>
    );
};

export default OnlyOfficeDemo;
