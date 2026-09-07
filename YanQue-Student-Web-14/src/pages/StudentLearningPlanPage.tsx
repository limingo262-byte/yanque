import { Button, Empty, Modal, Select, Space, Spin, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../api/student';
import type { StudentInfo, StudentLearningCalendarItem, StudentLearningPlanCurrent } from '../types/student';

const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];

const pad = (value: number) => String(value).padStart(2, '0');

const toDate = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const normalized = value.includes('T') ? value : value.replace(/-/g, '/');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const valueToDateKey = (value?: string) => {
  const date = toDate(value);
  return date ? toDateKey(date) : '';
};

const formatDate = (value?: string) => {
  const date = toDate(value);
  if (!date) {
    return '-';
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const buildMonthCells = (year: number, month: number) => {
  const first = new Date(year, month - 1, 1);
  const firstWeekday = first.getDay() === 0 ? 7 : first.getDay();
  const start = new Date(year, month - 1, 1 - firstWeekday + 1);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      key: toDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
    };
  });
};

export default function StudentLearningPlanPage() {
  const navigate = useNavigate();
  const student = JSON.parse(localStorage.getItem('yanque_student_info') || '{}') as StudentInfo;
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudentLearningPlanCurrent>();
  const [calendarRows, setCalendarRows] = useState<StudentLearningCalendarItem[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1);

  const load = async () => {
    setLoading(true);
    try {
      const current = await studentApi.learningPlanCurrent();
      setPlan(current);
      if (!current.hasPlan) {
        setCalendarRows([]);
        return;
      }
      const rows = await studentApi.learningPlanCalendar();
      setCalendarRows(rows);
      const startDate = toDate(current.startDate);
      if (startDate) {
        setCalendarYear(startDate.getFullYear());
        setCalendarMonth(startDate.getMonth() + 1);
      }
    } catch {
      setPlan(undefined);
      setCalendarRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const calendarMap = useMemo(() => {
    return calendarRows.reduce<Record<string, StudentLearningCalendarItem>>((map, item) => {
      map[valueToDateKey(item.studyDate)] = item;
      return map;
    }, {});
  }, [calendarRows]);

  const monthCells = useMemo(() => buildMonthCells(calendarYear, calendarMonth), [calendarYear, calendarMonth]);
  const yearOptions = useMemo(() => {
    const base = toDate(plan?.startDate)?.getFullYear() || today.getFullYear();
    return Array.from({ length: 5 }, (_, index) => base - 1 + index).map((year) => ({ label: `${year}年`, value: year }));
  }, [plan?.startDate]);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, index) => ({ label: `${index + 1}月`, value: index + 1 })), []);

  const progressPercent = plan?.totalDays && plan.currentDayIndex
    ? Math.min(100, Math.round((plan.currentDayIndex / plan.totalDays) * 100))
    : 0;

  return (
    <main className="student-plan-page">
      <header className="student-plan-topbar">
        <div>
          <Typography.Text className="home-kicker">学习计划</Typography.Text>
          <Typography.Title level={2}>{student.name || '同学'}，这是你的线上学习安排</Typography.Title>
          <Typography.Paragraph>计划由导师完成 SOP 后生成，每天连续学习，不跳过周六日。</Typography.Paragraph>
        </div>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </header>

      <Spin spinning={loading}>
        {!plan?.hasPlan ? (
          <section className="student-plan-empty">
            <Empty description="暂未生成学习计划" />
            <Typography.Text type="secondary">完成入学 SOP 后，导师会为你定制线上学习计划。</Typography.Text>
          </section>
        ) : (
          <section className="student-plan-panel">
            <div className="student-plan-hero">
              <div>
                <Tag color="blue">进行中</Tag>
                <Typography.Title level={2}>{plan.courseName || '线上课程'}</Typography.Title>
                <Typography.Paragraph>从 {formatDate(plan.startDate)} 开始，到 {formatDate(plan.endDate)} 结束。</Typography.Paragraph>
              </div>
              <Button type="primary" size="large" onClick={() => setCalendarOpen(true)}>查看日历</Button>
            </div>

            <div className="student-plan-metrics">
              <div>
                <span>总学习天数</span>
                <strong>{plan.totalDays || 0}天</strong>
              </div>
              <div>
                <span>当前进度</span>
                <strong>{plan.currentDayIndex ? `第${plan.currentDayIndex}天` : '未开始'}</strong>
              </div>
              <div>
                <span>今日阶段</span>
                <strong>{plan.todayStageName || '-'}</strong>
              </div>
              <div>
                <span>完成比例</span>
                <strong>{progressPercent}%</strong>
              </div>
            </div>
          </section>
        )}
      </Spin>

      <Modal
        title="学习日历"
        open={calendarOpen}
        footer={null}
        width={860}
        centered
        onCancel={() => setCalendarOpen(false)}
      >
        <div className="student-calendar-toolbar">
          <Space>
            <Select value={calendarYear} options={yearOptions} onChange={setCalendarYear} />
            <Select value={calendarMonth} options={monthOptions} onChange={setCalendarMonth} />
          </Space>
        </div>
        <div className="student-calendar-week">
          {weekLabels.map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className="student-calendar-grid">
          {monthCells.map((cell) => {
            const item = calendarMap[cell.key];
            const isToday = cell.key === toDateKey(today);
            return (
              <div
                key={cell.key}
                className={[
                  'student-calendar-cell',
                  cell.inMonth ? '' : 'is-outside',
                  isToday ? 'is-today' : '',
                  item ? 'has-plan' : '',
                ].filter(Boolean).join(' ')}
              >
                <div className="student-calendar-date">{cell.day}</div>
                {item && (
                  <div className="student-calendar-content">
                    <Tag color="blue">学习</Tag>
                    <strong>{item.stageName}</strong>
                    <span>第{item.dayIndex}天</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </main>
  );
}
