
import React from 'react';

const PengujiDashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Penguji Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome! Here are the papers that require your evaluation.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Menunggu Penilaian</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">5</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Sudah Dinilai</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">28</p>
        </div>
      </div>
    </div>
  );
};

export default PengujiDashboard;