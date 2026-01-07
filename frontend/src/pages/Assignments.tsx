import React, { useState, useMemo, useEffect } from 'react';
import { useAssignments } from '../contexts/AssignmentContext';
import AssignmentCard from '../components/AssignmentCard';
import { AssignmentStatus } from '../types';
import { SearchIcon } from '../components/icons';

type Tab = 'all' | 'active' | 'completed' | 'scheduled';

const Assignments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const { assignments: allAssignments, refreshAssignments } = useAssignments();

  // Refresh assignments when component mounts to get latest status
  useEffect(() => {
    refreshAssignments();
  }, []);

  const filteredAssignments = useMemo(() => {
    let assignments = allAssignments.filter(a =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const now = new Date();

    switch (activeTab) {
      case 'active':
        // Show SCHEDULED assignments that have started (activationDate <= now)
        return assignments.filter(a =>
          a.status === AssignmentStatus.Scheduled &&
          (a.activationDate ? new Date(a.activationDate) <= now : true)
        );
      case 'completed':
        return assignments.filter(a => a.status === AssignmentStatus.Completed);
      case 'scheduled':
        // Show SCHEDULED assignments that are future (activationDate > now)
        return assignments.filter(a =>
          a.status === AssignmentStatus.Scheduled &&
          (a.activationDate ? new Date(a.activationDate) > now : false)
        );
      case 'all':
      default:
        // Hide Drafts from "All" for students? Or show everything?
        // Usually students shouldn't see Drafts at all. Assuming backend filters drafts for students? 
        // If not, we filter here.
        return assignments.filter(a => a.status !== AssignmentStatus.Draft);
    }
  }, [searchTerm, activeTab, allAssignments]);

  const getTabClass = (tab: Tab) => {
    return `px-4 py-2 font-semibold rounded-md transition-colors text-sm ${activeTab === tab
      ? 'bg-blue-600 text-white'
      : 'text-gray-600 hover:bg-gray-200'
      }`;
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'Semua', count: allAssignments.length },
    { key: 'active', label: 'Aktif', count: allAssignments.filter(a => a.status === AssignmentStatus.Draft).length },
    { key: 'completed', label: 'Selesai', count: allAssignments.filter(a => a.status === AssignmentStatus.Completed).length },
    { key: 'scheduled', label: 'Terjadwal', count: allAssignments.filter(a => a.status === AssignmentStatus.Scheduled).length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tugas Makalah</h1>
          <p className="mt-1 text-gray-600">Lihat dan kelola semua tugas makalah Anda di sini.</p>
        </div>
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Cari tugas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-2">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={getTabClass(tab.key)}>
            {tab.label} <span className="ml-1.5 bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      <div>
        {filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800">Tidak Ada Tugas Ditemukan</h3>
            <p className="text-gray-500 mt-2">Coba ubah filter atau kata kunci pencarian Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;