import React, { useState, useEffect } from 'react';
import api from '../services/api';
import WelcomeBanner from '../components/dashboard/WelcomeBanner';
import StatCard from '../components/dashboard/StatCard';
import { SubmissionChart, GradeDistributionChart } from '../components/dashboard/RealCharts';
import {
  Users, FileText, Award, ShieldAlert, BarChart3, PieChart, Table, Download, CheckCircle
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { UserRole } from '../types';
import * as XLSX from 'xlsx';
import { useSystem } from '../contexts/SystemContext';
import GhostDashboard from './GhostDashboard';

const Reports: React.FC = () => {
  const { currentUser } = useUser();
  const { passingGrade } = useSystem();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeAssignments: 0,
    averageGrade: 0,
    violations: 0,
    completedTasks: 0,
    pendingReviews: 0,
    templates: 0,
    activeStudents: 0,
    passedStudents: 0,
    failedStudents: 0
  });
  const [grades, setGrades] = useState<any[]>([]);
  const [advisorReports, setAdvisorReports] = useState<any[]>([]);
  const [examinerReports, setExaminerReports] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grades' | 'advisors' | 'examiners'>('grades');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, gradesRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/grades').catch(err => ({ data: [] }))
        ]);

        if (statsRes.data) setStats(statsRes.data);
        if (gradesRes.data) setGrades(gradesRes.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch report data when tab changes
  useEffect(() => {
    const fetchReportData = async () => {
      if (activeTab === 'advisors' && advisorReports.length === 0) {
        try {
          const res = await api.get('/reports/advisors');
          setAdvisorReports(res.data);
        } catch (e) {
          console.error("Failed to fetch advisor report", e);
        }
      }
      if (activeTab === 'examiners' && examinerReports.length === 0) {
        try {
          const res = await api.get('/reports/examiners');
          setExaminerReports(res.data);
        } catch (e) {
          console.error("Failed to fetch examiner report", e);
        }
      }
    };
    fetchReportData();
  }, [activeTab]);

  const filteredGrades = grades.filter(grade => {
    if (filterStatus === 'passed') return grade.finalScore >= passingGrade;
    if (filterStatus === 'failed') return grade.finalScore < passingGrade;
    return true;
  });

  const handleExportGrades = () => {
    if (filteredGrades.length === 0) return;

    const dataToExport = filteredGrades.map((g, index) => ({
      'No': index + 1,
      'Nama Siswa': g.studentName,
      'NOSIS': g.studentId,
      'Judul Makalah': g.paperTitle,
      'Pembimbing': g.advisorName,
      'Penguji': g.examinerName,
      'Nilai Akhir': g.finalScore,
      'Status': g.finalScore >= passingGrade ? 'LULUS' : 'REMEDIAL',
      'Tanggal Penilaian': new Date(g.updatedAt).toLocaleDateString('id-ID')
    }));

    const statusLabel = filterStatus === 'all' ? 'Keseluruhan' : filterStatus === 'passed' ? 'Siswa_Lulus' : 'Siswa_Remedial';
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai');
    XLSX.writeFile(wb, `Laporan_Nilai_${statusLabel}.xlsx`);
  };

  const handleExportAdvisors = () => {
    if (advisorReports.length === 0) return;

    // Flatten data: 1 row per student
    const dataToExport: any[] = [];
    let counter = 1;

    advisorReports.forEach(advisor => {
      if (advisor.students.length === 0) {
        dataToExport.push({
          'No': counter++,
          'Nama Pembimbing': advisor.name,
          'Pangkat': advisor.rank || '-',
          'Total Bimbingan': 0,
          'Nama Siswa': '-',
          'NOSIS': '-',
          'Judul Makalah': '-'
        });
      } else {
        advisor.students.forEach((student: any) => {
          dataToExport.push({
            'No': counter++,
            'Nama Pembimbing': advisor.name,
            'Pangkat': advisor.rank || '-',
            'Total Bimbingan': advisor.studentCount,
            'Nama Siswa': student.name,
            'NOSIS': student.nosis,
            'Judul Makalah': student.title
          });
        });
      }
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Bimbingan');
    XLSX.writeFile(wb, `Laporan_Pembimbing.xlsx`);
  };

  const handleExportExaminers = () => {
    if (examinerReports.length === 0) return;

    const dataToExport = examinerReports.map((item, index) => ({
      'No': index + 1,
      'Nama Siswa': item.name,
      'NOSIS': item.nosis,
      'Judul Makalah': item.title,
      'Penguji 1': item.examiner1 ? `${item.examiner1.name} (${item.examiner1.rank || '-'})` : '-',
      'Penguji 2': item.examiner2 ? `${item.examiner2.name} (${item.examiner2.rank || '-'})` : '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Ujian');
    XLSX.writeFile(wb, `Laporan_Jadwal_Ujian.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-slate-500">Loading statistics...</div>
      </div>
    );
  }

  // --- GHOST / HELPER MODE REDIRECT ---
  if (currentUser?.role === UserRole.Helper) {
    return <GhostDashboard />;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header Section - Hide for Helper */}
      {currentUser?.role !== UserRole.Helper && (
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Laporan & Analitik</h1>
          <p className="mt-1 text-gray-600">Pusat data dan statistik kinerja sistem secara real-time.</p>
        </div>
      )}



      {/* Key Stats Grid - Hide for Helper */}
      {currentUser?.role !== UserRole.Helper && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Pengguna"
            value={stats.totalUsers}
            icon={Users}
            color="blue"
            description="Siswa & Dosen Terdaftar"
          />
          <StatCard
            title="Siswa Lulus"
            value={stats.passedStudents || 0}
            icon={CheckCircle}
            color="emerald"
            description="Memenuhi Syarat"
          />
          <StatCard
            title="Siswa Remedial"
            value={stats.failedStudents || 0}
            icon={ShieldAlert}
            color="rose"
            description="Perlu Perbaikan"
          />
          <StatCard
            title="Rata-rata Nilai"
            value={stats.averageGrade}
            icon={Award}
            color="amber"
            description="Seluruh Angkatan"
          />
          <StatCard
            title="Total Pelanggaran"
            value={stats.violations}
            icon={ShieldAlert}
            color="purple"
            description="Perlu Tindakan"
          />
        </div>
      )}

      {/* Comprehensive Reports Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Tab Navigation */}
        <div className="border-b border-gray-100 bg-gray-50 flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('grades')}
            className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === 'grades' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Table size={16} /> Laporan Penilaian
            </div>
          </button>
          <button
            onClick={() => setActiveTab('advisors')}
            className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === 'advisors' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={16} /> Laporan Bimbingan
            </div>
          </button>
          <button
            onClick={() => setActiveTab('examiners')}
            className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === 'examiners' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Award size={16} /> Laporan Ujian
            </div>
          </button>
        </div>

        {/* Tab Content: Grades */}
        {activeTab === 'grades' && (
          <>
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Rekapitulasi Nilai</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {filterStatus === 'all' ? 'Daftar lengkap hasil penilaian siswa.' :
                    filterStatus === 'passed' ? 'Daftar siswa yang lulus.' :
                      'Daftar siswa remedial.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-gray-200 rounded-lg p-1">
                  <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Semua</button>
                  <button onClick={() => setFilterStatus('passed')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === 'passed' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Lulus</button>
                  <button onClick={() => setFilterStatus('failed')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === 'failed' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Remedial</button>
                </div>

                <button
                  onClick={handleExportGrades}
                  disabled={filteredGrades.length === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filteredGrades.length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  <Download size={16} /> Export Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Siswa</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Judul Makalah</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Pembimbing</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Penguji</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center">Nilai Akhir</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGrades.length > 0 ? (
                    filteredGrades.map((grade) => (
                      <tr key={grade.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{grade.studentName}</div>
                          <div className="text-xs text-slate-500 font-mono">{grade.studentId}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={grade.paperTitle}>
                          {grade.paperTitle}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{grade.advisorName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{grade.examinerName}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${grade.finalScore < passingGrade ? 'bg-rose-100 text-rose-800' :
                            grade.finalScore >= 85 ? 'bg-emerald-100 text-emerald-800' :
                              grade.finalScore >= 75 ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                            }`}>
                            {grade.finalScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 text-right">
                          {grade.finalScore > 0
                            ? new Date(grade.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '-'
                          }
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                        Belum ada data penilaian yang tersedia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tab Content: Advisors */}
        {activeTab === 'advisors' && (
          <>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Laporan Bimbingan</h3>
                <p className="text-sm text-slate-500 mt-1">Daftar pembagian siswa per pembimbing.</p>
              </div>
              <button
                onClick={handleExportAdvisors}
                disabled={advisorReports.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${advisorReports.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                <Download size={16} /> Download Daftar Bimbingan
              </button>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider w-1/3">Pembimbing</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider w-2/3">Daftar Siswa Bimbingan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {advisorReports.map((advisor) => (
                    <tr key={advisor.id} className="hover:bg-slate-50 transition-colors align-top">
                      <td className="px-6 py-4 bg-gray-50/50">
                        <div className="font-bold text-slate-800">{advisor.name}</div>
                        <div className="text-xs text-slate-500">{advisor.rank}</div>
                        <div className="mt-2 text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 inline-block rounded">
                          Total: {advisor.studentCount} Siswa
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {advisor.students.length > 0 ? (
                          <div className="space-y-3">
                            {advisor.students.map((student: any, idx: number) => (
                              <div key={student.id} className="flex items-start gap-3 text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                <span className="font-mono text-gray-400 text-xs w-6">{idx + 1}.</span>
                                <div>
                                  <div className="font-medium text-slate-900">{student.name} <span className="text-slate-400 font-normal">({student.nosis})</span></div>
                                  <div className="text-slate-500 text-xs italic mt-0.5">{student.title !== '-' ? student.title : <span className="text-gray-300">Belum ada judul</span>}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-sm">Belum ada siswa bimbingan.</div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {advisorReports.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-12 text-center text-slate-400 italic">
                        Tidak ada data pembimbing.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tab Content: Examiners */}
        {activeTab === 'examiners' && (
          <>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Laporan Jadwal Ujian</h3>
                <p className="text-sm text-slate-500 mt-1">Daftar plotting penguji untuk setiap siswa.</p>
              </div>
              <button
                onClick={handleExportExaminers}
                disabled={examinerReports.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${examinerReports.length > 0
                  ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                <Download size={16} /> Download Daftar Ujian
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Siswa</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Judul Makalah</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Penguji 1</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Penguji 2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {examinerReports.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{item.nosis}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={item.title}>
                        {item.title}
                      </td>
                      <td className="px-6 py-4">
                        {item.examiner1 ? (
                          <div>
                            <div className="text-sm text-slate-800 font-medium">{item.examiner1.name}</div>
                            <div className="text-xs text-slate-500">{item.examiner1.rank}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-rose-500 italic">Belum ditentukan</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.examiner2 ? (
                          <div>
                            <div className="text-sm text-slate-800 font-medium">{item.examiner2.name}</div>
                            <div className="text-xs text-slate-500">{item.examiner2.rank}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-rose-200 italic">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {examinerReports.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                        Belum ada data ujian yang tersedia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submission Activity Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-blue-500" size={20} /> Aktivitas Pengumpulan
            </h3>
            <span className="text-xs font-medium text-slate-400">7 Hari Terakhir</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <SubmissionChart />
          </div>
        </div>

        {/* Grade Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="text-purple-500" size={20} /> Sebaran Nilai
            </h3>
            <span className="text-xs font-medium text-slate-400">Total</span>
          </div>
          <div className="flex-1 w-full min-h-0 flex items-center justify-center">
            <GradeDistributionChart />
          </div>
          {/* Legend */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-slate-600">
            <div className="flex items-center justify-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> A (Sangat Baik)</div>
            <div className="flex items-center justify-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> B (Baik)</div>
            <div className="flex items-center justify-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> C (Cukup)</div>
            <div className="flex items-center justify-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /> D (Kurang)</div>
          </div>
        </div>
      </div>

      {/* Additional Stats / Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-700 mb-2">Tugas Selesai</h4>
          <div className="text-3xl font-bold text-emerald-600">{stats.completedTasks}</div>
          <p className="text-sm text-gray-400 mt-1">Total tugas yang telah dinilai dan selesai.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-700 mb-2">Menunggu Review</h4>
          <div className="text-3xl font-bold text-amber-500">{stats.pendingReviews}</div>
          <p className="text-sm text-gray-400 mt-1">Tugas yang perlu diperiksa oleh pembimbing/penguji.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-700 mb-2">Siswa Aktif</h4>
          <div className="text-3xl font-bold text-blue-600">{stats.activeStudents}</div>
          <p className="text-sm text-gray-400 mt-1">Jumlah siswa yang aktif dalam sistem saat ini.</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
