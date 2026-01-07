import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Loader, FileText } from 'lucide-react';
import axios from 'axios';

interface InlineWordImportProps {
    onImportSuccess: (templateData: any) => void;
}

const InlineWordImport: React.FC<InlineWordImportProps> = ({ onImportSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    console.log('InlineWordImport component rendered!');

    const handleFileSelect = async (file: File) => {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.docx')) {
            setError('Hanya file .docx yang didukung');
            return;
        }

        // Validate file size (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Ukuran file maksimal 10MB');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name.replace('.docx', ''));
            formData.append('description', `Imported from ${file.name}`);

            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:3000/api/templates/import/word',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Success - pass template data to parent
            onImportSuccess(response.data.template);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (err: any) {
            console.error('Upload error:', err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.details ||
                'Gagal mengupload file. Silakan coba lagi.'
            );
        } finally {
            setUploading(false);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="inline-block">
            <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={handleFileInputChange}
                disabled={uploading}
                className="hidden"
            />

            <button
                onClick={triggerFileInput}
                disabled={uploading}
                className="px-4 py-2.5 font-semibold text-blue-600 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50 shadow-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {uploading ? (
                    <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Mengimport...</span>
                    </>
                ) : (
                    <>
                        <Upload className="w-5 h-5" />
                        <span>Import dari Word</span>
                    </>
                )}
            </button>

            {error && (
                <div className="absolute top-full left-0 mt-2 w-96 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg z-50">
                    <div className="flex gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Error</p>
                            <p className="text-xs text-red-700 mt-0.5">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-400 hover:text-red-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InlineWordImport;
