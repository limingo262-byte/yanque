import { Button, Checkbox, Empty, Input, Modal, Radio, Space, Tag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentApi } from '../api/student';
import type { StudentExamPaper, StudentExamPaperQuestion } from '../types/student';

const questionTypeText: Record<string, string> = {
  SINGLE: '单选题',
  MULTIPLE: '多选题',
  JUDGE: '判断题',
  FILL: '填空题',
  SHORT: '简答题',
  PROGRAMMING: '编程题',
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace('T', ' ').replace(/\.\d{3}\+\d{2}:\d{2}$/, '');
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getRemainingText = (deadline?: string) => {
  if (!deadline) {
    return '--:--';
  }
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) {
    return '已超时';
  }
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

type AnswerValue = string | string[];

const renderAnswerControl = (
  question: StudentExamPaperQuestion,
  value: AnswerValue | undefined,
  onChange: (value: AnswerValue) => void,
) => {
  if (question.questionType === 'SINGLE' || question.questionType === 'JUDGE') {
    return (
      <Radio.Group className="exam-option-list" value={value} onChange={(event) => onChange(event.target.value)}>
        {question.options.map((option) => (
          <Radio key={option.id} value={option.optionKey}>
            <strong>{option.optionKey}.</strong> {option.optionContent}
          </Radio>
        ))}
      </Radio.Group>
    );
  }
  if (question.questionType === 'MULTIPLE') {
    return (
      <Checkbox.Group className="exam-option-list" value={Array.isArray(value) ? value : []} onChange={(checkedValue) => onChange(checkedValue.map(String))}>
        {question.options.map((option) => (
          <Checkbox key={option.id} value={option.optionKey}>
            <strong>{option.optionKey}.</strong> {option.optionContent}
          </Checkbox>
        ))}
      </Checkbox.Group>
    );
  }
  if (question.questionType === 'PROGRAMMING') {
    const codeValue = typeof value === 'string' ? value : '';
    const lineCount = Math.max(8, codeValue.split('\n').length);
    return (
      <div className="exam-code-editor">
        <div className="exam-code-toolbar">
          <span>Java</span>
          <span>{lineCount} 行</span>
        </div>
        <div className="exam-code-body">
          <div className="exam-code-lines">
            {Array.from({ length: lineCount }, (_, index) => (
              <span key={index}>{index + 1}</span>
            ))}
          </div>
          <Input.TextArea
            className="exam-code-input"
            rows={Math.min(Math.max(lineCount, 10), 24)}
            value={codeValue}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            placeholder="// 请在这里编写 Java 代码"
          />
        </div>
      </div>
    );
  }
  return <Input.TextArea rows={5} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} placeholder="请输入答案" />;
};

