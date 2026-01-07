import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Use valid API service
import { ChartBarIcon, CheckCircleIcon, ExclamationIcon } from '../components/icons';

const Grades: React.FC = () => {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await api.get('/grades/student');
        setGrades(response.data);
      } catch (error) {
        console.error('Failed to fetch grades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  if (loading) return <div>Loading...</div>;

  const averageScore = grades.length > 0
    ? grades.reduce((acc, curr) => acc + curr.finalScore, 0) / grades.length
    : 0;

  const passingGrade = 70;
  const passedCount = grades.filter(g => g.finalScore >= passingGrade).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Nilai & Hasil</h1>
        <p className="mt-1 text-gray-600">Rangkuman hasil dan nilai dari semua tugas yang telah selesai.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-blue-100">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Nilai Rata-rata</p>
              <p className="text-2xl font-bold text-gray-800">{averageScore.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tugas Lulus</p>
              <p className="text-2xl font-bold text-gray-800">{passedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-red-100">
              <ExclamationIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tugas Tidak Lulus</p>
              <p className="text-2xl font-bold text-gray-800">{grades.length - passedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Rincian Nilai per Tugas</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {grades.length > 0 ? (
            grades.map(grade => {
              const isPass = grade.finalScore >= passingGrade;
              return (
                <div key={grade.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800">{grade.title}</p>
                    <p className="text-sm text-gray-500">{grade.subject}</p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Nilai Akhir</p>
                      <p className={`text-xl font-bold ${isPass ? 'text-green-600' : 'text-red-600'}`}>{grade.finalScore}</p>
                    </div>
                    <Link to={`/results/${grade.id}`} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                      Lihat Rincian
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-8">Belum ada tugas yang selesai dan dinilai.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Grades;