import React, { useState } from 'react';
import { PaperStructure } from '../types';
import { PlusCircle, Trash2, BookOpen, FileText } from 'lucide-react';

interface TemplateStructureEditorProps {
  structure: PaperStructure[];
  onChange: (structure: PaperStructure[]) => void;
}

const TemplateStructureEditor: React.FC<TemplateStructureEditorProps> = ({ structure, onChange }) => {
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterWords, setNewChapterWords] = useState('100');

  const addChapter = () => {
    if (!newChapterTitle.trim()) return;

    const newChapter: PaperStructure = {
      id: `chapter - ${Date.now()} `,
      title: newChapterTitle,
      minWords: parseInt(newChapterWords) || 100,
      wordCount: 0,
      subsections: []
    };

    onChange([...structure, newChapter]);
    setNewChapterTitle('');
    setNewChapterWords('100');
  };

  const deleteChapter = (id: string) => {
    if (!window.confirm('Hapus BAB ini?')) return;
    onChange(structure.filter(s => s.id !== id));
  };

  const addSubsection = (chapterId: string) => {
    const subsectionTitle = prompt('Judul Sub-bab:');
    if (!subsectionTitle) return;

    const minWords = prompt('Minimal kata:', '50');

    onChange(structure.map(chapter => {
      if (chapter.id === chapterId) {
        const newSubsection: PaperStructure = {
          id: `subsection - ${Date.now()} `,
          title: subsectionTitle,
          minWords: parseInt(minWords || '50'),
          wordCount: 0,
          subsections: []
        };
        return {
          ...chapter,
          subsections: [...(chapter.subsections || []), newSubsection]
        };
      }
      return chapter;
    }));
  };

  const deleteSubsection = (chapterId: string, subsectionId: string) => {
    if (!window.confirm('Hapus sub-bab ini?')) return;
    onChange(structure.map(chapter => {
      if (chapter.id === chapterId) {
        return {
          ...chapter,
          subsections: (chapter.subsections || []).filter(s => s.id !== subsectionId)
        };
      }
      return chapter;
    }));
  };

  return (
    <div className="space-y-4">
      {/* Chapter List */}
      {structure.length > 0 ? (
        <div className="space-y-3">
          {structure.map((chapter, index) => (
            <div key={chapter.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {/* Chapter Header */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 mb-1 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        {chapter.title}
                      </h4>
                      <p className="text-xs text-gray-600">
                        Minimal <span className="font-semibold text-blue-700">{chapter.minWords}</span> kata
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteChapter(chapter.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus BAB"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subsections */}
              {chapter.subsections && chapter.subsections.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 space-y-2">
                  {chapter.subsections.map((sub, subIndex) => (
                    <div key={sub.id} className="flex items-center justify-between gap-3 bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="flex-shrink-0 w-6 h-6 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}.{subIndex + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{sub.title}</p>
                          <p className="text-xs text-gray-500">Min: {sub.minWords} kata</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSubsection(chapter.id, sub.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Hapus sub-bab"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Subsection Button */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => addSubsection(chapter.id)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Tambah Sub-bab
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 font-medium">Belum ada BAB</p>
          <p className="text-xs text-gray-500 mt-1">Tambahkan BAB pertama di bawah</p>
        </div>
      )}

      {/* Add Chapter Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-blue-600" />
          Tambah BAB Baru
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Judul BAB</label>
            <input
              type="text"
              placeholder="Contoh: BAB I: PENDAHULUAN"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addChapter()}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Minimal Kata</label>
              <input
                type="number"
                placeholder="100"
                value={newChapterWords}
                onChange={(e) => setNewChapterWords(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addChapter}
                disabled={!newChapterTitle.trim()}
                className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Tambah BAB
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateStructureEditor;
