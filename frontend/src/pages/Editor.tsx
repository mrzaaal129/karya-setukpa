import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useAssignments } from '../contexts/AssignmentContext';
import { useTemplates } from '../contexts/TemplateContext';
import { PaperStructure } from '../types';
import {
  LockIcon, AlertCircleIcon, SaveIcon, ChevronRightIcon, MenuIcon, XIcon, CheckIcon, ClockIcon,
  EyeIcon, EditIcon, DownloadIcon, PrinterIcon
} from 'lucide-react';
import api from '../services/api';
import DocEditor from '../components/CustomDocEditor';

// Helper function to count words from HTML content
const countWordsFromHTML = (html: string): number => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || '';
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

// Preview Component - Shows complete formatted document with proper print layout
interface PreviewProps {
  template: any;
  chapters: PaperStructure[];
  formData: Record<string, string>;
  assignment: any;
}

const Preview: React.FC<PreviewProps> = ({ template, chapters, formData, assignment }) => {
  if (!template) return null;

  return (
    <>
      {/* Professional Print Styles */}
      <style>{`
        @media print {
          /* Hide everything except preview */
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          /* Page setup for A4 */
          @page {
            size: A4;
            margin: 0;
          }
          
          /* Each page should start on new page */
          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
            width: 210mm;
            min-height: 297mm;
            padding: 3cm 4cm 3cm 3cm; /* Top, Right, Bottom, Left */
            background: white;
            box-shadow: none !important;
            margin: 0;
            position: relative;
          }
          
          /* Last page no break */
          .print-page:last-child {
            page-break-after: auto;
          }
        }
        
        /* Screen view styles */
        @media screen {
          .print-page {
            page-break-after: always;
            width: 210mm;
            min-height: 297mm;
            padding: 3cm 4cm 3cm 3cm; /* A4 margins: Top 3cm, Right 4cm, Bottom 3cm, Left 3cm */
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin: 0 auto 2rem auto;
          }
        }
        
        /* Common styles */
        .print-page {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.5;
          color: black;
        }
      `}</style>

      <div className="print-container max-w-[210mm] mx-auto">
        {/* Render ALL template pages in order */}
        {template.pages.map((page: any, pageIdx: number) => {
          // For CONTENT pages, render each chapter on separate page
          if (page.type === 'CONTENT') {
            return (
              <React.Fragment key={page.id}>
                {chapters.map((chapter, chapterIdx) => (
                  <div key={chapter.id} className="print-page">
                    <h2 className="text-center font-bold text-lg mb-6">
                      {chapter.title}
                    </h2>
                    {/* Show subsections if they exist */}
                    {chapter.subsections && chapter.subsections.length > 0 ? (
                      chapter.subsections.map((sub) => (
                        <div key={sub.id} className="mb-6">
                          <h3 className="font-bold mb-2">{sub.title}</h3>
                          <div className="text-justify" dangerouslySetInnerHTML={{
                            __html: formData[sub.id] || '<p class="text-gray-400 italic">Belum diisi</p>'
                          }} />
                        </div>
                      ))
                    ) : (
                      <div className="text-justify" dangerouslySetInnerHTML={{
                        __html: formData[chapter.id] || '<p class="text-gray-400 italic">Belum diisi</p>'
                      }} />
                    )}
                  </div>
                ))}
              </React.Fragment>
            );
          }

          // For static pages, each page on separate sheet
          return (
            <div key={page.id} className="print-page">
              <div dangerouslySetInnerHTML={{
                __html: formData[page.id] || page.content || '<p class="text-gray-400 italic">Tidak ada konten</p>'
              }} />
            </div>
          );
        })}
      </div>
    </>
  );
};

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { getAssignmentById } = useAssignments();
  const { getTemplateById } = useTemplates();

  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [activePageId, setActivePageId] = useState<string | null>(null); // Changed from activeChapterId
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null); // For CONTENT pages only
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [paperId, setPaperId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const assignment = id ? getAssignmentById(id) : undefined;
  const template = assignment?.templateId ? getTemplateById(assignment.templateId) : null;

  // Get all template pages
  const allPages = useMemo(() => {
    if (!template) return [];
    return template.pages || [];
  }, [template]);

  // Get chapters from CONTENT pages
  const chapters = useMemo(() => {
    if (!template) return [];
    const contentPage = template.pages.find(p => p.type === 'CONTENT');
    const structure = contentPage?.structure || [];

    // DEBUG: Log to see structure
    console.log('=== CHAPTER STRUCTURE DEBUG ===');
    console.log('Template:', template);
    console.log('Content Page:', contentPage);
    console.log('Chapters:', structure);
    structure.forEach((ch, idx) => {
      console.log(`Chapter ${idx}:`, ch.title);
      console.log(`  Subsections:`, ch.subsections?.map(s => s.title));
    });
    console.log('=== END DEBUG ===');

    return structure;
  }, [template]);

  useEffect(() => {
    // Set first page as active on load
    if (allPages.length > 0 && !activePageId) {
      setActivePageId(allPages[0].id);
      // If first page is CONTENT, also set first chapter
      if (allPages[0].type === 'CONTENT' && chapters.length > 0) {
        setActiveChapterId(chapters[0].id);
      }
    }
  }, [allPages, activePageId, chapters]);

  useEffect(() => {
    const fetchPaper = async () => {
      if (!id || !currentUser) return;
      setLoading(true);
      try {
        const response = await api.get('/papers', {
          params: { assignmentId: id, userId: currentUser.id }
        });
        const papers = response.data.papers;
        let loadedData: Record<string, string> = {};

        if (papers && papers.length > 0) {
          const paper = papers[0];
          setPaperId(paper.id);
          try {
            const parsed = JSON.parse(paper.content || '{}');
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
              loadedData = parsed;
            }
          } catch (e) {
            console.error('Failed to parse paper content:', e);
          }
        }

        // Initialize with template content for missing keys
        if (template) {
          const initialData: Record<string, string> = { ...loadedData };

          // Add all template pages if not already in loadedData
          // SKIP CONTENT pages - they don't have content, only structure
          template.pages.forEach(page => {
            if (!initialData[page.id] && page.type !== 'CONTENT') {
              initialData[page.id] = page.content || '';
            }
          });

          // IMPORTANT: Initialize chapters with EMPTY content (not parent page content!)
          // Each chapter should be independent
          chapters.forEach(chapter => {
            if (!initialData[chapter.id]) {
              // Do NOT use parent page content - each chapter is unique
              initialData[chapter.id] = ''; // Empty for new chapters
            }
            // Also add subsections
            if (chapter.subsections) {
              chapter.subsections.forEach(sub => {
                if (!initialData[sub.id]) {
                  initialData[sub.id] = '';
                }
              });
            }
          });

          setFormData(initialData);
        }
      } catch (error) {
        console.error("Failed to fetch paper:", error);
        setSaveError("Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    };
    fetchPaper();
  }, [id, currentUser, template, chapters]);

  // Auto-save
  useEffect(() => {
    if (!paperId || saving || viewMode === 'preview') return;
    const timer = setTimeout(() => handleAutoSave(), 3000);
    return () => clearTimeout(timer);
  }, [formData, paperId, viewMode]);

  const handleAutoSave = async () => {
    if (!paperId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const totalWords = Object.values(formData).join(' ').split(/\s+/).filter(w => w.length > 0).length;
      await api.put(`/papers/${paperId}`, {
        content: JSON.stringify(formData),
        wordCount: totalWords
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Auto-save failed:", error);
      setSaveError("Gagal menyimpan otomatis.");
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!paperId) {
      alert("Error: Paper ID tidak ditemukan.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const totalWords = Object.values(formData).join(' ').split(/\s+/).filter(w => w.length > 0).length;
      await api.put(`/papers/${paperId}`, {
        content: JSON.stringify(formData),
        wordCount: totalWords
      });
      setLastSaved(new Date());
      alert('✅ Progress berhasil disimpan!');
    } catch (error) {
      console.error("Save failed:", error);
      setSaveError("Gagal menyimpan.");
      alert("Gagal menyimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportWord = async () => {
    if (!paperId) return;
    try {
      const response = await api.get(`/papers/${paperId}/export-docx`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${assignment?.title || 'Makalah'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Gagal export ke Word. Silakan coba lagi.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getChapterStatus = (chapterId: string) => {
    const schedule = assignment?.chapterSchedules?.find(s => s.chapterId === chapterId);
    if (!schedule) return 'open';
    return schedule.isOpen ? 'open' : 'locked';
  };

  const updateSection = (sectionId: string, value: string) => {
    setFormData(prev => ({ ...prev, [sectionId]: value }));
  };

  const getTotalWordCount = () => {
    // Count words from all HTML content
    return Object.values(formData).reduce((total: number, html) => {
      return total + countWordsFromHTML(html as string);
    }, 0);
  };

  const getChapterWordCount = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return 0;
    // Count words from HTML content
    const htmlContent = formData[chapterId] || '';
    return countWordsFromHTML(htmlContent);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat editor...</p>
        </div>
      </div>
    );
  }

  if (!assignment || !template) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold text-red-600 mb-2">Tugas tidak ditemukan</h2>
          <button
            onClick={() => navigate('/assignments')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const activeChapter = chapters.find(c => c.id === activeChapterId);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Hide in preview mode */}
      {viewMode === 'edit' && (
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col overflow-hidden`}>
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 text-lg">Halaman Dokumen</h2>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 hover:bg-gray-100 p-1 rounded">
              <XIcon size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {allPages.map((page, idx) => {
              const isActive = activePageId === page.id;
              const pageWords = countWordsFromHTML(formData[page.id] || '');
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setActivePageId(page.id);
                    // If CONTENT page, also set first chapter
                    if (page.type === 'CONTENT' && chapters.length > 0) {
                      setActiveChapterId(chapters[0].id);
                    } else {
                      setActiveChapterId(null);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-all ${isActive
                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium border-2 shadow-sm'
                    : 'hover:bg-gray-50 text-gray-600 border border-gray-200 cursor-pointer hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                        {idx + 1}
                      </div>
                      <span className="font-medium truncate">{page.name}</span>
                    </div>
                  </div>
                  {page.type === 'CONTENT' && (
                    <div className="ml-10 text-xs text-green-600">Isi Makalah</div>
                  )}
                  {page.type !== 'TOC' && page.type !== 'LIST_OF_TABLES' && page.type !== 'LIST_OF_FIGURES' && (
                    <div className="ml-10 text-xs text-gray-500">{pageWords} kata</div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => navigate('/assignments')}
              className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-medium"
            >
              ← Kembali
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            {!sidebarOpen && viewMode === 'edit' && (
              <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg">
                <MenuIcon size={24} />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-800">{assignment.title}</h1>
              <p className="text-sm text-gray-500">{viewMode === 'preview' ? 'Mode Preview' : (activeChapter ? activeChapter.title : 'Pilih Bab')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
              >
                <EditIcon size={16} className="inline mr-2" />
                Edit
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
              >
                <EyeIcon size={16} className="inline mr-2" />
                Preview
              </button>
            </div>

            {/* Action Buttons */}
            {viewMode === 'preview' ? (
              <>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  <PrinterIcon size={16} />
                  Print
                </button>
                <button
                  onClick={handleExportWord}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <DownloadIcon size={16} />
                  Export Word
                </button>
              </>
            ) : (
              <>
                {/* Save Status */}
                <div className="flex items-center gap-2 text-sm">
                  {saving ? (
                    <>
                      <ClockIcon className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-gray-600">Menyimpan...</span>
                    </>
                  ) : saveError ? (
                    <>
                      <AlertCircleIcon className="w-4 h-4 text-red-600" />
                      <span className="text-red-600">{saveError}</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">
                        Tersimpan {new Date().getTime() - lastSaved.getTime() < 60000
                          ? 'baru saja'
                          : `${Math.floor((new Date().getTime() - lastSaved.getTime()) / 60000)} menit lalu`}
                      </span>
                    </>
                  ) : null}
                </div>
                <span className="text-sm text-gray-500 border-l pl-4">
                  Total: {getTotalWordCount()} kata
                </span>
                <button
                  onClick={handleManualSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm disabled:opacity-50"
                >
                  <SaveIcon size={18} />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-100">
          {viewMode === 'preview' ? (
            <div className="py-8">
              <Preview template={template} chapters={chapters} formData={formData} assignment={assignment} />
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {(() => {
                const activePage = allPages.find(p => p.id === activePageId);
                if (!activePage) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Pilih halaman di sidebar untuk mulai mengedit.</p>
                    </div>
                  );
                }

                // For CONTENT pages: show chapter navigation
                if (activePage.type === 'CONTENT') {
                  const activeChapter = chapters.find(c => c.id === activeChapterId);
                  if (!activeChapter) {
                    return (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Pilih bab untuk mulai menulis.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* Chapter Selector for CONTENT page */}
                      <div className="bg-white border-b px-6 py-3 flex gap-2 overflow-x-auto flex-shrink-0">
                        {chapters.map((ch, idx) => (
                          <button
                            key={ch.id}
                            onClick={() => setActiveChapterId(ch.id)}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${ch.id === activeChapterId
                              ? 'bg-blue-600 text-white font-medium shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            {ch.title}
                          </button>
                        ))}
                      </div>

                      {/* Chapter Info Bar */}
                      <div className="bg-white border-b px-6 py-4 flex-shrink-0">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">{activeChapter.title}</h2>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <AlertCircleIcon size={14} />
                            Minimal: {activeChapter.minWords} kata
                          </span>
                          <span>•</span>
                          <span>Current: {getChapterWordCount(activeChapter.id)} kata</span>
                        </div>
                      </div>

                      {/* DocEditor - Full Height */}
                      <div className="flex-1 overflow-hidden">
                        <DocEditor
                          initialContent={formData[activeChapter.id] || ''}
                          onChange={(content) => updateSection(activeChapter.id, content)}
                          documentTitle={`${assignment?.title} - ${activeChapter.title}`}
                          pageSettings={template?.settings}
                        />
                      </div>

                      {/* Navigation Buttons */}
                      <div className="bg-white border-t px-6 py-4 flex justify-between items-center flex-shrink-0">
                        <button
                          onClick={() => {
                            const currentIdx = chapters.findIndex(c => c.id === activeChapterId);
                            if (currentIdx > 0) setActiveChapterId(chapters[currentIdx - 1].id);
                          }}
                          disabled={chapters.findIndex(c => c.id === activeChapterId) === 0}
                          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ← Bab Sebelumnya
                        </button>
                        <button
                          onClick={() => {
                            const currentIdx = chapters.findIndex(c => c.id === activeChapterId);
                            if (currentIdx < chapters.length - 1) {
                              setActiveChapterId(chapters[currentIdx + 1].id);
                            }
                          }}
                          disabled={chapters.findIndex(c => c.id === activeChapterId) === chapters.length - 1}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Lanjut ke Bab Berikutnya <ChevronRightIcon size={18} />
                        </button>
                      </div>
                    </>
                  );
                }

                // For static pages: show full page editor
                return (
                  <>
                    {/* Page Info Bar */}
                    <div className="bg-white border-b px-6 py-4 flex-shrink-0">
                      <h2 className="text-xl font-bold text-gray-800 mb-2">{activePage.name}</h2>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Halaman: {activePage.type}</span>
                        <span>•</span>
                        <span>{countWordsFromHTML(formData[activePage.id] || '')} kata</span>
                      </div>
                    </div>

                    {/* DocEditor - Full Height */}
                    <div className="flex-1 overflow-hidden">
                      <DocEditor
                        initialContent={formData[activePage.id] || activePage.content || ''}
                        onChange={(content) => updateSection(activePage.id, content)}
                        documentTitle={`${assignment?.title} - ${activePage.name}`}
                        pageSettings={template?.settings}
                      />
                    </div>

                    {/* Navigation Buttons */}
                    <div className="bg-white border-t px-6 py-4 flex justify-between items-center flex-shrink-0">
                      <button
                        onClick={() => {
                          const currentIdx = allPages.findIndex(p => p.id === activePageId);
                          if (currentIdx > 0) {
                            const prevPage = allPages[currentIdx - 1];
                            setActivePageId(prevPage.id);
                            if (prevPage.type === 'CONTENT' && chapters.length > 0) {
                              setActiveChapterId(chapters[0].id);
                            }
                          }
                        }}
                        disabled={allPages.findIndex(p => p.id === activePageId) === 0}
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Halaman Sebelumnya
                      </button>
                      <button
                        onClick={() => {
                          const currentIdx = allPages.findIndex(p => p.id === activePageId);
                          if (currentIdx < allPages.length - 1) {
                            const nextPage = allPages[currentIdx + 1];
                            setActivePageId(nextPage.id);
                            if (nextPage.type === 'CONTENT' && chapters.length > 0) {
                              setActiveChapterId(chapters[0].id);
                            }
                          }
                        }}
                        disabled={allPages.findIndex(p => p.id === activePageId) === allPages.length - 1}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Halaman Selanjutnya <ChevronRightIcon size={18} />
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Editor;