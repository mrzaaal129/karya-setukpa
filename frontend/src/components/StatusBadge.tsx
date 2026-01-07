
import React from 'react';
import { AssignmentStatus } from '../types';

interface StatusBadgeProps {
  status: AssignmentStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case AssignmentStatus.Draft: return 'bg-green-100 text-green-800'; // Aktif
      case AssignmentStatus.Completed: return 'bg-purple-100 text-purple-800'; // Selesai
      case AssignmentStatus.Scheduled: return 'bg-blue-100 text-blue-800'; // Terjadwal
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case AssignmentStatus.Draft: return 'Aktif';
      case AssignmentStatus.Completed: return 'Selesai';
      case AssignmentStatus.Scheduled: return 'Terjadwal';
      default: return status;
    }
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
      {getStatusLabel()}
    </span>
  );
};

export default StatusBadge;