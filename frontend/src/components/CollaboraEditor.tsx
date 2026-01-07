import React, { useEffect, useRef, useState } from 'react';

interface CollaboraEditorProps {
    documentId: string;
    documentTitle: string;
    onSave?: () => void;
    mode?: 'edit' | 'view';
}

const CollaboraEditor: React.FC<CollaboraEditorProps> = ({
    documentId,
    documentTitle,
    onSave,
    mode = 'edit'
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('🚀 CollaboraEditor mounted');
        try {
            // Build WOPI URL - Use LAN IP for robust Docker-to-Host connection
            // IP: 192.168.1.7 (Detected from ipconfig)
            const wopiSrc = `http://192.168.1.7:3001/api/wopi/files/${documentId}`;
            const accessToken = 'demo-token';

            // Collabora URL with WOPI source (COOL version)
            // Use LAN IP for iframe to match WOPI host IP context
            const collaboraUrl = `http://192.168.1.7:9980/browser/dist/cool.html?WOPISrc=${encodeURIComponent(wopiSrc)}&access_token=${accessToken}&title=${encodeURIComponent(documentTitle)}&permission=${mode}`;

            console.log('📄 Loading Collabora with URL:', collaboraUrl);

            if (iframeRef.current) {
                iframeRef.current.src = collaboraUrl;

                iframeRef.current.onload = () => {
                    console.log('✅ Collabora iframe loaded (onload event)');
                    setIsLoading(false);
                };

                iframeRef.current.onerror = () => {
                    console.error('❌ Collabora iframe error event');
                    setError('Failed to load Collabora editor (iframe error)');
                    setIsLoading(false);
                };
            }
        } catch (err) {
            console.error('❌ Error setting up Collabora:', err);
            setError(`Failed to initialize: ${err}`);
            setIsLoading(false);
        }
    }, [documentId, documentTitle, mode]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="text-red-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Collabora Error</h3>
                    <p className="text-sm text-gray-600 mb-4">{error}</p>
                    <div className="text-xs text-gray-500 text-left bg-gray-50 p-3 rounded">
                        <p className="font-semibold mb-1">Troubleshooting:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Pastikan Docker Collabora running (Port 9980)</li>
                            <li>Pastikan Backend running (Port 3001)</li>
                            <li>Coba refresh halaman</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative bg-gray-100">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-medium text-gray-900">Memuat Editor...</h3>
                        <p className="text-sm text-gray-500 mt-2">Menghubungkan ke Collabora Online</p>
                    </div>
                </div>
            )}
            <iframe
                ref={iframeRef}
                className="w-full h-full block"
                allow="clipboard-read; clipboard-write; fullscreen"
                title={documentTitle}
                style={{ minHeight: '600px', border: '2px solid red' }}
            />
        </div>
    );
};

export default CollaboraEditor;
