
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircleIcon } from '../components/icons';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Kelola tugas, pantau siswa, dan lihat pelanggaran di sini.</p>
        </div>
        <button
          onClick={() => navigate('/admin/create-assignment')}
          className="px-5 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <PlusCircleIcon className="h-5 w-5" />
          <span>Buat Tugas Baru</span>
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Tugas Dibuat</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Siswa Aktif</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">45</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Progress Tugas</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">78%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Pelanggaran</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">3</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;