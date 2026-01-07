import React from 'react';
import { HashRouter, Routes, Route, Outlet, useParams, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { TemplateProvider } from './contexts/TemplateContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SystemProvider } from './contexts/SystemContext';
import { AssignmentProvider } from './contexts/AssignmentContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import { UserRole } from './types'; // Import UserRole
import Login from './pages/Login';
import Editor from './pages/Editor';
import Results from './pages/Results';
import Assignments from './pages/Assignments';
import Grades from './pages/Grades';
import DashboardDispatcher from './pages/DashboardDispatcher';
import CreateAssignment from './pages/CreateAssignment';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import SystemSettings from './pages/SystemSettings';
import SuperAdminTemplateManager from './pages/SuperAdminTemplateManager';
import CreateTemplate from './pages/CreateTemplate';
import TemplateEditor from './pages/TemplateEditor';
// import SimpleTemplateCreator from './pages/SimpleTemplateCreator'; // Removed
import TemplateManagement from './pages/TemplateManagement';
import PreviewTemplate from './pages/PreviewTemplate';
import AdminChapterSchedule from './pages/AdminChapterSchedule';
import DownloadPaper from './pages/DownloadPaper';
import StudentContentEditor from './pages/StudentContentEditor';
import FinalSubmission from './pages/FinalSubmission';
import AdvisorAssignment from './pages/AdvisorAssignment';
import AdvisorReview from './pages/AdvisorReview';
import AdvisorFinalReview from './pages/AdvisorFinalReview';
import ExaminerGrading from './pages/ExaminerGrading';
import AdvisorDashboard from './pages/AdvisorDashboard';
import AdvisorStudentList from './pages/AdvisorStudentList';
import ExaminerDashboard from './pages/ExaminerDashboard';
import StudentManagement from './pages/StudentManagement';
import BatchManagement from './pages/BatchManagement';
import AdvisorManagement from './pages/admin/AdvisorManagement';
import ExaminerManagement from './pages/admin/ExaminerManagement';
import ExaminerAssignment from './pages/ExaminerAssignment';
import ExaminerStudentList from './pages/ExaminerStudentList';
import MultiPageEditorDemo from './pages/MultiPageEditorDemo';
import OnlyOfficeDemo from './pages/OnlyOfficeDemo';
import CollaboraDemo from './pages/CollaboraDemo';
import AdminManagement from './pages/admin/AdminManagement';
import AssignmentManagement from './pages/AssignmentManagement';
import ViolationManagement from './pages/ViolationManagement';

const EditorWithKey: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Editor key={id} />;
};

const App: React.FC = () => {
  return (
    <div className="bg-slate-100 min-h-screen">
      <HashRouter>
        <AuthProvider>
          <SystemProvider>
            <AssignmentProvider>
              <Routes>
                {/* Public route */}
                <Route path="/login" element={<Login />} />

                {/* Protected routes */}
                <Route
                  element={
                    <UserProvider>
                      <NotificationProvider>
                        <TemplateProvider>
                          <Layout>
                            <Outlet />
                          </Layout>
                        </TemplateProvider>
                      </NotificationProvider>
                    </UserProvider>
                  }
                >
                  <Route path="/" element={<DashboardDispatcher />} />

                  <Route path="/assignments" element={<Assignments />} />
                  <Route path="/grades" element={<Grades />} />
                  <Route path="/editor/:id" element={<EditorWithKey />} />
                  <Route path="/results/:id" element={<Results />} />
                  <Route path="/download/:id" element={<DownloadPaper />} />
                  <Route path="/student/paper/:id" element={<StudentContentEditor />} />
                  <Route path="/student/submission/:id" element={<FinalSubmission />} />

                  <Route path="/admin/create-assignment" element={<CreateAssignment />} />
                  <Route path="/admin/assignments" element={<AssignmentManagement />} />
                  <Route path="/admin/advisors" element={<AdvisorManagement />} />
                  <Route path="/admin/examiners" element={<ExaminerManagement />} />
                  <Route path="/admin/assignments/:id/schedule" element={<AdminChapterSchedule />} />

                  <Route path="/users" element={<Navigate to="/users/siswa" replace />} />
                  <Route path="/users/siswa" element={<StudentManagement />} />
                  <Route path="/users/admin" element={<AdminManagement />} />
                  <Route path="/users/:roleParam" element={<UserManagement />} />
                  <Route path="/batches" element={<BatchManagement />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<SystemSettings />} />
                  <Route path="/violations" element={<ViolationManagement />} />

                  <Route path="/templates" element={<TemplateManagement />} />
                  <Route path="/super-admin/templates" element={<TemplateManagement />} />
                  {/* Redirect old simple routes to the new CreateTemplate */}
                  <Route path="/super-admin/templates/new" element={<CreateTemplate />} />
                  <Route path="/template-editor/new" element={<CreateTemplate />} />
                  <Route path="/template-editor/:id" element={<CreateTemplate />} />
                  <Route path="/super-admin/templates/edit/:id" element={<CreateTemplate />} />
                  <Route path="/super-admin/templates/preview/:id" element={<PreviewTemplate />} />
                  <Route path="/super-admin/templates/demo" element={<MultiPageEditorDemo />} />
                  <Route path="/super-admin/templates/onlyoffice-demo" element={<OnlyOfficeDemo />} />
                  <Route path="/super-admin/templates/collabora-demo" element={<CollaboraDemo />} />
                  <Route path="/super-admin/advisor-assignment" element={<AdvisorAssignment />} />

                  {/* Advisor Routes */}
                  <Route path="/advisor/dashboard" element={
                    <ProtectedRoute allowedRoles={[UserRole.Pembimbing]}>
                      <AdvisorDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/advisor/students" element={
                    <ProtectedRoute allowedRoles={[UserRole.Pembimbing]}>
                      <AdvisorStudentList />
                    </ProtectedRoute>
                  } />
                  <Route path="/advisor/review/:id" element={
                    <ProtectedRoute allowedRoles={[UserRole.Pembimbing]}>
                      <AdvisorReview />
                    </ProtectedRoute>
                  } />
                  <Route path="/advisor/final-review/:id" element={
                    <ProtectedRoute allowedRoles={[UserRole.Pembimbing]}>
                      <AdvisorFinalReview />
                    </ProtectedRoute>
                  } />

                  {/* Examiner Routes */}
                  <Route path="/examiner/dashboard" element={
                    <ProtectedRoute allowedRoles={[UserRole.Penguji]}>
                      <ExaminerDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/examiner/grading/:id" element={
                    <ProtectedRoute allowedRoles={[UserRole.Penguji]}>
                      <ExaminerGrading />
                    </ProtectedRoute>
                  } />
                  <Route path="/examiner/students" element={
                    <ProtectedRoute allowedRoles={[UserRole.Penguji]}>
                      <ExaminerStudentList />
                    </ProtectedRoute>
                  } />

                  <Route path="/student/paper/:id" element={<StudentContentEditor />} />
                  <Route path="/student/final-submission/:id" element={<FinalSubmission />} />

                  <Route path="/super-admin/examiner-assignment" element={<ExaminerAssignment />} />
                  <Route path="/super-admin/create-assignment" element={<CreateAssignment />} />
                  <Route path="/super-admin/assignments" element={<AssignmentManagement />} />
                  <Route path="/super-admin/assignments/edit/:id" element={<CreateAssignment />} />
                  <Route path="/admin/assignments/edit/:id" element={<CreateAssignment />} />
                </Route>
              </Routes>
            </AssignmentProvider>
          </SystemProvider>
        </AuthProvider>
      </HashRouter>
    </div>
  );
};

export default App;