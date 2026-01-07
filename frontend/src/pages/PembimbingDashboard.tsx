
import React from 'react';

const PembimbingDashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Pembimbing Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome! Here are your students and their paper submission statuses.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Menunggu Review</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">3</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Sedang Revisi</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">2</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Sudah Approve</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">15</p>
        </div>
      </div>
    </div>
  );
};

export default PembimbingDashboard;