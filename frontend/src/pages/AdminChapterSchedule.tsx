import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Save, Calendar, Clock, AlertCircle } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface ChapterSchedule {
  id?: string;
  chapterId?: string; // Link to Template Structure ID
  chapterTitle?: string; // For creation
  chapterName: string; // Display name (legacy)
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface Assignment {
  id: string;
  title: string;
  PaperTemplate: {
    pages: {
      structure: {
        title: string;
        id?: string;
      }[];
    }[];
  };
  ChapterSchedule: ChapterSchedule[];
}

const AdminChapterSchedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [schedules, setSchedules] = useState<ChapterSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const response = await api.get(`/assignments/${id}`);
      const data = response.data;
      setAssignment(data);

      // Initialize schedules based on Template Structure (ALL PAGES)
      const contentPages = data.PaperTemplate?.pages?.filter((p: any) => p.structure && Array.isArray(p.structure) && p.structure.length > 0);

      if (contentPages && contentPages.length > 0) {
        const existingSchedules = data.ChapterSchedule || [];
        const initialSchedules: any[] = [];

        contentPages.forEach((page: any) => {
          page.structure.forEach((chapter: any) => {
            // Try to match by ID first (better), then Title
            const existing = existingSchedules.find((s: any) =>
              (chapter.id && s.chapterId === chapter.id) ||
              s.chapterName === chapter.title
            );

            initialSchedules.push({
              chapterName: chapter.title,
              chapterTitle: chapter.title, // Send for creation
              chapterId: chapter.id || chapter.title, // Fallback to title if no ID (legacy template)
              startDate: existing ? (existing.startDate ? existing.startDate.split('T')[0] : '') : '',
              endDate: existing ? (existing.endDate ? existing.endDate.split('T')[0] : '') : '',
              isActive: existing ? existing.isActive : true,
              id: existing?.id
            });
          });
        });

        setSchedules(initialSchedules);
      } else {
        console.warn("No structure found in template pages");
      }
    } // This closing brace was misplaced. It should be the closing brace for the try block.
    catch (error) {
      console.error('Error fetching assignment:', error);
      setMessage({ type: 'error', text: 'Gagal mengambil data tugas.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Validate dates
      for (const sch of schedules) {
        if (!sch.startDate || !sch.endDate) {
          throw new Error(`Tanggal untuk ${sch.chapterName} belum lengkap.`);
        }
        if (new Date(sch.startDate) > new Date(sch.endDate)) {
          throw new Error(`Tanggal mulai tidak boleh lebih akhir dari tanggal selesai untuk ${sch.chapterName}.`);
        }
      }

      await api.put(`/assignments/${id}/schedules`, { schedules });
      setMessage({ type: 'success', text: 'Jadwal berhasil disimpan!' });

      // Refresh data
      fetchAssignment();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      setMessage({ type: 'error', text: error.message || error.response?.data?.message || 'Gagal menyimpan jadwal.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!assignment) return <div className="p-6">Tugas tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/super-admin/assignments')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft size={20} className="mr-2" />
          Kembali ke Manajemen Tugas
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Jadwal Pengerjaan BAB</h1>
          <p className="text-gray-600">
            Atur tanggal buka (Start) dan tutup (End) untuk setiap BAB pada tugas: <span className="font-semibold">{assignment.title}</span>
          </p>

          {message && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <AlertCircle size={20} />
              {message.text}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              <div className="col-span-4">BAB / Bagian</div>
              <div className="col-span-3">Tanggal Buka (Start)</div>
              <div className="col-span-3">Tanggal Tutup (End)</div>
              <div className="col-span-2 text-center">Durasi</div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {schedules.map((schedule, index) => {
              const start = schedule.startDate ? new Date(schedule.startDate) : null;
              const end = schedule.endDate ? new Date(schedule.endDate) : null;
              const duration = start && end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 0;

              return (
                <div key={index} className="p-6 hover:bg-gray-50 transition">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 font-medium text-gray-800 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      {schedule.chapterName}
                    </div>

                    <div className="col-span-3">
                      <div className="relative">
                        <input
                          type="date"
                          value={schedule.startDate}
                          onChange={(e) => handleDateChange(index, 'startDate', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="relative">
                        <input
                          type="date"
                          value={schedule.endDate}
                          onChange={(e) => handleDateChange(index, 'endDate', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      </div>
                    </div>

                    <div className="col-span-2 text-center text-sm font-medium text-gray-600">
                      {duration > 0 ? `${duration} hari` : '-'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChapterSchedule;