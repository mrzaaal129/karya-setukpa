import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTemplates } from '../contexts/TemplateContext';
import { PaperStructure, PaperTemplate, TemplatePage, PageSettings } from '../types';
import { Plus, Trash2, Save, ChevronLeft, Menu, FileText, Info } from 'lucide-react';

// --- Components ---

interface SectionItemProps {
    section: PaperStructure;
    path: number[];
    onUpdate: (path: number[], newSection: PaperStructure) => void;
    onDelete: (path: number[]) => void;
}

const SectionItem: React.FC<SectionItemProps> = ({ section, path, onUpdate, onDelete }) => {
    return (
        <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg group hover:border-blue-400 transition-colors">
            <div className="text-gray-400 cursor-move">
                <Menu size={16} />
            </div>
            <div className="flex-grow grid grid-cols-12 gap-3">
                <div className="col-span-8">
                    <input
                        type="text"
                        value={section.title}
                        onChange={(e) => onUpdate(path, { ...section, title: e.target.value })}
                        placeholder="Nama Sub-bab (Contoh: Latar Belakang)"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>
                <div className="col-span-4">
                    <input
                        type="number"
                        value={section.minWords || ''}
                        onChange={(e) => onUpdate(path, { ...section, minWords: parseInt(e.target.value) || 0 })}
                        placeholder="Target Kata"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>
            </div>
            <button
                onClick={() => onDelete(path)}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Hapus Sub-bab"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};

const ChapterCard: React.FC<{
    page: TemplatePage;
    index: number;
    onUpdate: (updatedPage: TemplatePage) => void;
    onDelete: () => void;
}> = ({ page, index, onUpdate, onDelete }) => {

    // Helper to create a new section
    const createSection = (): PaperStructure => ({
        id: `sec_${Date.now()}_${Math.random()}`,
        title: '',
        wordCount: 0,
        minWords: 300 // Default min words
    });

    const handleAddSection = () => {
        const newStructure = [...(page.structure || []), createSection()];
        onUpdate({ ...page, structure: newStructure });
    };

    const handleUpdateSection = (path: number[], updatedSection: PaperStructure) => {
        const newStructure = [...(page.structure || [])];
        newStructure[path[0]] = updatedSection;
        onUpdate({ ...page, structure: newStructure });
    };

    const handleDeleteSection = (path: number[]) => {
        if (window.confirm('Hapus sub-bab ini?')) {
            const newStructure = [...(page.structure || [])];
            newStructure.splice(path[0], 1);
            onUpdate({ ...page, structure: newStructure });
        }
    };

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                        Judul BAB {index + 1}
                    </label>
                    <input
                        type="text"
                        value={page.name}
                        onChange={(e) => onUpdate({ ...page, name: e.target.value })}
                        placeholder="Contoh: PENDAHULUAN"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg font-bold text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <button
                    onClick={onDelete}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-6"
                    title="Hapus BAB"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-gray-200 ml-2">
                {page.structure && page.structure.map((section, secIndex) => (
                    <SectionItem
                        key={section.id}
                        section={section}
                        path={[secIndex]}
                        onUpdate={handleUpdateSection}
                        onDelete={handleDeleteSection}
                    />
                ))}

                <button
                    onClick={handleAddSection}
                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                >
                    <Plus size={16} />
                    Tambah Sub-bab
                </button>
            </div>
        </div>
    );
};

// --- Main Page Component ---

const TemplateEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getTemplateById, addTemplate, updateTemplate } = useTemplates();
    const isNew = id === 'new' || id === undefined;

    // Default settings (hidden from user in simple mode used for export later)
    const defaultSettings: PageSettings = {
        paperSize: 'A4',
        margins: { top: 3, bottom: 3, left: 4, right: 3 },
        font: { family: 'Times New Roman', size: 12, lineHeight: 1.5 },
        paragraph: { indent: 1.27, spacing: 1.5 },
    };

    const [template, setTemplate] = useState<Omit<PaperTemplate, 'id'>>({
        name: '',
        description: '',
        pages: [],
        settings: defaultSettings
    });

    useEffect(() => {
        if (!isNew && id) {
            const existing = getTemplateById(id);
            if (existing) {
                setTemplate(existing);
            } else {
                navigate('/super-admin/templates');
            }
        }
    }, [id, isNew, navigate, getTemplateById]);

    const handleSave = async () => {
        if (!template.name.trim()) return alert('Nama template harus diisi');
        if (template.pages.length === 0) return alert('Minimal harus ada 1 BAB');

        try {
            if (isNew) {
                await addTemplate(template);
            } else if (id) {
                await updateTemplate({ ...template, id });
            }
            alert('Template berhasil disimpan!');
            navigate('/super-admin/templates');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan template');
        }
    };

    const addChapter = () => {
        const newPage: TemplatePage = {
            id: `page_${Date.now()}`,
            type: 'CONTENT', // Ensure we use CONTENT type for chapters
            name: '',
            order: template.pages.length,
            structure: [],
            numbering: { type: 'none', position: 'none' }
        };
        setTemplate(prev => ({
            ...prev,
            pages: [...prev.pages, newPage]
        }));
    };

    const updateChapter = (index: number, updatedPage: TemplatePage) => {
        const newPages = [...template.pages];
        newPages[index] = updatedPage;
        setTemplate(prev => ({ ...prev, pages: newPages }));
    };

    const deleteChapter = (index: number) => {
        if (window.confirm('Hapus BAB ini beserta seluruh isinya?')) {
            const newPages = template.pages.filter((_, i) => i !== index);
            setTemplate(prev => ({ ...prev, pages: newPages }));
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Header / Navigation */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/super-admin/templates')}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isNew ? 'Buat Template Struktur Makalah' : 'Edit Struktur Makalah'}
                        </h1>
                        <p className="text-gray-500">Definisikan BAB dan Sub-bab yang harus dikerjakan siswa.</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all"
                >
                    <Save size={18} />
                    Simpan Template
                </button>
            </div>

            {/* Template Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Nama Template</label>
                    <input
                        type="text"
                        value={template.name}
                        onChange={e => setTemplate(t => ({ ...t, name: e.target.value }))}
                        placeholder="Contoh: Skripsi D4 Koto"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Deskripsi</label>
                    <input
                        type="text"
                        value={template.description}
                        onChange={e => setTemplate(t => ({ ...t, description: e.target.value }))}
                        placeholder="Keterangan singkat tentang template ini"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Content Structure Builder */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-gray-800 border-b pb-4">
                    <FileText className="text-blue-600" />
                    <h2 className="text-lg font-bold">Struktur BAB & Sub-bab</h2>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
                    <Info className="shrink-0 mt-0.5" size={18} />
                    <p>
                        Buatlah struktur BAB sesuai urutan logika makalah. Siswa akan mengerjakan setiap BAB secara bertahap.
                        Setiap sub-bab akan menjadi kolom isian terpisah untuk siswa.
                    </p>
                </div>

                <div className="space-y-6">
                    {template.pages.map((page, index) => (
                        <ChapterCard
                            key={page.id}
                            page={page}
                            index={index}
                            onUpdate={(updated) => updateChapter(index, updated)}
                            onDelete={() => deleteChapter(index)}
                        />
                    ))}
                </div>

                <button
                    onClick={addChapter}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-semibold hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    Tambah BAB Baru
                </button>
            </div>
        </div>
    );
};

export default TemplateEditor;
