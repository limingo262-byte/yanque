import { Button, Layout, Menu, Space, Typography } from 'antd';
import { Link, Navigate, Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import PermissionsPage from './pages/PermissionsPage';
import SysConfigsPage from './pages/SysConfigsPage';
import CampusesPage from './pages/CampusesPage';
import CoursesPage from './pages/CoursesPage';
import ClassesPage from './pages/ClassesPage';
import ClassSchedulesPage from './pages/ClassSchedulesPage';
import TeacherSchedulesPage from './pages/TeacherSchedulesPage';
import ClassDutiesPage from './pages/ClassDutiesPage';
import HomeworksPage from './pages/HomeworksPage';
import StudentsPage from './pages/StudentsPage';
import StudentFollowupRecordsPage from './pages/StudentFollowupRecordsPage';
import StudentFollowupTagsPage from './pages/StudentFollowupTagsPage';
import StudentSopsPage from './pages/StudentSopsPage';
import StudentLearningPlansPage from './pages/StudentLearningPlansPage';
import ProductsPage from './pages/ProductsPage';
import PrepayOrdersPage from './pages/PrepayOrdersPage';
import OrdersPage from './pages/OrdersPage';
import RefundOrdersPage from './pages/RefundOrdersPage';
import ExamQuestionsPage from './pages/ExamQuestionsPage';
import ExamPapersPage from './pages/ExamPapersPage';
import ExamsPage from './pages/ExamsPage';
import ExamSubmissionsPage from './pages/ExamSubmissionsPage';
import KnowledgeBasesPage from './pages/KnowledgeBasesPage';
import KnowledgeDocumentChunksPage from './pages/KnowledgeDocumentChunksPage';
import KnowledgeDocumentsPage from './pages/KnowledgeDocumentsPage';
import KnowledgeQaPage from './pages/KnowledgeQaPage';
import KnowledgeRecallPage from './pages/KnowledgeRecallPage';
import PromptTemplateVersionEditorPage from './pages/PromptTemplateVersionEditorPage';
import PromptTemplateVersionsPage from './pages/PromptTemplateVersionsPage';
import PromptTemplatesPage from './pages/PromptTemplatesPage';
import PromptTestPage from './pages/PromptTestPage';
import TextToSqlAnalysisPage from './pages/TextToSqlAnalysisPage';
import TextToSqlEvalQuestionsPage from './pages/TextToSqlEvalQuestionsPage';
import TextToSqlEvalTasksPage from './pages/TextToSqlEvalTasksPage';
import TextToSqlPermissionsPage from './pages/TextToSqlPermissionsPage';
import TextToSqlRunsPage from './pages/TextToSqlRunsPage';
import LoginPage from './pages/LoginPage';
import { authApi } from './api/system';

const { Header, Sider, Content } = Layout;

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedKey = location.pathname.split('/')[1] || 'users';
  const user = JSON.parse(localStorage.getItem('yanque_user') || '{}') as { nickname?: string; username?: string };
  const pageTitleMap: Record<string, string> = {
    users: '用户管理',
    roles: '角色管理',
    permissions: '权限管理',
    configs: '参数配置',
    campuses: '校区管理',
    courses: '课程管理',
    classes: '班级管理',
    students: '学生列表',
    studentFollowupTags: '回访标签管理',
    studentFollowupRecords: '回访管理',
    studentSops: 'SOP管理',
    studentLearningPlans: '线上学习计划',
    schedules: '课表管理',
    teacherSchedules: '老师课表',
    duties: '值班管理',
    homeworks: '作业管理',
    products: '产品管理',
    prepayOrders: '预支付订单管理',
    orders: '订单管理',
    refundOrders: '退款订单管理',
    examQuestions: '题库管理',
    examPapers: '试卷管理',
    exams: '考试列表',
    promptTemplates: '提示词模板',
    promptTest: '提示词测试',
    knowledgeBases: '知识库列表',
    knowledgeRecall: '召回测试',
    knowledgeQa: '知识问答',
    textToSqlAnalysis: '数据分析',
    textToSqlRuns: 'Text-to-SQL运行记录',
    textToSqlEvalQuestions: 'Text-to-SQL评测样本',
    textToSqlEvalTasks: 'Text-to-SQL评测任务',
    textToSqlPermissions: 'Text-to-SQL权限',
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('yanque_token');
      localStorage.removeItem('yanque_sign_secret');
      localStorage.removeItem('yanque_user');
      localStorage.removeItem('yanque_roles');
      localStorage.removeItem('yanque_permissions');
      navigate('/login', { replace: true });
    }
  };

  return (
    <Layout className="app-shell">
      <Sider width={220}>
        <div className="app-logo">
          <span className="app-logo-mark">YQ</span>
          <span>YanQue Admin</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['system', 'teaching', 'studentManagement', 'order', 'exam', 'ai', 'textToSql']}
          items={[
            {
              key: 'teaching',
              label: '教学管理',
              children: [
                { key: 'campuses', label: <Link to="/campuses">校区管理</Link> },
                { key: 'courses', label: <Link to="/courses">课程管理</Link> },
                { key: 'classes', label: <Link to="/classes">班级管理</Link> },
                { key: 'homeworks', label: <Link to="/homeworks">作业管理</Link> },
                { key: 'schedules', label: <Link to="/schedules">课表管理</Link> },
                { key: 'teacherSchedules', label: <Link to="/teacherSchedules">老师课表</Link> },
                { key: 'duties', label: <Link to="/duties">值班管理</Link> },
              ],
            },
            {
              key: 'studentManagement',
              label: '学生管理',
              children: [
                { key: 'students', label: <Link to="/students">学生列表</Link> },
                { key: 'studentFollowupTags', label: <Link to="/studentFollowupTags">回访标签管理</Link> },
                { key: 'studentFollowupRecords', label: <Link to="/studentFollowupRecords">回访管理</Link> },
                { key: 'studentSops', label: <Link to="/studentSops">SOP管理</Link> },
                { key: 'studentLearningPlans', label: <Link to="/studentLearningPlans">线上学习计划</Link> },
              ],
            },
            {
              key: 'order',
              label: '订单管理',
              children: [
                { key: 'products', label: <Link to="/products">产品管理</Link> },
                { key: 'prepayOrders', label: <Link to="/prepayOrders">预支付订单管理</Link> },
                { key: 'orders', label: <Link to="/orders">订单管理</Link> },
                { key: 'refundOrders', label: <Link to="/refundOrders">退款订单管理</Link> },
              ],
            },
            {
              key: 'exam',
              label: '考试管理',
              children: [
                { key: 'examQuestions', label: <Link to="/examQuestions">题库管理</Link> },
                { key: 'examPapers', label: <Link to="/examPapers">试卷管理</Link> },
                { key: 'exams', label: <Link to="/exams">考试列表</Link> },
              ],
            },
            {
              key: 'ai',
              label: 'AI管理',
              children: [
                { key: 'promptTemplates', label: <Link to="/promptTemplates">提示词模板</Link> },
                { key: 'promptTest', label: <Link to="/promptTest">提示词测试</Link> },
                { key: 'knowledgeBases', label: <Link to="/knowledgeBases">知识库列表</Link> },
                { key: 'knowledgeRecall', label: <Link to="/knowledgeRecall">召回测试</Link> },
                { key: 'knowledgeQa', label: <Link to="/knowledgeQa">知识问答</Link> },
                {
                  key: 'textToSql',
                  label: 'Text-to-SQL',
                  children: [
                    { key: 'textToSqlAnalysis', label: <Link to="/textToSqlAnalysis">数据分析</Link> },
                    { key: 'textToSqlRuns', label: <Link to="/textToSqlRuns">运行记录</Link> },
                    { key: 'textToSqlEvalQuestions', label: <Link to="/textToSqlEvalQuestions">评测样本</Link> },
                    { key: 'textToSqlEvalTasks', label: <Link to="/textToSqlEvalTasks">评测任务</Link> },
                    { key: 'textToSqlPermissions', label: <Link to="/textToSqlPermissions">权限配置</Link> },
                  ],
                },
              ],
            },
            {
              key: 'system',
              label: '系统配置',
              children: [
                { key: 'users', label: <Link to="/users">用户管理</Link> },
                { key: 'roles', label: <Link to="/roles">角色管理</Link> },
                { key: 'permissions', label: <Link to="/permissions">权限管理</Link> },
                { key: 'configs', label: <Link to="/configs">参数配置</Link> },
              ],
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="app-header-title">
            <div className="app-title">{pageTitleMap[selectedKey] || '后台管理'}</div>
            <div className="app-subtitle">后台管理</div>
          </div>
          <Space>
            <Typography.Text className="app-user">{user.nickname || user.username || '管理员'}</Typography.Text>
            <Button onClick={logout}>退出登录</Button>
          </Space>
        </Header>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/users" replace />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/permissions" element={<PermissionsPage />} />
            <Route path="/configs" element={<SysConfigsPage />} />
            <Route path="/campuses" element={<CampusesPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/homeworks" element={<HomeworksPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/studentFollowupTags" element={<StudentFollowupTagsPage />} />
            <Route path="/studentFollowupRecords" element={<StudentFollowupRecordsPage />} />
            <Route path="/studentSops" element={<StudentSopsPage />} />
            <Route path="/studentLearningPlans" element={<StudentLearningPlansPage />} />
            <Route path="/schedules" element={<ClassSchedulesPage />} />
            <Route path="/teacherSchedules" element={<TeacherSchedulesPage />} />
            <Route path="/duties" element={<ClassDutiesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/prepayOrders" element={<PrepayOrdersPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/refundOrders" element={<RefundOrdersPage />} />
            <Route path="/examQuestions" element={<ExamQuestionsPage />} />
            <Route path="/examPapers" element={<ExamPapersPage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/exams/:examId/submissions" element={<ExamSubmissionsPage />} />
            <Route path="/promptTemplates" element={<PromptTemplatesPage />} />
            <Route path="/promptTemplates/:templateId/versions" element={<PromptTemplateVersionsPage />} />
            <Route path="/promptTemplates/:templateId/versions/new" element={<PromptTemplateVersionEditorPage />} />
            <Route path="/promptTemplates/:templateId/versions/:versionId/copy" element={<PromptTemplateVersionEditorPage />} />
            <Route path="/promptTest" element={<PromptTestPage />} />
            <Route path="/knowledgeBases" element={<KnowledgeBasesPage />} />
            <Route path="/knowledgeRecall" element={<KnowledgeRecallPage />} />
            <Route path="/knowledgeQa" element={<KnowledgeQaPage />} />
            <Route path="/textToSqlAnalysis" element={<TextToSqlAnalysisPage />} />
            <Route path="/textToSqlRuns" element={<TextToSqlRunsPage />} />
            <Route path="/textToSqlEvalQuestions" element={<TextToSqlEvalQuestionsPage />} />
            <Route path="/textToSqlEvalTasks" element={<TextToSqlEvalTasksPage />} />
            <Route path="/textToSqlPermissions" element={<TextToSqlPermissionsPage />} />
            <Route path="/knowledgeBases/:knowledgeBaseId/recall" element={<KnowledgeRecallPage />} />
            <Route path="/knowledgeBases/:knowledgeBaseId/qa" element={<KnowledgeQaPage />} />
            <Route path="/knowledgeBases/:knowledgeBaseId/documents" element={<KnowledgeDocumentsPage />} />
            <Route
              path="/knowledgeBases/:knowledgeBaseId/documents/:documentId/chunks"
              element={<KnowledgeDocumentChunksPage />}
            />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('yanque_token');
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
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Shell />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}
