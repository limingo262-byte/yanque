import { Button, Progress, Space, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { StudentInfo } from '../types/student';

export default function StudentHomePage() {
  const navigate = useNavigate();
  const student = JSON.parse(localStorage.getItem('yanque_student_info') || '{}') as StudentInfo;

  const logout = () => {
    localStorage.removeItem('yanque_student_token');
    localStorage.removeItem('yanque_student_sign_secret');
    localStorage.removeItem('yanque_student_info');
    navigate('/login', { replace: true });
  };

  const displayName = student.name || student.phone || '同学';
  const today = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());

  return (
    <main className="student-home">
      <header className="home-topbar">
        <div className="home-topbar-left">
          <div className="brand-lockup home-brand">
            <span className="brand-mark">YQ</span>
            <span>YanQue Student</span>
          </div>
          <Button type="text" className="home-nav-link" onClick={() => { window.location.href = '/homeworks'; }}>
            <span className="home-nav-badge">作</span>
            <span>我的作业</span>
          </Button>
          <Button type="text" className="home-nav-link" onClick={() => { window.location.href = '/learning-plan'; }}>
            <span className="home-nav-badge is-plan">学</span>
            <span>学习计划</span>
          </Button>
          <Button type="text" className="home-nav-link" onClick={() => { window.location.href = '/exams'; }}>
            <span className="home-nav-badge is-exam">考</span>
            <span>我的考试</span>
          </Button>
          {/* AI 问答入口，跳到独立聊天页。 */}
          <Button type="text" className="home-nav-link" onClick={() => { window.location.href = '/ai-chat'; }}>
            <span className="home-nav-badge is-ai">AI</span>
            <span>AI 问答</span>
          </Button>
        </div>
        <Space size={12}>
          <Typography.Text type="secondary">{student.phone || '已登录'}</Typography.Text>
          <Button onClick={logout}>退出登录</Button>
        </Space>
      </header>

      <section className="home-hero">
        <div className="home-hero-copy">
          <Typography.Text className="home-kicker">{today}</Typography.Text>
          <Typography.Title level={1}>{displayName}，欢迎回来</Typography.Title>
          <Typography.Paragraph>你的报名资料已完成，后续课程安排、学习进度和通知都会集中展示在这里。</Typography.Paragraph>
          <Space size={12} wrap>
            <Button size="large">完善资料</Button>
          </Space>
        </div>
        <div className="home-hero-panel">
          <Typography.Text type="secondary">当前状态</Typography.Text>
          <div className="home-status">已注册</div>
          <Tag color="green">资料完整</Tag>
        </div>
      </section>

      <section className="home-metrics">
        <div className="metric-item">
          <Typography.Text type="secondary">已购课程</Typography.Text>
          <strong>1</strong>
        </div>
        <div className="metric-item">
          <Typography.Text type="secondary">学习进度</Typography.Text>
          <strong>0%</strong>
        </div>
        <div className="metric-item">
          <Typography.Text type="secondary">待办事项</Typography.Text>
          <strong>2</strong>
        </div>
        <div className="metric-item">
          <Typography.Text type="secondary">班主任通知</Typography.Text>
          <strong>0</strong>
        </div>
      </section>

      <div className="home-grid">
        <section className="home-section course-section">
          <div className="section-heading">
            <div>
              <Typography.Title level={4}>我的课程</Typography.Title>
              <Typography.Text type="secondary">课程开通后，会在这里同步学习内容和上课安排。</Typography.Text>
            </div>
            <Tag color="blue">进行中</Tag>
          </div>

          <div className="course-card">
            <div>
              <Typography.Title level={3}>JAVA + AI</Typography.Title>
              <Typography.Text type="secondary">基础资料已提交，等待教务老师分班。</Typography.Text>
            </div>
            <Progress percent={0} showInfo={false} strokeColor="#1677ff" />
            <div className="course-meta">
              <span>上课方式：待分配</span>
              <span>班级：待分班</span>
              <span>学习阶段：入学准备</span>
            </div>
          </div>
        </section>

        <aside className="home-section profile-card">
          <Typography.Title level={4}>个人资料</Typography.Title>
          <div className="profile-line">
            <span>姓名</span>
            <strong>{student.name || '-'}</strong>
          </div>
          <div className="profile-line">
            <span>手机号</span>
            <strong>{student.phone || '-'}</strong>
          </div>
          <div className="profile-line">
            <span>账号状态</span>
            <Tag color="green">正常</Tag>
          </div>
        </aside>

        <section className="home-section timeline-section">
          <Typography.Title level={4}>入学流程</Typography.Title>
          <div className="step-list">
            <div className="step-item done">
              <span />
              <div>
                <strong>完成支付</strong>
                <Typography.Text type="secondary">订单支付已提交并完成资料登记。</Typography.Text>
              </div>
            </div>
            <div className="step-item active">
              <span />
              <div>
                <strong>教务分班</strong>
                <Typography.Text type="secondary">老师确认后，会同步班级和上课安排。</Typography.Text>
              </div>
            </div>
            <div className="step-item">
              <span />
              <div>
                <strong>开始学习</strong>
                <Typography.Text type="secondary">进入课程后可查看课表、作业和学习记录。</Typography.Text>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section actions-section">
          <Typography.Title level={4}>快捷入口</Typography.Title>
          <div className="action-list">
            <Button block onClick={() => { window.location.href = '/learning-plan'; }}>学习计划</Button>
            <Button block onClick={() => { window.location.href = '/homeworks'; }}>我的作业</Button>
            <Button block type="primary" onClick={() => { window.location.href = '/exams'; }}>我的考试</Button>
            {/* 同一个 AI 问答入口也放在快捷入口里，方便学生从首页直接提问。 */}
            <Button block onClick={() => { window.location.href = '/ai-chat'; }}>AI 问答</Button>
            <Button block>课程资料</Button>
            <Button block>联系老师</Button>
          </div>
        </section>
      </div>
    </main>
  );
}
