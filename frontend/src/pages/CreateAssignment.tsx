import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTemplates } from '../contexts/TemplateContext';
import { useAssignments } from '../contexts/AssignmentContext';
import { AssignmentStatus, PaperTemplate } from '../types';
import { ArrowLeftIcon, EyeIcon, InfoIcon, CheckCircleIcon, ExclamationIcon } from '../components/icons';
import api from '../services/api';

interface ChapterSchedule {
  id?: string;
  chapterId: string;
  chapterTitle: string;
  isOpen: boolean;
  openDate: string;
  closeDate: string;
}

interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

const CreateAssignment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: assignmentId } = useParams<{ id: string }>();
  const { templates } = useTemplates();
  const { addAssignment } = useAssignments();

  // Helper to sort chapters
  const sortChapters = (chapters: ChapterSchedule[]) => {
    const getRomanValue = (str: string) => {
      const map: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10 };
      const match = str.match(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)\b/i);
      return match ? map[match[0].toUpperCase()] : 999;
    };
    return [...chapters].sort((a, b) => {
      const valA = getRomanValue(a.chapterTitle || '');
      const valB = getRomanValue(b.chapterTitle || '');
      if (valA !== valB) return valA - valB;
      return (a.chapterTitle || '').localeCompare(b.chapterTitle || '');
    });
  };

  const isEditing = !!assignmentId;

  // Determine back path based on current route
  const backPath = location.pathname.includes('super-admin')
    ? '/super-admin/assignments'
    : '/admin/assignments';

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [activationDate, setActivationDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [enableChapterSchedule, setEnableChapterSchedule] = useState(false);
  const [chapterSchedules, setChapterSchedules] = useState<ChapterSchedule[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  // Fetch batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await api.get('/batches');
        setBatches(response.data.batches || []);
      } catch (error) {
        console.error('Error fetching batches:', error);
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchBatches();
  }, []);

  // Fetch Assignment Details if Editing
  useEffect(() => {
    if (isEditing && assignmentId) {
      const fetchAssignment = async () => {
        setLoadingAssignment(true);
        try {
          const response = await api.get(`/assignments/${assignmentId}`);
          const data = response.data.assignment;

          setTitle(data.title);
          setSubject(data.subject);
          setDeadline(data.deadline ? data.deadline.slice(0, 16) : '');
          setActivationDate(data.activationDate ? data.activationDate.slice(0, 16) : '');
          if (data.templateId) {
            setTemplateId(data.templateId);

            // Sync with actual template structure to catch new chapters
            const template = templates.find(t => t.id === data.templateId);
            let combinedSchedules: ChapterSchedule[] = [];

            if (template && template.pages) {
              const contentPages = Array.isArray(template.pages)
                ? template.pages.filter((p: any) => p.type === 'CONTENT')
                : [];

              if (contentPages.length > 0) {
                contentPages.forEach((page: any) => {
                  if (page.structure && Array.isArray(page.structure)) {
                    page.structure.forEach((chapter: any) => {
                      // Find existing schedule for this chapter
                      const existing = data.ChapterSchedule?.find((s: any) =>
                        s.chapterId === chapter.id || s.chapterTitle === chapter.title
                      );

                      combinedSchedules.push({
                        id: existing?.id, // Keep ID if exists to update
                        chapterId: chapter.id,
                        chapterTitle: chapter.title || page.name,
                        isOpen: existing?.isOpen ?? false,
                        openDate: existing?.openDate ? existing.openDate.slice(0, 16) : '',
                        closeDate: existing?.closeDate ? existing.closeDate.slice(0, 16) : ''
                      });
                    });
                  }
                });
              }
            } else {
              // Fallback if template not found locally yet (should rely on effect below context update, but let's try mapping existing first)
              if (data.ChapterSchedule) {
                combinedSchedules = data.ChapterSchedule.map((s: any) => ({
                  id: s.id,
                  chapterId: s.chapterId,
                  chapterTitle: s.chapterTitle,
                  isOpen: s.isOpen,
                  openDate: s.openDate ? s.openDate.slice(0, 16) : '',
                  closeDate: s.closeDate ? s.closeDate.slice(0, 16) : ''
                }));
              }
            }

            if (combinedSchedules.length > 0) {
              setChapterSchedules(sortChapters(combinedSchedules));

              // Only enable if there are actually saved schedules in the backend
              // If data.ChapterSchedule is empty (because we deleted them when disabling), 
              // this will remain false (Unchecked).
              if (data.ChapterSchedule && data.ChapterSchedule.length > 0) {
                setEnableChapterSchedule(true);
              } else {
                setEnableChapterSchedule(false);
              }
            }
          }

        } catch (err) {
          setError('Gagal memuat detail tugas.');
          console.error(err);
        } finally {
          setLoadingAssignment(false);
        }
      };
      fetchAssignment();
    }
  }, [isEditing, assignmentId]);

  // Update chapter schedules when template changes
  useEffect(() => {
    if (isEditing && loadingAssignment) return;

    if (templateId && enableChapterSchedule) {
      // Only populate if list is empty (first time or switched template)
      if (chapterSchedules.length === 0) {
        const template = templates.find(t => t.id === templateId);
        if (template && template.pages) {
          const contentPages = Array.isArray(template.pages)
            ? template.pages.filter((p: any) => p.type === 'CONTENT')
            : [];

          if (contentPages.length > 0) {
            // Aggregate chapters from ALL content pages
            const allChapters: ChapterSchedule[] = [];

            contentPages.forEach((page: any) => {
              if (page.structure && Array.isArray(page.structure)) {
                page.structure.forEach((chapter: any) => {
                  allChapters.push({
                    chapterId: chapter.id,
                    chapterTitle: chapter.title || page.name,
                    isOpen: false,
                    openDate: '',
                    closeDate: '',
                  });
                });
              }
            });

            setChapterSchedules(sortChapters(allChapters));
          }
        }
      }
    } else if (!enableChapterSchedule && !isEditing) {
      setChapterSchedules([]);
    }
  }, [templateId, enableChapterSchedule, templates, isEditing, loadingAssignment, chapterSchedules.length]);

  const handleSubmit = async (e: React.FormEvent, status: AssignmentStatus) => {
    e.preventDefault();

    if (!title || !subject || !deadline || !templateId) {
      setError('Semua field wajib diisi, termasuk memilih template.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const assignmentData: any = {
        title,
        subject,
        deadline: new Date(deadline).toISOString(),
        templateId,
        status,
        activationDate: activationDate ? new Date(activationDate).toISOString() : new Date().toISOString(),
        batchId: batchId || null, // Ensure batchId is sent
        chapterSchedules: enableChapterSchedule && chapterSchedules.length > 0
          ? chapterSchedules.map(s => ({
            ...s, // Include ID if editing
            openDate: s.openDate ? new Date(s.openDate).toISOString() : null,
            closeDate: s.closeDate ? new Date(s.closeDate).toISOString() : null,
          }))
          : []
      };

      if (isEditing) {
        await api.put(`/assignments/${assignmentId}`, assignmentData);
        alert('✅ Tugas berhasil diperbarui dan didistribusikan ke siswa!');
      } else {
        await addAssignment(assignmentData);
        alert(`✅ Tugas berhasil ${status === AssignmentStatus.Draft ? 'disimpan sebagai draft' : 'dipublikasikan'}!`);
      }

      navigate(backPath);
    } catch (err: any) {
      console.error(err);
      setError('Gagal menyimpan tugas: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === templateId);

  if (loadingAssignment) return <div className="p-8 text-center text-gray-500">Memuat data tugas...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(backPath)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Kembali"
        >
          <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{isEditing ? 'Edit Tugas' : 'Buat Tugas Baru'}</h1>
          <p className="text-gray-600 mt-1">Detail tugas, jadwal, dan distribusi</p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, AssignmentStatus.Scheduled)} className="space-y-6">
        {/* Info Box */}
        {isEditing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              ℹ️ <strong>Mode Edit:</strong> Perubahan pada tugas (seperti Angkatan) akan otomatis memperbarui distribusi ke siswa.
            </p>
          </div>
        )}

        {/* Assignment Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <InfoIcon className="w-5 h-5 text-blue-500" />
            Detail Tugas
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Judul Tugas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Contoh: Makalah Etika Profesi"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subjek <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Mata Pelajaran"
                required
              />
            </div>

            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                Template <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  id="template"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  required
                >
                  <option value="">Pilih template...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
                {selectedTemplate && (
                  <button
                    type="button"
                    onClick={() => setShowTemplatePreview(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    <EyeIcon className="w-5 h-5" />
                    Preview
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-1">
                Angkatan / Batch
              </label>
              <select
                id="batch"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                disabled={loadingBatches}
              >
                <option value="">Semua Angkatan (Global)</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} {!batch.isActive ? '(Non-aktif)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Pilih angkatan untuk mendistribusikan tugas secara otomatis ke siswa di angkatan tersebut.
              </p>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <InfoIcon className="w-5 h-5 text-green-500" />
            Jadwal
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="activationDate" className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Aktivasi (Mulai Terlihat)
              </label>
              <input
                type="datetime-local"
                id="activationDate"
                value={activationDate}
                onChange={(e) => setActivationDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                Deadline Pengumpulan <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
        </div>

        {/* Chapter Schedule Section (Optional) */}
        {selectedTemplate && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <InfoIcon className="w-5 h-5 text-purple-500" />
                Jadwal Per Bab
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableChapterSchedule}
                  onChange={(e) => setEnableChapterSchedule(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Aktifkan</span>
              </label>
            </div>

            {enableChapterSchedule && chapterSchedules.length > 0 && (
              <div className="space-y-4">
                {chapterSchedules.map((schedule, index) => (
                  <div key={schedule.chapterId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-800 mb-3">{schedule.chapterTitle}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buka</label>
                        <input
                          type="datetime-local"
                          value={schedule.openDate}
                          onChange={(e) => {
                            const newSchedules = [...chapterSchedules];
                            newSchedules[index].openDate = e.target.value;
                            setChapterSchedules(newSchedules);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tutup</label>
                        <input
                          type="datetime-local"
                          value={schedule.closeDate}
                          onChange={(e) => {
                            const newSchedules = [...chapterSchedules];
                            newSchedules[index].closeDate = e.target.value;
                            setChapterSchedules(newSchedules);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="px-6 py-3 font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Batal
          </button>
          <div className="flex gap-3">
            {!isEditing && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, AssignmentStatus.Draft)}
                disabled={isSubmitting}
                className="px-6 py-3 font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Simpan Draft
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Publikasikan')}
            </button>
          </div>
        </div>
      </form>

      {/* Template Preview Modal */}
      {showTemplatePreview && selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setShowTemplatePreview(false)}
        />
      )}
    </div>
  );
};

const TemplatePreviewModal: React.FC<{
  template: PaperTemplate;
  onClose: () => void;
}> = ({ template, onClose }) => {
  // Basic preview logic
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold mb-4">{template.name}</h2>
        <div className="max-h-[60vh] overflow-y-auto mb-6">
          <p>{template.description}</p>
          {/* Simplified preview */}
        </div>
        <button onClick={onClose} className="w-full bg-blue-600 text-white py-2 rounded">
          Tutup
        </button>
      </div>
    </div>
  );
}

export default CreateAssignment;