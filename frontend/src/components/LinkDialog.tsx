import React, { useState } from 'react';

interface LinkDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (url: string, text: string) => void;
    initialText?: string;
}

const LinkDialog: React.FC<LinkDialogProps> = ({ isOpen, onClose, onInsert, initialText = '' }) => {
    const [url, setUrl] = useState('');
    const [text, setText] = useState(initialText);

    const handleInsert = () => {
        if (url.trim()) {
            onInsert(url, text || url);
            setUrl('');
            setText('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-50 w-96">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Insert Link</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Text to display</label>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Link text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleInsert()}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleInsert}
                        disabled={!url.trim()}
                        className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Insert Link
                    </button>
                </div>
            </div>
        </>
    );
};

export default LinkDialog;
