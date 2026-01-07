import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTemplates } from '../contexts/TemplateContext';
import TemplatePageEditor from '../components/TemplatePageEditor';
import { ArrowLeftIcon, PencilIcon } from '../components/icons';

const PreviewTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTemplateById } = useTemplates();

  const template = id ? getTemplateById(id) : null;

  const pageNumbers = useMemo(() => {
    if (!template) return {};
    const numbers: Record<string, number> = {};
    let romanCounter = 0;
    let arabicCounter = 0;
    let romanStarted = false;
    let arabicStarted = false;

    [...template.pages].sort((a, b) => a.order - b.order).forEach(page => {
      if (!page.numbering) return; // Skip if numbering is not defined

      if (page.numbering.type === 'roman') {
        if (!romanStarted) {
          romanCounter = page.numbering.startNumber || 1;
          romanStarted = true;
        }
        numbers[page.id] = romanCounter;
        romanCounter++;
      } else if (page.numbering.type === 'arabic') {
        if (!arabicStarted) {
          arabicCounter = page.numbering.startNumber || 1;
          arabicStarted = true;
        }
        numbers[page.id] = arabicCounter;
        arabicCounter++;
      }
    });
    return numbers;
  }, [template]);

  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Template Tidak Ditemukan</h2>
          <button
            onClick={() => navigate('/super-admin/templates')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kembali ke Daftar Template
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👁️ Preview: {template.name}</h1>
          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/super-admin/templates')}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Kembali
          </button>
          <button
            onClick={() => navigate(`/super-admin/templates/edit/${template.id}`)}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" />
            Edit Template
          </button>
        </div>
      </div>

      {/* Pages Preview */}
      <div className="space-y-6">
        {template.pages.map((page) => (
          <div key={page.id} className="bg-white p-6 rounded-lg shadow-md border">
            <div className="mb-4 pb-3 border-b">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                📄 {page.name}
                <span className="text-xs font-normal text-gray-500">({page.type})</span>
              </h2>
              {page.type === 'CONTENT' && page.structure && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Struktur:</strong> {page.structure.length} bab
                </div>
              )}
            </div>

            <TemplatePageEditor
              content={page.content || ''}
              onChange={() => { }}
              settings={template.settings}
              mode="preview"
              readOnly={true}
              numbering={page.numbering}
              pageNumber={pageNumbers[page.id]}
            />
          </div>
        ))}
      </div>

      {/* Template Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-bold text-lg mb-4">📊 Informasi Template</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-gray-600 text-xs mb-1">Ukuran Kertas</p>
            <p className="font-bold text-blue-700">{template.settings.paperSize}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-gray-600 text-xs mb-1">Jumlah Halaman</p>
            <p className="font-bold text-green-700">{template.pages.length}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-gray-600 text-xs mb-1">Margin Atas</p>
            <p className="font-bold text-purple-700">{template.settings.margins.top} cm</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-gray-600 text-xs mb-1">Margin Kiri</p>
            <p className="font-bold text-orange-700">{template.settings.margins.left} cm</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewTemplate;
