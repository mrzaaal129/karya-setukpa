import React from 'react';
import { useUser } from '../contexts/UserContext';
import SuperAdminDashboard from './SuperAdminDashboard';
import StudentDashboard from './StudentDashboard';
import AdvisorDashboard from './AdvisorDashboard';
import ExaminerDashboard from './ExaminerDashboard';
import Reports from './Reports';


const DashboardDispatcher: React.FC = () => {
  const { currentUser } = useUser();

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  // Route to appropriate dashboard based on user role
  switch (currentUser.role) {
    case 'SISWA':
      return <StudentDashboard />;
    case 'PEMBIMBING':
      return <AdvisorDashboard />;
    case 'PENGUJI':
      return <ExaminerDashboard />;
    case 'HELPER':
      return <Reports />; // Helper defaults to Reports page for quick access
    case 'SUPER_ADMIN':
    case 'ADMIN':
    default:
      return <SuperAdminDashboard />;
  }
};

export default DashboardDispatcher;
