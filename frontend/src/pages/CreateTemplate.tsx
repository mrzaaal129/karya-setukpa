import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTemplates } from '../contexts/TemplateContext';
import { PageSettings, TemplatePage, PaperStructure, PaperTemplate } from '../types';
import DocEditor from '../components/CustomDocEditor';
import TemplatePreview from '../components/TemplatePreview';
import PageSettingsPanel from '../components/PageSettingsPanel';
import {
  ArrowLeft,
  Check,
  Plus,
  Settings,
  Eye,
  Maximize,
  Minimize,
  FileText,
  Trash2,
  ChevronRight,
  Layout
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const CreateTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTemplateById, addTemplate, updateTemplate } = useTemplates();

  const isEdit = !!id;
  const existingTemplate = isEdit ? getTemplateById(id) : null;

  // State
  const [templateName, setTemplateName] = useState(existingTemplate?.name || '');
  const [templateDescription, setTemplateDescription] = useState(existingTemplate?.description || '');

  // Default Settings (A4, Times New Roman)
  const [pageSettings, setPageSettings] = useState<PageSettings>(existingTemplate?.settings || {
    paperSize: 'A4',
    orientation: 'portrait',
    margins: { top: 3, right: 3, bottom: 3, left: 4 },
    font: { family: 'Times New Roman', size: 12, lineHeight: 1.5 },
    paragraph: { indent: 1.27, spacing: 1.5 }
  });

  const [pages, setPages] = useState<TemplatePage[]>(existingTemplate?.pages || []);
  const [currentPageIndex, setCurrentPageIndex] = useState(pages.length > 0 ? 0 : -1);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentPage = currentPageIndex >= 0 ? pages[currentPageIndex] : null;

  // Helper: Convert Number to Roman (I, II, III...)
  const toRoman = (num: number): string => {
    const romanNumerals: [number, string][] = [
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    for (const [value, numeral] of romanNumerals) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  };

  const handleAddChapter = () => {
    const chapterNum = pages.length + 1;
    const chapterTitle = `BAB ${toRoman(chapterNum)}`; // Default title

    const newPage: TemplatePage = {
      id: uuidv4(),
      type: 'CONTENT',
      name: chapterTitle,
      content: `<h1>${chapterTitle} JUDUL BAB</h1><p>Mulai menulis isi bab ini...</p>`,
      order: pages.length,
      numbering: { type: 'arabic', position: 'top-right', startNumber: 1 },
      structure: [{ // Strict Structure: One per Chapter
        id: uuidv4(),
        title: chapterTitle,
        minWords: 500,
        wordCount: 0,
        subsections: []
      }]
    };

    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
  };

  const handleUpdateChapterTitle = (title: string) => {
    if (currentPageIndex === -1) return;

    setPages(prev => prev.map((p, idx) => {
      if (idx !== currentPageIndex) return p;

      // Update Page Name AND Structure Title AND Content Header
      const newStructure = p.structure ? [...p.structure] : [];
      if (newStructure.length > 0) newStructure[0].title = title;

      return { ...p, name: title, structure: newStructure };
    }));
  };

  const handleDeletePage = (index: number) => {
    if (!window.confirm(`Hapus ${pages[index].name}?`)) return;
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    setCurrentPageIndex(Math.max(0, Math.min(index, newPages.length - 1)));
  };

  const handleUpdateMinWords = (words: number) => {
    if (currentPageIndex === -1) return;

    setPages(prev => prev.map((p, idx) => {
      if (idx !== currentPageIndex) return p;

      // Update Page minWords AND Structure minWords
      const newStructure = p.structure ? [...p.structure] : [];
      if (newStructure.length > 0) newStructure[0].minWords = words;

      return { ...p, minWords: words, structure: newStructure };
    }));
  };

  // ... (existing code)



  const handlePageContentChange = (content: string) => {
    setPages(prev => prev.map((p, idx) => idx === currentPageIndex ? { ...p, content } : p));
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('⚠️ Nama template wajib diisi.');
      return;
    }
    if (pages.length === 0) {
      alert('⚠️ Minimal harus ada 1 Bab.');
      return;
    }

    const templateData: Omit<PaperTemplate, 'id'> = {
      name: templateName,
      description: templateDescription,
      settings: pageSettings,
      pages: pages.map((p, i) => ({ ...p, order: i })), // Ensure order
    };

    setIsSaving(true);
    try {
      if (isEdit && existingTemplate) {
        await updateTemplate({ ...templateData, id: existingTemplate.id });
      } else {
        await addTemplate(templateData);
      }
      alert('✅ Template berhasil disimpan!');
      navigate('/super-admin/templates');
    } catch (error) {
      console.error("Failed to save template:", error);
      alert('❌ Gagal menyimpan template. Cek koneksi atau coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentTemplate = (): PaperTemplate => ({
    id: existingTemplate?.id || 'preview',
    name: templateName || 'Preview',
    description: templateDescription,
    settings: pageSettings,
    pages: pages
  });

  return (
    <div className={`flex flex-col h-screen bg-[#F3F4F6] transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-[9999]' : ''}`}>
      {/* 1. TOP BAR */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm z-30 h-14">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/super-admin/templates')} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">
            <ArrowLeft size={20} />
          </button>

          <div className="h-6 w-px bg-gray-200" />

          {/* Left Panel Toggle */}
          <button
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className={`p-2 rounded-lg transition ${showLeftPanel ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
            title={showLeftPanel ? "Tutup Sidebar Bab" : "Buka Sidebar Bab"}
          >
            <Layout size={20} />
          </button>

          <div className="ml-2">
            <input
              type="text"
              placeholder="Nama Template..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="text-base font-semibold text-gray-800 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 w-64 md:w-96"
            />
            <input
              type="text"
              placeholder="Deskripsi singkat..."
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              className="text-xs text-gray-500 border-none focus:ring-0 p-0 bg-transparent w-full block -mt-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Right Panel Toggle */}
          <button
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className={`p-2 rounded-lg transition ${showSettingsPanel ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
            title="Toggle Settings"
          >
            <Settings size={20} />
          </button>

          <div className="h-6 w-px bg-gray-200 mx-1" />

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 text-gray-500 hover:text-gray-800 transition rounded-lg hover:bg-gray-100"
          >
            {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>

          <button
            onClick={() => setShowPreview(true)}
            className="hidden md:flex items-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium transition"
          >
            <Eye size={18} /> Preview
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition shadow-sm ${isSaving ? 'opacity-50' : ''}`}
          >
            {isSaving ? 'Saving...' : <><Check size={18} /> Simpan</>}
          </button>
        </div>
      </div>

      {/* 2. WORKSPACE GRID */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LEFT SIDEBAR: CHAPTERS */}
        <div className={`
              bg-white border-r border-gray-200 flex flex-col z-20 transition-all duration-300
              ${showLeftPanel ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}
          `}>
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Daftar Bab</span>
            <button
              onClick={handleAddChapter}
              className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition shadow-sm bg-white border border-gray-200"
              title="Tambah Bab Baru"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {pages.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">
                Belum ada bab.
              </div>
            ) : (
              pages.map((page, idx) => (
                <div
                  key={page.id}
                  onClick={() => setCurrentPageIndex(idx)}
                  className={`
                                  group flex items-center gap-3 p-2 rounded-md cursor-pointer transition border
                                  ${currentPageIndex === idx
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'border-transparent hover:bg-gray-100 text-gray-600'
                    }
                              `}
                >
                  <div className={`
                                  w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0
                                  ${currentPageIndex === idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                              `}>
                    {toRoman(idx + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {page.name}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletePage(idx); }}
                    className="w-0 group-hover:w-6 overflow-hidden text-red-400 hover:text-red-600 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CENTER: EDITOR */}
        <div className="flex-1 bg-gray-100/80 overflow-hidden flex flex-col relative w-full">
          {currentPage ? (
            <div className="flex flex-col h-full">
              {/* Chapter Title Bar - Clean & Non-obstructive */}
              < div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10 shadow-sm" >
                <input
                  type="text"
                  value={currentPage.name}
                  onChange={(e) => handleUpdateChapterTitle(e.target.value)}
                  className="flex-1 font-serif font-bold text-xl text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-0 p-1 placeholder-gray-300 bg-transparent transition"
                  placeholder="JUDUL BAB (Klik untuk edit)"
                />

                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 ml-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    Min. Kata:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={currentPage.structure?.[0]?.minWords || currentPage.minWords || 0}
                    onChange={(e) => handleUpdateMinWords(parseInt(e.target.value) || 0)}
                    className="w-16 text-sm font-bold text-blue-600 bg-transparent border-none focus:ring-0 p-0 text-right outline-none"
                    placeholder="0"
                  />
                  <span className="text-xs text-gray-400">kata</span>
                </div>
              </div>

              {/* Full Editor Area - Matches Student Layout */}
              <div className="flex-1 overflow-hidden relative">
                <DocEditor
                  initialContent={currentPage.content || ''}
                  onChange={handlePageContentChange}
                  documentTitle={currentPage.name}
                  pageSettings={pageSettings}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Layout size={32} className="opacity-20" />
              </div>
              <p>Pilih bab di sidebar untuk mengedit</p>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: PROPERTIES */}
        <div className={`
               bg-white border-l border-gray-200 shadow-xl z-20 flex flex-col transition-all duration-300 absolute right-0 top-0 bottom-0
               ${showSettingsPanel ? 'w-72 translate-x-0' : 'w-72 translate-x-full'}
          `}>
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              Pengaturan
            </span>
            <button onClick={() => setShowSettingsPanel(false)} className="hover:bg-gray-200 rounded p-1">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <PageSettingsPanel settings={pageSettings} onChange={setPageSettings} />
          </div>
        </div>
      </div >

      {/* MODALS */}
      {
        showPreview && (
          <TemplatePreview
            template={getCurrentTemplate()}
            onClose={() => setShowPreview(false)}
          />
        )
      }
    </div >
  );
};

export default CreateTemplate;
