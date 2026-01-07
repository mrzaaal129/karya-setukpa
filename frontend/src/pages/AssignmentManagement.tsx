import React, { useState, useEffect } from 'react';
import { useAssignments } from '../contexts/AssignmentContext';
import { useTemplates } from '../contexts/TemplateContext';
import { Assignment, AssignmentStatus } from '../types';
import { PlusCircleIcon, SearchIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '../components/icons';
import ChapterManagementModal from '../components/ChapterManagementModal';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AssignmentManagement: React.FC = () => {
    const { assignments, isLoading, refreshAssignments } = useAssignments();
    const { templates } = useTemplates();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

    // Refresh assignments when component mounts (e.g., after returning from edit page)
    useEffect(() => {
        refreshAssignments();
    }, []);


    const filteredAssignments = assignments.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || a.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Navigate to CreateAssignment page in Edit Mode
    const handleEdit = (assignment: Assignment) => {
        navigate(`/super-admin/assignments/edit/${assignment.id}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus tugas ini? Ini akan menghapus semua paper siswa terkait!')) return;

        try {
            await api.delete(`/assignments/${id}`);
            await refreshAssignments();
            alert('✅ Tugas berhasil dihapus!');
        } catch (error) {
            console.error('Delete error:', error);
            alert('❌ Gagal menghapus tugas');
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: AssignmentStatus) => {
        try {
            await api.put(`/assignments/${id}`, { status: newStatus });
            await refreshAssignments();
        } catch (error) {
            console.error('Update error:', error);
            alert('❌ Gagal mengupdate status');
        }
    };

    const getStatusBadge = (status: AssignmentStatus) => {
        const badges = {
            [AssignmentStatus.Draft]: 'bg-gray-100 text-gray-700',
            [AssignmentStatus.Scheduled]: 'bg-green-100 text-green-700',
            [AssignmentStatus.Completed]: 'bg-purple-100 text-purple-700',
        };
        return badges[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusLabel = (status: AssignmentStatus) => {
        const labels = {
            [AssignmentStatus.Draft]: 'Draft',
            [AssignmentStatus.Scheduled]: 'Publik (Terjadwal)',
            [AssignmentStatus.Completed]: 'Selesai',
        };
        return labels[status] || status;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Kelola Tugas</h1>
                    <p className="mt-1 text-gray-600">Kelola semua tugas yang telah didistribusikan</p>
                </div>
                <button
                    onClick={() => navigate('/super-admin/create-assignment')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    Buat Tugas Baru
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
                <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari tugas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">Semua Status</option>
                    <option value={AssignmentStatus.Scheduled}>Terjadwal</option>
                    <option value={AssignmentStatus.Draft}>Aktif</option>
                    <option value={AssignmentStatus.Completed}>Selesai</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul Tugas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : filteredAssignments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    {searchTerm || filterStatus !== 'all' ? 'Tidak ada tugas yang sesuai filter' : 'Belum ada tugas. Buat tugas baru untuk memulai.'}
                                </td>
                            </tr>
                        ) : (
                            filteredAssignments.map((assignment) => {
                                const template = templates.find(t => t.id === assignment.templateId);
                                return (
                                    <tr key={assignment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">{assignment.subject}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">{template?.name || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {new Date(assignment.deadline).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${getStatusBadge(assignment.status)}`}>
                                                {getStatusLabel(assignment.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAssignment(assignment);
                                                        setShowChapterModal(true);
                                                    }}
                                                    className="text-purple-600 hover:text-purple-900"
                                                    title="Kelola Chapter"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(assignment)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(assignment.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                                {assignment.status === AssignmentStatus.Draft && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(assignment.id, AssignmentStatus.Scheduled)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Aktifkan"
                                                    >
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Chapter Management Modal - Keep this one */}
            {showChapterModal && selectedAssignment && (
                <ChapterManagementModal
                    assignmentId={selectedAssignment.id}
                    assignmentTitle={selectedAssignment.title}
                    onClose={() => {
                        setShowChapterModal(false);
                        setSelectedAssignment(null);
                    }}
                />
            )}
        </div>
    );
};

export default AssignmentManagement;
