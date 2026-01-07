import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../contexts/TemplateContext';
import {
  Plus,
  Search,
  FileText,
  LayoutTemplate,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { PaperTemplate } from '../types';

const SuperAdminTemplateManager: React.FC = () => {
  const navigate = useNavigate();
  const { templates, deleteTemplate } = useTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Apakah Anda yakin ingin menghapus template "${name}"?`)) {
      deleteTemplate(id);
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getChapterStructure = (template: PaperTemplate) => {
    const contentPage = template.pages.find(p => p.type === 'CONTENT');
    return contentPage?.structure || [];
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Template</h1>
          <p className="mt-1 text-gray-500">Kelola struktur dan format standar untuk dokumen makalah.</p>
        </div>
        <button
          onClick={() => navigate('/super-admin/templates/create')}
          className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Buat Template Baru
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map(template => {
            const structure = getChapterStructure(template);
            const isExpanded = expandedTemplates.has(template.id);

            return (
              <div
                key={template.id}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Clean Card Header */}
                <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-1" title={template.name}>
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {template.settings.paperSize}
                        </span>
                        <span className="text-xs text-gray-500">
                          {template.pages.length} Halaman
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {template.description || "Tidak ada deskripsi."}
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-500">
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span>Jumlah Bab</span>
                      </div>
                      <span className="font-medium text-gray-900">{structure.length} Bab</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-500">
                        <LayoutTemplate className="w-4 h-4 mr-2" />
                        <span>Margin</span>
                      </div>
                      <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        {template.settings.margins.top}/{template.settings.margins.right}/{template.settings.margins.bottom}/{template.settings.margins.left}
                      </span>
                    </div>
                  </div>

                  {/* Chapter Structure Toggle */}
                  {structure.length > 0 && (
                    <div className="mb-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => toggleExpand(template.id, e)}
                        className="flex items-center justify-between w-full text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <span>Struktur Bab</span>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                          {structure.map((chapter, idx) => (
                            <div key={chapter.id} className="text-xs p-2 bg-gray-50 rounded border border-gray-100">
                              <div className="font-medium text-gray-800 flex gap-2">
                                <span className="text-blue-600">{idx + 1}.</span>
                                {chapter.title}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-auto pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/super-admin/templates/preview/${template.id}`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => navigate(`/super-admin/templates/edit/${template.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(template.id, template.name, e)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200 border-dashed">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
            <LayoutTemplate className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Belum Ada Template</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            {searchTerm ? 'Tidak ditemukan template dengan kata kunci tersebut.' : 'Mulai dengan membuat template baru untuk standar dokumen Anda.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => navigate('/super-admin/templates/create')}
              className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Template Sekarang
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperAdminTemplateManager;
