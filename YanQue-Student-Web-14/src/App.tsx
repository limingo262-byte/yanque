import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProductPayPage from './pages/ProductPayPage';
import PaymentReturnPage from './pages/PaymentReturnPage';
import StudentHomePage from './pages/StudentHomePage';
import StudentHomeworksPage from './pages/StudentHomeworksPage';
import StudentExamsPage from './pages/StudentExamsPage';
import StudentExamTakingPage from './pages/StudentExamTakingPage';
import StudentExamSubmissionPage from './pages/StudentExamSubmissionPage';
import StudentLearningPlanPage from './pages/StudentLearningPlanPage';
import StudentAiChatPage from './pages/StudentAiChatPage';

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('yanque_student_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pay" element={<ProductPayPage />} />
        <Route path="/payment-return" element={<PaymentReturnPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <StudentHomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/homeworks"
          element={
            <RequireAuth>
              <StudentHomeworksPage />
            </RequireAuth>
          }
        />
        <Route
          path="/learning-plan"
          element={
            <RequireAuth>
              <StudentLearningPlanPage />
            </RequireAuth>
          }
        />
        <Route
          path="/exams"
          element={
            <RequireAuth>
              <StudentExamsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/ai-chat"
          element={
            <RequireAuth>
              {/* AI 问答页：必须登录后才能进入，后端会根据 token 识别学生。 */}
              <StudentAiChatPage />
            </RequireAuth>
          }
        />
        <Route
          path="/exams/:recordId"
          element={
            <RequireAuth>
              <StudentExamTakingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/exams/:recordId/submission"
          element={
            <RequireAuth>
              <StudentExamSubmissionPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
