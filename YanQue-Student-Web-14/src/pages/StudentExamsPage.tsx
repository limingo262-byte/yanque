import { Button, Empty, Modal, Pagination, Space, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../api/student';
import type { StudentExamItem, StudentInfo } from '../types/student';

const statusColor: Record<StudentExamItem['examStatus'], string> = {
  NOT_STARTED: 'default',
  AVAILABLE: 'green',
  IN_PROGRESS: 'blue',
  SUBMITTED: 'purple',
  TIMEOUT: 'red',
  ENDED: 'default',
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').replace(/\.\d{3}\+\d{2}:\d{2}$/, '');
};

export default function StudentExamsPage() {
  const navigate = useNavigate();
  const student = JSON.parse(localStorage.getItem('yanque_student_info') || '{}') as StudentInfo;
  const [rows, setRows] = useState<StudentExamItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState<number>();
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const load = async (nextPage = pageNum, nextSize = pageSize) => {
    setLoading(true);
    try {
      const data = await studentApi.exams(nextPage, nextSize);
      setRows(data.records);
      setPageNum(data.pageNum);
      setPageSize(data.pageSize);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, 10);
  }, []);

  const startExam = (item: StudentExamItem) => {
    Modal.confirm({
      title: item.examStatus === 'IN_PROGRESS' ? '继续考试' : '开始考试',
      content: (
        <div className="exam-confirm-copy">
          <p>{item.paperName || '考试'}</p>
          <p>进入后将按 {item.durationMinutes} 分钟倒计时，到达个人截止时间后不可继续作答。</p>
        </div>
      ),
      okText: item.examStatus === 'IN_PROGRESS' ? '继续' : '开始',
      cancelText: '取消',
      onOk: async () => {
        setStartingId(item.id);
        try {
          const data = await studentApi.examStart(item.id);
          const targetRecordId = data.recordId || item.recordId;
          if (!targetRecordId) {
            message.error('考试记录创建失败，请刷新后重试');
            return;
          }
          message.success(item.examStatus === 'IN_PROGRESS' ? '继续考试' : '考试已开始');
          window.location.href = `/exams/${targetRecordId}`;
        } finally {
          setStartingId(undefined);
        }
      },
    });
  };

  return (
    <main className="student-homework-page student-exam-page">
      <header className="homework-topbar">
        <div>
          <Typography.Text className="home-kicker">我的考试</Typography.Text>
          <Typography.Title level={2}>{student.name || '同学'}，这里是你的考试安排</Typography.Title>
          <Typography.Paragraph>在可进入时间窗口内开始考试，进入后按答题时长倒计时。</Typography.Paragraph>
        </div>
        <Button className="homework-back-btn" onClick={() => navigate('/')}>返回首页</Button>
      </header>

      <section className="homework-list-panel">
        <div className="homework-list-summary exam-list-summary">
          <div>
            <span>当前考试</span>
            <strong>{total}</strong>
          </div>
          <div>
            <span>可进入</span>
            <strong>{rows.filter((item) => item.canStart).length}</strong>
          </div>
          <div>
            <span>已提交</span>
            <strong>{rows.filter((item) => item.examStatus === 'SUBMITTED').length}</strong>
          </div>
        </div>

        {rows.length === 0 && !loading ? (
          <Empty description="暂无考试" />
        ) : (
          <div className="student-homework-list">
            {rows.map((item) => (
              <article className="student-homework-card student-exam-card" key={item.id}>
                <div className="homework-card-main">
                  <div>
                    <div className="homework-card-eyebrow">{item.stageName || '整门课程'}</div>
                    <Typography.Title level={4}>{item.paperName || '未命名试卷'}</Typography.Title>
                    <Typography.Text type="secondary">班级：{item.classPeriod || '-'}</Typography.Text>
                  </div>
                  <Space wrap>
                    <Tag color={statusColor[item.examStatus]}>{item.examStatusText}</Tag>
                    <Tag color="blue">{item.totalScore ?? '-'} 分</Tag>
                  </Space>
                </div>

                <div className="homework-card-meta exam-card-meta">
                  <span>可进入：{formatDateTime(item.startTime)} 至 {formatDateTime(item.endTime)}</span>
                  <span>答题时长：{item.durationMinutes} 分钟</span>
                  <span>监考老师：{item.invigilatorName || '-'}</span>
                  {item.deadlineTime && <span>个人截止：{formatDateTime(item.deadlineTime)}</span>}
                  {item.recordStatus === 'SUBMITTED' && (
                    <span>
                      {item.score === undefined || item.score === null ? '成绩未公布' : `当前得分：${item.score}`}
                    </span>
                  )}
                </div>

                <div className="exam-card-footer">
                  <div>
                    {item.recordId ? (
                      <Typography.Text type="secondary">考试记录：{item.recordId}</Typography.Text>
                    ) : (
                      <Typography.Text type="secondary">尚未进入考试</Typography.Text>
                    )}
                  </div>
                  {item.recordStatus === 'SUBMITTED' && item.recordId ? (
                    <Button type="primary" onClick={() => navigate(`/exams/${item.recordId}/submission`)}>
                      查看答卷
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      disabled={!item.canStart}
                      loading={startingId === item.id}
                      onClick={() => startExam(item)}
                    >
                      {item.examStatus === 'IN_PROGRESS' ? '继续考试' : '开始考试'}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <Pagination
          current={pageNum}
          pageSize={pageSize}
          total={total}
          onChange={(nextPage, nextSize) => load(nextPage, nextSize)}
          hideOnSinglePage
        />
      </section>
    </main>
  );
}
