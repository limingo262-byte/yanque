import { Button, Empty, Space, Tag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentApi } from '../api/student';
import type { StudentExamSubmission, StudentExamSubmissionQuestion } from '../types/student';

const questionTypeText: Record<string, string> = {
  SINGLE: '单选题',
  MULTIPLE: '多选题',
  JUDGE: '判断题',
  FILL: '填空题',
  SHORT: '简答题',
  PROGRAMMING: '编程题',
};

const gradingText: Record<string, string> = {
  PENDING: '待批改',
  GRADING: '批改中',
  COMPLETED: '已批改',
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace('T', ' ');
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatAnswer = (question: StudentExamSubmissionQuestion) => {
  if (!question.answerContent) {
    return '未作答';
  }
  if (question.questionType === 'PROGRAMMING') {
    return <pre className="submission-code-block">{question.answerContent}</pre>;
  }
  return question.answerContent;
};

export default function StudentExamSubmissionPage() {
  const navigate = useNavigate();
  const { recordId } = useParams();
  const [submission, setSubmission] = useState<StudentExamSubmission>();
  const [loading, setLoading] = useState(false);
  const numericRecordId = Number(recordId);

  const resultVisible = Boolean(submission?.answerVisible);
  const objectiveCount = useMemo(() => submission?.questions.filter((item) => item.correct !== undefined && item.correct !== null).length ?? 0, [submission]);

  const load = async () => {
    if (!numericRecordId) {
      message.error('考试记录不存在');
      navigate('/exams', { replace: true });
      return;
    }
    setLoading(true);
    try {
      setSubmission(await studentApi.examSubmission(numericRecordId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [numericRecordId]);

  return (
    <main className="student-exam-taking-page">
      <header className="exam-taking-header">
        <div>
          <Typography.Text className="home-kicker">答卷记录</Typography.Text>
          <Typography.Title level={2}>{submission?.paperName || '考试答卷'}</Typography.Title>
          <Typography.Paragraph>
            {submission?.classPeriod || '-'} / {submission?.stageName || '整门课程'} / 提交时间 {formatDateTime(submission?.submitTime)}
          </Typography.Paragraph>
        </div>
        <Space size={12} wrap>
          <Tag color={resultVisible ? (submission?.gradingStatus === 'COMPLETED' ? 'green' : 'orange') : 'default'}>
            {resultVisible ? gradingText[submission?.gradingStatus || 'PENDING'] : '成绩未公布'}
          </Tag>
          <Button onClick={() => navigate('/exams')}>返回列表</Button>
        </Space>
      </header>

      <div className="exam-taking-layout">
        <aside className="exam-answer-sheet">
          <div className="answer-sheet-score">
            <div>
              <span>总分</span>
              <strong>{submission?.totalScore ?? '-'}</strong>
            </div>
            <div>
              <span>当前得分</span>
              <strong>{resultVisible ? submission?.score ?? 0 : '未公布'}</strong>
            </div>
          </div>
          <div className="answer-sheet-meta">
            <span>{resultVisible ? '客观题判定' : '判定结果'}</span>
            <strong>{resultVisible ? `${objectiveCount} 题` : '未公布'}</strong>
          </div>
          <div className="answer-sheet-section">
            <span>答题卡</span>
            <div className="answer-sheet-grid">
              {submission?.questions.map((question, index) => (
                <a
                  key={question.id}
                  className={question.answerContent ? 'is-answered' : ''}
                  href={`#question-${question.id}`}
                >
                  {index + 1}
                </a>
              ))}
            </div>
          </div>
        </aside>

        <section className="exam-question-panel">
          {!loading && submission?.questions.length === 0 ? (
            <Empty description="暂无提交记录" />
          ) : (
            submission?.questions.map((question, index) => (
              <article className="exam-taking-question" id={`question-${question.id}`} key={question.id}>
                <div className="exam-question-title">
                  <span>{index + 1}</span>
                  <div>
                    <Space size={8} wrap>
                      <Tag color="blue">{questionTypeText[question.questionType] || question.questionType}</Tag>
                      <Tag color="gold">{question.questionScore} 分</Tag>
                      {resultVisible && question.correct !== undefined && question.correct !== null && (
                        <Tag color={question.correct ? 'green' : 'red'}>{question.correct ? '正确' : '错误'}</Tag>
                      )}
                      {resultVisible && question.score !== undefined && question.score !== null && <Tag>{question.score} 分</Tag>}
                    </Space>
                    <Typography.Title level={4}>{question.questionContent}</Typography.Title>
                  </div>
                </div>
                <div className="submission-answer-block">
                  <span>我的答案</span>
                  <div>{formatAnswer(question)}</div>
                </div>
                {resultVisible && (
                  <div className="submission-answer-block">
                    <span>参考答案</span>
                    <div>{question.correctAnswer || '-'}</div>
                  </div>
                )}
                {resultVisible && question.analysisContent && (
                  <div className="submission-answer-block">
                    <span>答案解析</span>
                    <div>{question.analysisContent}</div>
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
