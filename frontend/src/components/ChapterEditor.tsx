import React, { useState, useEffect } from 'react';
import { PaperStructure } from '../types';
import TinyMCEEditor from './TinyMCEEditor';

interface ChapterEditorProps {
  structure: PaperStructure[];
  content: Record<string, string>;
  onChange: (sectionId: string, newContent: string) => void;
  readOnly?: boolean;
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({
  structure,
  content,
  onChange,
  readOnly = false
}) => {
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const counts: Record<string, number> = {};
    Object.entries(content).forEach(([id, text]) => {
      // Remove HTML tags and count words
      const plainText = (text as string).replace(/<[^>]*>/g, '');
      counts[id] = plainText.trim().split(/\s+/).filter(Boolean).length;
    });
    setWordCounts(counts);
  }, [content]);

  const renderSection = (section: PaperStructure, depth: number = 0) => {
    const sectionContent = content[section.id] || '';
    const wordCount = wordCounts[section.id] || 0;
    const progress = section.minWords > 0 ? Math.min((wordCount / section.minWords) * 100, 100) : 0;
    const isChapter = section.title.startsWith('BAB');

    return (
      <div key={section.id} className={`mb-8 ${isChapter ? 'page-break-before' : ''}`}>
        {/* Chapter/Section Title */}
        <div className={`${isChapter ? 'text-center mb-6' : 'mb-4'}`}>
          <h2
            className={`font-bold ${isChapter
                ? 'text-lg' // 14pt for BAB
                : 'text-base' // 12pt for sub-bab
              }`}
            style={{
              fontSize: isChapter ? '14pt' : '12pt',
              marginTop: isChapter ? '5cm' : '0'
            }}
          >
            {section.title}
          </h2>
        </div>

        {/* TinyMCE Editor */}
        <div className="relative bg-white rounded-lg shadow-sm">
          <TinyMCEEditor
            content={sectionContent}
            onChange={(newContent) => onChange(section.id, newContent)}
            height={400}
            disabled={readOnly}
            placeholder={`Tulis ${section.title} di sini... (minimal ${section.minWords} kata)`}
            enableAutoSave={!readOnly}
            enablePasteFromWord={false}
          />

          {/* Word Counter & Progress */}
          {!readOnly && (
            <div className="mt-2 p-3 bg-gray-50 rounded-b-lg flex items-center justify-between text-sm border-t">
              <div className="flex items-center gap-4">
                <span className={`font-semibold ${wordCount >= section.minWords ? 'text-green-600' : 'text-orange-600'
                  }`}>
                  {wordCount >= section.minWords ? '✓' : '⚠️'} {wordCount} / {section.minWords} kata
                </span>
                <span className="text-gray-500">Progress: {progress.toFixed(0)}%</span>
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Subsections */}
        {section.subsections && section.subsections.length > 0 && (
          <div className="mt-6 space-y-6 ml-4">
            {section.subsections.map(sub => renderSection(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {structure.map(chapter => renderSection(chapter))}
    </div>
  );
};

export default ChapterEditor;