export default function StudentExamTakingPage() {
  const navigate = useNavigate();
  const { recordId } = useParams();
  const [paper, setPaper] = useState<StudentExamPaper>();
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState('--:--');
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});

  const numericRecordId = Number(recordId);

  const questionSummary = useMemo(() => {
    const map = new Map<string, number>();
    paper?.questions.forEach((question) => {
      map.set(question.questionType, (map.get(question.questionType) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [paper]);

  const answeredCount = useMemo(() => Object.values(answers).filter((value) => (
    Array.isArray(value) ? value.length > 0 : value.trim().length > 0
  )).length, [answers]);

  const updateAnswer = (questionId: number, value: AnswerValue) => {
    setAnswers((old) => ({ ...old, [questionId]: value }));
  };

  const buildAnswerContent = (value: AnswerValue | undefined) => {
    if (Array.isArray(value)) {
      return value.join(',');
    }
    return value || '';
  };

  const submitPaper = () => {
    if (!paper) {
      return;
    }
    Modal.confirm({
      title: '确认交卷',
      content: `当前已答 ${answeredCount}/${paper.questions.length} 题，交卷后将不能继续修改。`,
      okText: '确认交卷',
      cancelText: '继续答题',
      okButtonProps: { danger: true },
      onOk: async () => {
        const result = await studentApi.examSubmit(paper.recordId, {
          answers: paper.questions.map((question) => ({
            questionId: question.questionId,
            answerContent: buildAnswerContent(answers[question.questionId]),
          })),
        });
        message.success(result.score === undefined || result.score === null ? '交卷成功，等待老师公布结果' : `交卷成功，当前得分：${result.score}`);
        navigate('/exams', { replace: true });
      },
    });
  };

  const load = async () => {
    if (!numericRecordId) {
      message.error('考试记录不存在');
      navigate('/exams', { replace: true });
      return;
    }
    setLoading(true);
    try {
      const data = await studentApi.examPaper(numericRecordId);
      setPaper(data);
      setRemaining(getRemainingText(data.deadlineTime));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [numericRecordId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(getRemainingText(paper?.deadlineTime));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paper?.deadlineTime]);

  return (
    <main className="student-exam-taking-page">
      <header className="exam-taking-header">
        <div>
          <Typography.Text className="home-kicker">正在考试</Typography.Text>
          <Typography.Title level={2}>{paper?.paperName || '考试试卷'}</Typography.Title>
          <Typography.Paragraph>
            {paper?.classPeriod || '-'} / {paper?.stageName || '整门课程'} / 共 {paper?.questions.length ?? 0} 题
          </Typography.Paragraph>
        </div>
        <Space size={14} wrap className="exam-header-actions">
          <div className={`exam-countdown ${remaining === '已超时' ? 'is-timeout' : ''}`}>
            <span>剩余时间</span>
            <strong>{remaining}</strong>
          </div>
          <Button type="primary" danger onClick={submitPaper}>交卷</Button>
          <Button onClick={() => navigate('/exams')}>返回列表</Button>
        </Space>
      </header>

      <div className="exam-taking-layout">
        <aside className="exam-answer-sheet">
          <div className="answer-sheet-score">
            <div>
              <span>总分</span>
              <strong>{paper?.totalScore ?? '-'}</strong>
            </div>
            <div>
              <span>已答</span>
              <strong>{answeredCount}/{paper?.questions.length ?? 0}</strong>
            </div>
          </div>
          <div className="answer-sheet-meta">
            <span>截止时间</span>
            <strong>{formatDateTime(paper?.deadlineTime)}</strong>
          </div>
          <div className="answer-sheet-section">
            <span>题型结构</span>
            <Space size={8} wrap>
              {questionSummary.length === 0 ? '-' : questionSummary.map(([type, count]) => (
                <Tag key={type}>{questionTypeText[type] || type} {count}</Tag>
              ))}
            </Space>
          </div>
          <div className="answer-sheet-section">
            <span>答题卡</span>
            <div className="answer-sheet-grid">
              {paper?.questions.map((question, index) => {
                const answer = answers[question.questionId];
                const isAnswered = Array.isArray(answer) ? answer.length > 0 : Boolean(answer?.trim());
                return (
                  <a
                    key={question.id}
                    className={isAnswered ? 'is-answered' : ''}
                    href={`#question-${question.id}`}
                  >
                    {index + 1}
                  </a>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="exam-question-panel">
          {!loading && paper?.questions.length === 0 ? (
            <Empty description="暂无题目" />
          ) : (
            paper?.questions.map((question, index) => (
              <article className="exam-taking-question" id={`question-${question.id}`} key={question.id}>
                <div className="exam-question-title">
                  <span>{index + 1}</span>
                  <div>
                    <Space size={8} wrap>
                      <Tag color="blue">{questionTypeText[question.questionType] || question.questionType}</Tag>
                      <Tag color="gold">{question.questionScore} 分</Tag>
                    </Space>
                    <Typography.Title level={4}>{question.questionContent}</Typography.Title>
                  </div>
                </div>
                <div className="exam-answer-control">
                  {renderAnswerControl(question, answers[question.questionId], (value) => updateAnswer(question.questionId, value))}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
