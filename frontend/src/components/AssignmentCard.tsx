
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Assignment, AssignmentStatus } from '../types';
import StatusBadge from './StatusBadge';

interface AssignmentCardProps {
  assignment: Assignment;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment }) => {
  const navigate = useNavigate();
  const { id, title, subject, deadline, status, progress } = assignment;
  // totalChapters comes from backend now (number of chapters)
  const totalChapters = (assignment as any).totalChapters || 0;

  const activationDateObj = assignment.activationDate ? new Date(assignment.activationDate) : new Date();
  const isUpcoming = activationDateObj > new Date();

  const handleAction = () => {
    if (status === AssignmentStatus.Completed) {
      // Use Paper ID for Results page, not Assignment ID
      if (assignment.myPaperId) {
        navigate(`/results/${assignment.myPaperId}`);
      } else {
        console.error("Missing myPaperId for completed assignment. Cannot show results.");
        alert("Maaf, data hasil belum tersedia. Hubungi Admin.");
      }
    } else if (status !== AssignmentStatus.Scheduled || !isUpcoming) {
      if (assignment.myPaperId) {
        navigate(`/student/paper/${assignment.myPaperId}`);
      } else {
        console.error("Missing myPaperId. Cannot ensure valid navigation.");
        alert("Maaf, lembar kerja Anda belum siap. Mohon tunggu sesaat atau hubungi Admin.");
      }
    }
  };

  const getActionText = () => {
    switch (status) {
      case AssignmentStatus.Draft:
        // DRAFT = Aktif (student is working on it)
        return "Lanjut Mengerjakan";
      case AssignmentStatus.Completed:
        return "Lihat Hasil & Feedback";
      case AssignmentStatus.Scheduled:
        return isUpcoming ? "Belum Dimulai" : "Mulai Mengerjakan";
      default:
        return "Mulai Mengerjakan";
    }
  };

  const deadlineDate = new Date(deadline);
  const isPastDeadline = new Date() > deadlineDate;
  // Only disable if Scheduled and upcoming
  const isActionDisabled = (status === AssignmentStatus.Scheduled && isUpcoming);

  // Calculate percentage based on chapters
  const completedChapters = progress || 0;
  const progressPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start">
          <p className="text-sm font-medium text-blue-600">{subject}</p>
          <StatusBadge status={status} />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mt-2">{title}</h3>
        {/* Show progress for active assignments (Draft status = Aktif) */}
        {status === AssignmentStatus.Draft && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{totalChapters > 0 ? progressPercent : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${totalChapters > 0 ? Math.min(progressPercent, 100) : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {totalChapters > 0
                ? `${completedChapters} / ${totalChapters} bab selesai`
                : 'Belum ada data progress'}
            </p>
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-between items-center">
        <div>
          <p className={`text-sm font-medium ${isPastDeadline && status !== AssignmentStatus.Completed ? 'text-red-600' : 'text-gray-600'}`}>
            Deadline: {deadlineDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {isUpcoming && (
            <p className="text-xs text-orange-600 mt-1">
              Dibuka: {activationDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button
          onClick={handleAction}
          disabled={isActionDisabled}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${isActionDisabled
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {getActionText()}
        </button>
      </div>
    </div>
  );
};

export default AssignmentCard;