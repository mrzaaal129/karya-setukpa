import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTemplates } from '../contexts/TemplateContext';
import { PageSettings, TemplatePage, PaperStructure, PaperTemplate, TemplatePageType } from '../types';
import MultiPageEditor from '../components/MultiPageEditor';
import DocEditor from '../components/CustomDocEditor';
import CoverPageBuilder from '../components/CoverPageBuilder';
import TemplatePreview from '../components/TemplatePreview';
import TemplateStructureEditor from '../components/TemplateStructureEditor';
import PageSettingsPanel from '../components/PageSettingsPanel';
import {
  ArrowLeft,
  Check,
  Plus,
  Settings,
  Layers,
  Eye,
  Maximize,
  Minimize,
  FileText,
  MoreVertical,
  X,
  GripVertical
} from 'lucide-react';
import { generateChapterContent } from '../utils/chapterUtils';

const pageNames: Record<TemplatePageType, string> = {
  TITLE: 'Halaman Judul',
  STATEMENT: 'Lembar Pernyataan',
  APPROVAL: 'Lembar Persetujuan',
  FOREWORD: 'Kata Pengantar',
  TOC: 'Daftar Isi (Auto)',
  LIST_OF_TABLES: 'Daftar Tabel (Auto)',
  LIST_OF_FIGURES: 'Daftar Gambar (Auto)',
  CONTENT: 'Isi Makalah',
  REFERENCES: 'Daftar Pustaka',
  APPENDIX: 'Lampiran (CV)',
};

const CreateTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTemplateById, addTemplate, updateTemplate } = useTemplates();

  const isEdit = !!id;
  const existingTemplate = isEdit ? getTemplateById(id) : null;

  const [templateName, setTemplateName] = useState(existingTemplate?.name || '');
  const [templateDescription, setTemplateDescription] = useState(existingTemplate?.description || '');

  const [pageSettings, setPageSettings] = useState<PageSettings>(existingTemplate?.settings || {
    paperSize: 'A4',
    orientation: 'portrait',
    margins: { top: 3, right: 3, bottom: 3, left: 4 },
    font: { family: 'Times New Roman', size: 12, lineHeight: 1.5 },
    paragraph: { indent: 1.27, spacing: 1.5 }
  });

  const [pages, setPages] = useState<TemplatePage[]>(existingTemplate?.pages || []);
  const [currentPageIndex, setCurrentPageIndex] = useState(pages.length > 0 ? 0 : -1);
  const [structure, setStructure] = useState<PaperStructure[]>(
    existingTemplate?.pages.find(p => p.type === 'CONTENT')?.structure || []
  );

  const [showAddPageMenu, setShowAddPageMenu] = useState(false);
  const [showStructurePanel, setShowStructurePanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);

  const currentPage = currentPageIndex >= 0 ? pages[currentPageIndex] : null;

  const handlePageContentChange = (newContent: string) => {
    setPages(prev => prev.map((p, idx) =>
      idx === currentPageIndex ? { ...p, content: newContent } : p
    ));
  };

  const handleInsertChapterStructure = () => {
    if (currentPage?.type !== 'CONTENT') {
      alert('⚠️ Struktur bab hanya bisa disisipkan di halaman "Isi Makalah"');
      return;
    }

    if (structure.length === 0) {
      alert('⚠️ Belum ada struktur bab. Tambahkan bab terlebih dahulu di panel "Struktur Bab"');
      return;
    }

    try {
      const newContent = generateChapterContent(structure);
      setPages(prev => {
        return prev.map((p, idx) => {
          if (idx === currentPageIndex && p.type === 'CONTENT') {
            return { ...p, content: newContent };
          }
          return p;
        });
      });
      alert('✅ Struktur bab berhasil disisipkan ke dalam paper!');
    } catch (error) {
      alert('❌ Gagal menyisipkan struktur: ' + (error as Error).message);
    }
  };

  const handleAddPage = (type: TemplatePage['type']) => {
    const defaultContent: Record<TemplatePageType, string> = {
      TITLE: `<div style="text-align: center; font-family: Arial, sans-serif; margin-top: 0;">
        <div style="border-bottom: 2px solid black; display: inline-block; padding-bottom: 2px; margin-bottom: 2cm;">
            <p style="font-weight: bold; margin: 0; font-size: 12pt;">LEMBAGA PENDIDIKAN DAN PELATIHAN POLRI</p>
            <p style="font-weight: bold; margin: 0; font-size: 12pt;">SEKOLAH PEMBENTUKAN PERWIRA</p>
        </div>
        <p style="font-weight: bold; font-size: 14pt; margin-bottom: 1cm;">KARYA TULIS TERAPAN</p>
        <div style="margin-bottom: 1cm;">
            <img src="/logo_setukpa.png" alt="Logo" style="width: 3cm; height: auto;" />
        </div>
        <div style="margin-bottom: 1.5cm;">
            <p style="font-weight: bold; font-size: 12pt; margin: 0;">OPTIMALISASI PENGAMANAN TINDAK PIDANA TRANSNASIONAL</p>
            <p style="font-weight: bold; font-size: 12pt; margin: 0;">OLEH SAT RESKRIM POLRES GUNA MENJAMIN KEAMANAN</p>
            <p style="font-weight: bold; font-size: 12pt; margin: 0;">DALAM RANGKA TERWUJUDNYA KEPERCAYAAN PUBLIK</p>
        </div>
        <div style="margin-bottom: 1.5cm; font-size: 48pt; font-weight: bold; line-height: 1;">|||</div>
        <p style="margin-bottom: 0.5cm;">Oleh :</p>
        <table style="margin: 0 auto; text-align: left; font-weight: bold;">
            <tr><td style="padding-right: 10px;">NAMA SERDIK</td><td>:</td><td style="padding-left: 10px;">{{NAMA_SISWA}}</td></tr>
            <tr><td>NOSIS</td><td>:</td><td style="padding-left: 10px;">{{NOSIS}}</td></tr>
        </table>
        <div style="margin-top: 2cm; font-weight: bold;">
            <p style="margin: 0;">SEKOLAH INSPEKTUR POLISI ANGKATAN KE - 54 GEL I T.A. 2025</p>
            <p style="margin: 0;">SETUKPA LEMDIKLAT POLRI</p>
        </div>
      </div>`,
      STATEMENT: `<h1 style="text-align: center;">LEMBAR PERNYATAAN</h1><p style="margin-top: 2cm;">Saya yang bertanda tangan di bawah ini...</p>`,
      APPROVAL: `<h1 style="text-align: center;">LEMBAR PERSETUJUAN</h1><p>...</p>`,
      FOREWORD: `<h1 style="text-align: center;">KATA PENGANTAR</h1><p>Puji syukur kami panjatkan...</p>`,
      TOC: '',
      LIST_OF_TABLES: '',
      LIST_OF_FIGURES: '',
      CONTENT: '<p>Mulai menulis isi makalah di sini...</p>',
      REFERENCES: `<h1 style="text-align: center;">DAFTAR PUSTAKA</h1><p>[Siswa mengisi daftar pustaka di sini]</p>`,
      APPENDIX: `<h1 style="text-align: center;">LAMPIRAN</h1><h2>DAFTAR RIWAYAT HIDUP</h2>`,
    };

    const newPage: TemplatePage = {
      id: `page-${Date.now()}`,
      type,
      name: pageNames[type],
      content: defaultContent[type] || '',
      order: pages.length,
      numbering: { type: 'none', position: 'none' },
      ...(type === 'CONTENT' && { structure }),
    };

    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
    setShowAddPageMenu(false);
  };

  const handleDeletePage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pages.length === 1) {
      alert('❌ Template harus memiliki minimal 1 halaman!');
      return;
    }
    if (!window.confirm(`Hapus halaman "${pages[index].name}"?`)) return;

    setPages(pages.filter((_, idx) => idx !== index));
    setCurrentPageIndex(Math.max(0, Math.min(index, pages.length - 2)));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedPageIndex === null || draggedPageIndex === dropIndex) return;

    const newPages = [...pages];
    const [draggedPage] = newPages.splice(draggedPageIndex, 1);
    newPages.splice(dropIndex, 0, draggedPage);

    setPages(newPages);
    setCurrentPageIndex(dropIndex);
    setDraggedPageIndex(null);
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      alert('❌ Nama template harus diisi!');
      return;
    }

    if (pages.length === 0) {
      alert('❌ Template harus memiliki minimal 1 halaman!');
      return;
    }

    const updatedPages = pages.map(p =>
      p.type === 'CONTENT' ? { ...p, structure } : p
    );

    const templateData: Omit<PaperTemplate, 'id'> = {
      name: templateName,
      description: templateDescription,
      settings: pageSettings,
      pages: updatedPages,
    };

    if (isEdit && existingTemplate) {
      updateTemplate({ ...templateData, id: existingTemplate.id });
      alert('✅ Template berhasil diupdate!');
    } else {
      addTemplate(templateData);
      alert('✅ Template berhasil dibuat!');
    }

    navigate('/super-admin/templates');
  };

  const getCurrentTemplate = (): PaperTemplate => ({
    id: existingTemplate?.id || 'preview',
    name: templateName || 'Preview Template',
    description: templateDescription,
    settings: pageSettings,
    pages: pages.map(p => p.type === 'CONTENT' ? { ...p, structure } : p),
  });

  return (
    <div className={`flex flex-col h-screen bg-gray-50 transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-[9999]' : ''}`}>
      {/* Header - Minimalist & Clean */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm z-20">
        <div className="max-w-7xl mx-auto">
          {/* Top Bar: Back, Title, Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/super-admin/templates')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Kembali"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isEdit ? 'Edit Template' : 'Buat Template Baru'}
                </h1>
                <p className="text-xs text-gray-500">
                  {isEdit ? 'Perbarui struktur template' : 'Buat struktur template baru'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
              >
                {isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              <div className="h-6 w-px bg-gray-200 mx-1"></div>
              <button
                onClick={() => setShowPreview(true)}
                disabled={pages.length === 0}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <Check className="w-4 h-4" />
                {isEdit ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>

          {/* Template Info Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Nama Template (Wajib)"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Deskripsi singkat template..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Page Tabs - Modern Scrollable */}
      <div className="bg-white border-b border-gray-200 px-6 py-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pt-2 pb-0 custom-scrollbar">
          {pages.map((page, idx) => (
            <div
              key={page.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              onClick={() => setCurrentPageIndex(idx)}
              className={`
                group relative flex items-center gap-2 px-4 py-3 cursor-pointer border-b-2 transition-all min-w-[160px] max-w-[200px]
                ${currentPageIndex === idx
                  ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <GripVertical className={`w-3 h-3 cursor-move ${currentPageIndex === idx ? 'text-blue-400' : 'text-gray-300 group-hover:text-gray-400'}`} />
              <span className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full bg-black/5 text-black/60">
                {idx + 1}
              </span>
              <span className="text-sm font-medium truncate flex-1">{page.name}</span>
              <button
                onClick={(e) => handleDeletePage(idx, e)}
                className={`opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-100 hover:text-red-600 transition-all ${currentPageIndex === idx ? 'text-blue-400' : 'text-gray-400'}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          <button
            onClick={() => setShowAddPageMenu(!showAddPageMenu)}
            className="ml-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap mb-1"
          >
            <Plus className="w-4 h-4" />
            Tambah Halaman
          </button>

          {/* Add Page Menu Dropdown */}
          {showAddPageMenu && (
            <div className="absolute top-40 left-64 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-[9999] w-64 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="text-xs font-bold text-gray-500 px-3 py-2 uppercase tracking-wider">Pilih Jenis Halaman</div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {(Object.keys(pageNames) as TemplatePageType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => handleAddPage(type)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 opacity-50" />
                    {pageNames[type]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar - Contextual */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentPage?.type === 'CONTENT' && (
              <button
                onClick={() => setShowStructurePanel(!showStructurePanel)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${showStructurePanel
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Struktur Bab
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            {currentPage ? (
              <>
                <span>Editing: {currentPage.name}</span>
                <span className="text-gray-300">•</span>
                <span className="text-blue-600 font-medium">Settings panel di kanan →</span>
              </>
            ) : 'Pilih halaman untuk diedit'}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor */}
        <div className="flex-1 overflow-hidden bg-gray-100/50">
          {currentPageIndex >= 0 && currentPage ? (
            <div className="h-full flex flex-col">
              {/* Paper Info Bar */}
              <div className="bg-white border-b px-4 py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    <strong>Ukuran:</strong> {pageSettings.paperSize} ({pageSettings.orientation})
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600">
                    <strong>Margin:</strong> {pageSettings.margins.top}cm (atas) {pageSettings.margins.left}cm (kiri)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">
                    {currentPage.type === 'CONTENT' ? 'Halaman Isi Makalah' : 'Halaman Statis'}
                  </span>
                </div>
              </div>

              {/* Collabora Editor Integration */}
              <DocEditor
                initialContent={currentPage.content || ''}
                onChange={(content) => handlePageContentChange(content)}
                documentTitle={`${templateName || 'Untitled'} - ${currentPage.name}`}
                pageSettings={pageSettings}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white">
              <FileText className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Pilih atau buat halaman baru untuk memulai</p>
              <p className="text-sm mt-2">Klik "Tambah Halaman" di atas untuk membuat halaman pertama</p>
            </div>
          )}
        </div>

        {/* Settings Panel - ALWAYS VISIBLE */}
        <div className="w-80 border-l border-gray-200 bg-white shadow-lg flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              Pengaturan Halaman
            </h3>
            <p className="text-xs text-gray-500 mt-1">Paper size, margins, orientation</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <PageSettingsPanel settings={pageSettings} onChange={setPageSettings} />

            {/* Additional Info */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                <p className="font-semibold text-blue-900 mb-1">💡 Tips:</p>
                <ul className="text-blue-700 space-y-1 list-disc list-inside">
                  <li>A4 adalah standar internasional</li>
                  <li>Margin akademik: 4cm kiri, 3cm lainnya</li>
                  <li>Gunakan Times New Roman 12pt</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Structure Panel - Toggle */}
        {showStructurePanel && currentPage?.type === 'CONTENT' && (
          <div className="absolute right-80 top-0 bottom-0 w-80 border-l border-gray-200 bg-white shadow-2xl z-20 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-50 to-white flex-shrink-0">
              <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-green-600" />
                Struktur Bab
              </h3>
              <button onClick={() => setShowStructurePanel(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <TemplateStructureEditor structure={structure} onChange={setStructure} />

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleInsertChapterStructure}
                  disabled={structure.length === 0}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Layers className="w-4 h-4" />
                  Sisipkan ke Paper
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Ini akan menimpa konten halaman saat ini dengan struktur bab yang baru.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <TemplatePreview
          template={getCurrentTemplate()}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default CreateTemplate;
