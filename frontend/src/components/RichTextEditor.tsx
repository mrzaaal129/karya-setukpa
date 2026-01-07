import React from 'react';
import TinyMCEEditor from './TinyMCEEditor';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    settings: {
        font: { family: string; size: number; lineHeight: number };
    };
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, settings }) => {
    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex-1 overflow-auto p-6 bg-gray-100">
                <div className="w-full min-h-full bg-white shadow-lg p-16">
                    <TinyMCEEditor
                        content={content}
                        onChange={onChange}
                        height={600}
                        placeholder="Mulai menulis di sini..."
                        enableAutoSave={true}
                        enablePasteFromWord={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default RichTextEditor;
