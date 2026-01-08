import React, { useState } from 'react';
import { DocumentEditor } from '@onlyoffice/document-editor-react';
import { API_URL } from '../services/api';

interface OnlyOfficeEditorProps {
    documentId: string;
    documentTitle: string;
    onSave?: (content: any) => void;
    mode?: 'edit' | 'view';
    userId?: string;
    userName?: string;
}

const OnlyOfficeEditor: React.FC<OnlyOfficeEditorProps> = ({
    documentId,
    documentTitle,
    onSave,
    mode = 'edit',
    userId = 'user-1',
    userName = 'User'
}) => {
    const [error, setError] = useState<string | null>(null);

    // Ensure absolute URL for OnlyOffice callbacks
    const absoluteApiUrl = API_URL.startsWith('http')
        ? API_URL
        : `${window.location.origin}${API_URL}`;

    const config = {
        documentType: 'word',
        document: {
            fileType: 'docx',
            key: documentId, // Unique document key - change this to force reload
            title: documentTitle,
            url: `${absoluteApiUrl}/documents/${documentId}/download`,
            permissions: {
                edit: mode === 'edit',
                download: true,
                print: true,
                review: true,
                comment: true,
            }
        },
        editorConfig: {
            mode: mode,
            lang: 'id-ID', // Indonesian
            callbackUrl: `${absoluteApiUrl}/documents/${documentId}/save`,
            user: {
                id: userId,
                name: userName
            },
            customization: {
                forcesave: true,
                autosave: true,
                compactToolbar: false,
                feedback: false,
                help: false,
                hideRightMenu: false,
            }
        },
        height: '100%',
        width: '100%',
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="text-red-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">OnlyOffice Error</h3>
                    <p className="text-sm text-gray-600 mb-4">{error}</p>
                    <div className="text-xs text-gray-500">
                        <p>Pastikan:</p>
                        <ul className="list-disc list-inside mt-2">
                            <li>Docker OnlyOffice sudah running</li>
                            <li>Port 8080 tidak diblok</li>
                            <li>Backend API running di port 3000</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <DocumentEditor
                id="onlyoffice-editor"
                documentServerUrl="http://localhost:8080/"
                config={config}
                onDocumentReady={() => {
                    console.log('✅ OnlyOffice Document ready:', documentTitle);
                }}
                onError={(error) => {
                    console.error('❌ OnlyOffice error:', error);
                    setError(`Failed to load editor: ${JSON.stringify(error)}`);
                }}
            />
        </div>
    );
};

export default OnlyOfficeEditor;
