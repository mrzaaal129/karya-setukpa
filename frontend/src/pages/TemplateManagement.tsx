import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../contexts/TemplateContext';
import {
    Plus,
    Search,
    Filter,
    FileCheck,
    TrendingUp,
    LayoutTemplate,
    PenTool,
    BookOpen,
    FileText,
    MoreHorizontal,
    Trash2,
    Edit3,
    Copy,
    Save,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    SortAsc
} from 'lucide-react';
import { PaperTemplate } from '../types';

const TemplateManagement: React.FC = () => {
    const { templates, deleteTemplate, addTemplate } = useTemplates();
    const navigate = useNavigate();

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
    const [itemsPerPage, setItemsPerPage] = useState<number>(12);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // New State for View Mode

    const safeTemplates = Array.isArray(templates) ? templates : [];

    const handleDelete = (templateId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Apakah Anda yakin ingin menghapus template ini? Ini tidak dapat dibatalkan.')) {
            deleteTemplate(templateId);
        }
    };

    const handleDuplicate = async (template: PaperTemplate, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Duplikasi template "${template.name}"?`)) {
            try {
                const { id, ...templateData } = template;
                await addTemplate({
                    ...templateData,
                    name: `${template.name} (Copy)`,
                    updatedAt: new Date().toISOString()
                });
            } catch (error) {
                console.error("Failed to duplicate:", error);
                alert("Gagal menduplikasi template.");
            }
        }
    };

    // Filter & Sort Logic
    const filteredTemplates = safeTemplates
        .filter(template => template.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
            } else if (sortBy === 'oldest') {
                return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
            } else {
                return a.name.localeCompare(b.name);
            }
        });

    // Pagination Logic
    const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
    const paginatedTemplates = filteredTemplates.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stats
    const totalTemplates = safeTemplates.length;
    const recentTemplates = safeTemplates.filter(t => {
        const date = new Date(t.updatedAt || '');
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    }).length;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-40"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-100 rounded-full blur-3xl opacity-40"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                {/* Header & Stats Row */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 rounded-full bg-white shadow-sm border border-gray-100 text-gray-500 text-xs font-bold tracking-widest uppercase">
                                Super Admin
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
                            Manajemen <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Template</span>
                        </h1>
                        <p className="mt-4 text-gray-500 text-lg font-medium max-w-xl">
                            Kelola standar dokumen Setukpa dengan gaya. Buat template yang konsisten dan profesional.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <StatCard
                            icon={<FileCheck size={28} className="text-white" />}
                            label="Total Template"
                            value={totalTemplates}
                            color="bg-orange-400"
                        />
                        <StatCard
                            icon={<TrendingUp size={28} className="text-white" />}
                            label="Baru Minggu Ini"
                            value={recentTemplates}
                            color="bg-emerald-400"
                        />
                    </div>
                </div>

                {/* Toolbar */}
                <div className="mb-8 flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 group max-w-2xl">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama template..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="block w-full pl-14 pr-5 py-3.5 border-none rounded-2xl bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] placeholder-gray-400 focus:ring-2 focus:ring-blue-100 text-gray-700 text-lg font-medium transition-all"
                        />
                    </div>

                    {/* Controls Group */}
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* View Switcher (Grid / List) */}
                        <div className="flex items-center bg-white rounded-xl shadow-sm p-1 border border-gray-100">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Tampilan Grid (Besar)"
                            >
                                <LayoutTemplate size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Tampilan List (Kecil)"
                            >
                                <div className="flex flex-col gap-0.5">
                                    <div className="w-5 h-0.5 bg-current rounded-full"></div>
                                    <div className="w-5 h-0.5 bg-current rounded-full"></div>
                                    <div className="w-5 h-0.5 bg-current rounded-full"></div>
                                </div>
                            </button>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSortMenu(!showSortMenu)}
                                className="flex items-center gap-2 px-4 py-3.5 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                <Filter size={18} className="text-gray-400" />
                                <span className="text-sm">
                                    {sortBy === 'newest' ? 'Terbaru' : sortBy === 'oldest' ? 'Terlama' : 'Abjad A-Z'}
                                </span>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showSortMenu && (
                                <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <button onClick={() => { setSortBy('newest'); setShowSortMenu(false); setCurrentPage(1); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${sortBy === 'newest' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>Terbaru</button>
                                    <button onClick={() => { setSortBy('oldest'); setShowSortMenu(false); setCurrentPage(1); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${sortBy === 'oldest' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>Terlama</button>
                                    <button onClick={() => { setSortBy('name'); setShowSortMenu(false); setCurrentPage(1); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${sortBy === 'name' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>Abjad A-Z</button>
                                </div>
                            )}
                        </div>

                        {/* New Button */}
                        <button
                            onClick={() => navigate('/template-editor/new')}
                            className="flex items-center justify-center px-6 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-black font-bold text-sm shadow-xl shadow-gray-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ml-auto xl:ml-0"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Buat Baru
                        </button>
                    </div>
                </div>

                {/* Grid */}
                {paginatedTemplates.length > 0 ? (
                    <>
                        <div className={viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            : "flex flex-col gap-3"
                        }>
                            {paginatedTemplates.map((template, index) => (
                                viewMode === 'grid' ? (
                                    <DocumentCard
                                        key={template.id}
                                        template={template}
                                        onDelete={handleDelete}
                                        onDuplicate={handleDuplicate}
                                        index={index + ((currentPage - 1) * itemsPerPage)}
                                    />
                                ) : (
                                    <DocumentListItem
                                        key={template.id}
                                        template={template}
                                        onDelete={handleDelete}
                                        onDuplicate={handleDuplicate}
                                        index={index + ((currentPage - 1) * itemsPerPage)}
                                    />
                                )
                            ))}
                        </div>

                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex justify-center items-center gap-4">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-gray-600 font-medium">
                                    Halaman <span className="text-black font-bold">{currentPage}</span> dari {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                            <LayoutTemplate className="w-12 h-12 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Tidak Ada Template</h3>
                        <p className="text-gray-500 mt-2">Coba ubah filter atau kata kunci pencarian Anda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
    <div className={`p-5 rounded-3xl ${color} text-white shadow-lg shadow-gray-200 min-w-[160px] transform hover:scale-105 transition-transform duration-300`}>
        <div className="mb-4 bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            {icon}
        </div>
        <p className="text-sm font-semibold opacity-90 mb-1">{label}</p>
        <h4 className="text-3xl font-black">{value}</h4>
    </div>
);

const DocumentCard: React.FC<{
    template: PaperTemplate;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onDuplicate: (template: PaperTemplate, e: React.MouseEvent) => void;
    index: number;
}> = ({ template, onDelete, onDuplicate, index }) => {
    const navigate = useNavigate();

    // Elegant "Clean & Colorful" Themes
    const themes = [
        {
            bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
            accent: 'bg-blue-500',
            text: 'text-blue-600',
            light_accent: 'bg-blue-100 text-blue-700'
        },
        {
            bg: 'bg-gradient-to-br from-rose-50 to-pink-50',
            accent: 'bg-rose-500',
            text: 'text-rose-600',
            light_accent: 'bg-rose-100 text-rose-700'
        },
        {
            bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
            accent: 'bg-emerald-500',
            text: 'text-emerald-600',
            light_accent: 'bg-emerald-100 text-emerald-700'
        },
        {
            bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
            accent: 'bg-amber-500',
            text: 'text-amber-600',
            light_accent: 'bg-amber-100 text-amber-800'
        },
        {
            bg: 'bg-gradient-to-br from-violet-50 to-purple-50',
            accent: 'bg-violet-500',
            text: 'text-violet-600',
            light_accent: 'bg-violet-100 text-violet-700'
        }
    ];

    const theme = themes[index % themes.length];

    return (
        <div
            onClick={() => navigate(`/template-editor/${template.id}`)}
            className="group bg-white rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)] border border-gray-100 hover:border-gray-200 transition-all duration-500 cursor-pointer flex flex-col overflow-hidden relative h-full"
        >
            {/* Action Buttons (Floating on hover) */}
            <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/template-editor/${template.id}`); }}
                    className="p-2 bg-white text-gray-600 hover:text-blue-600 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                    title="Edit"
                >
                    <Edit3 size={14} />
                </button>
                <button
                    onClick={(e) => onDuplicate(template, e)}
                    className="p-2 bg-white text-gray-600 hover:text-emerald-600 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                    title="Duplikat"
                >
                    <Copy size={14} />
                </button>
                <button
                    onClick={(e) => onDelete(template.id, e)}
                    className="p-2 bg-white text-gray-600 hover:text-rose-500 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                    title="Hapus"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Preview Section - Elegant Gradient Background */}
            <div className={`${theme.bg} h-52 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500`}>

                {/* Abstract Blobs for "Pop" */}
                <div className={`absolute top-[-20%] right-[-20%] w-32 h-32 rounded-full ${theme.accent} opacity-10 blur-2xl`}></div>
                <div className={`absolute bottom-[-10%] left-[-10%] w-24 h-24 rounded-full ${theme.accent} opacity-5 blur-xl`}></div>

                {/* The "Mini Document" Paper */}
                <div className="w-28 h-36 bg-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] rounded-lg transform group-hover:-translate-y-1 group-hover:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.15)] transition-all duration-500 flex flex-col p-4 gap-2.5 relative z-10 border border-gray-50/50">
                    {/* Header Line */}
                    <div className={`h-2 w-16 rounded-full ${theme.accent} opacity-80 mb-1`}></div>
                    {/* Skeleton Text */}
                    <div className="space-y-1.5 opacity-40">
                        <div className="h-1 w-full bg-slate-800 rounded-full"></div>
                        <div className="h-1 w-5/6 bg-slate-800 rounded-full"></div>
                        <div className="h-1 w-full bg-slate-800 rounded-full"></div>
                    </div>
                    {/* Image Placeholder */}
                    <div className={`mt-3 h-12 w-full ${theme.light_accent} rounded bg-opacity-30 border border-dashed border-current opacity-60`}></div>
                </div>

                {/* Second Paper Stack (Decoration) */}
                <div className="absolute w-24 h-32 bg-white/80 rounded-lg shadow-sm rotate-6 translate-x-3 translate-y-2 opacity-40 z-0"></div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex-1 flex flex-col bg-white">
                <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${theme.light_accent}`}>
                        {template.pages?.length || 0} HALAMAN
                    </span>
                </div>

                <h3 className={`text-lg font-bold text-gray-900 leading-snug line-clamp-2 transition-colors duration-300 group-hover:${theme.text}`}>
                    {template.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed font-medium">
                    {template.description || "Dokumen standar akademik resmi."}
                </p>

                <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] text-gray-400 font-semibold tracking-wider uppercase border-t border-gray-50">
                    <span>Terakhir Update</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{new Date(template.updatedAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                </div>
            </div>
        </div>
    );
};

const DocumentListItem: React.FC<{
    template: PaperTemplate;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onDuplicate: (template: PaperTemplate, e: React.MouseEvent) => void;
    index: number;
}> = ({ template, onDelete, onDuplicate, index }) => {
    const navigate = useNavigate();

    // Simple accents for list view icons
    const listAccents = ['bg-blue-100 text-blue-600', 'bg-rose-100 text-rose-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-purple-100 text-purple-600'];
    const accent = listAccents[index % listAccents.length];

    return (
        <div
            onClick={() => navigate(`/template-editor/${template.id}`)}
            className="group flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
        >
            {/* Small Icon Preview */}
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
                <FileText size={20} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {template.name}
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                        <LayoutTemplate size={12} />
                        {template.pages?.length || 0} Halaman
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>Updated {new Date(template.updatedAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                </div>
            </div>

            {/* Actions (Always visible on mobile, hover on desktop) */}
            <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/template-editor/${template.id}`); }}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                >
                    <Edit3 size={16} />
                </button>
                <button
                    onClick={(e) => onDuplicate(template, e)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                    title="Duplikat"
                >
                    <Copy size={16} />
                </button>
                <button
                    onClick={(e) => onDelete(template.id, e)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Hapus"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default TemplateManagement;