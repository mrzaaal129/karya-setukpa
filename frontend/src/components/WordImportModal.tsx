import React, { useState } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import axios from 'axios';

interface WordImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (templateId: string) => void;
}

const WordImportModal: React.FC<WordImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [templateName, setTemplateName] = useState('');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    if (!isOpen) return null;

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (selectedFile: File) => {
        // Validate file type
        if (!selectedFile.name.toLowerCase().endsWith('.docx')) {
            setError('Hanya file .docx yang didukung');
            return;
        }

        // Validate file size (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
            setError('Ukuran file maksimal 10MB');
            return;
        }

        setFile(selectedFile);
        setError(null);

        // Auto-fill template name from filename if empty
        if (!templateName) {
            const name = selectedFile.name.replace('.docx', '');
            setTemplateName(name);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setError('Pilih file Word terlebih dahulu');
            return;
        }

        if (!templateName.trim()) {
            setError('Nama template harus diisi');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', templateName);
            formData.append('description', description);

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

            // Success
            const templateId = response.data.template.id;
            onSuccess(templateId);
            handleClose();

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

    const handleClose = () => {
        setFile(null);
        setTemplateName('');
        setDescription('');
        setError(null);
        setUploading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Upload className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Import dari Word</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Upload file .docx untuk dijadikan template</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={uploading}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* File Upload Area */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            File Word (.docx)
                        </label>
                        <div
                            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                                    ? 'border-blue-500 bg-blue-50'
                                    : file
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                accept=".docx"
                                onChange={handleFileInputChange}
                                disabled={uploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />

                            {file ? (
                                <div className="flex items-center justify-center gap-3">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">{file.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-700 font-medium mb-1">
                                        Drag & drop file Word di sini
                                    </p>
                                    <p className="text-sm text-gray-500">atau klik untuk memilih file</p>
                                    <p className="text-xs text-gray-400 mt-2">Maksimal 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Template Name */}
                    <div>
                        <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Template <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="templateName"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            disabled={uploading}
                            placeholder="Contoh: Template Makalah Setukpa 2024"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Deskripsi (Opsional)
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={uploading}
                            placeholder="Deskripsi singkat tentang template ini..."
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <p className="font-medium mb-1">Catatan Penting:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-800">
                                    <li>Konten akan dikonversi otomatis ke format template</li>
                                    <li>Anda dapat mengedit dan menyempurnakan template setelah import</li>
                                    <li>Beberapa formatting kompleks mungkin perlu penyesuaian manual</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={uploading}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || !file}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Mengupload...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Import Template
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WordImportModal;
