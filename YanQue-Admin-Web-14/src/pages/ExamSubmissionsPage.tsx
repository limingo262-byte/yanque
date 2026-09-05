import { Button, Descriptions, Empty, Form, InputNumber, Modal, Space, Table, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examApi } from '../api/system';
import type { ExamItem, ExamSubmissionDetailItem, ExamSubmissionItem, ExamSubmissionQuestionItem } from '../types/system';

const questionTypeText: Record<string, string> = {
  SINGLE: '单选题',
  MULTIPLE: '多选题',
  JUDGE: '判断题',
  FILL: '填空题',
  SHORT: '简答题',
  PROGRAMMING: '编程题',
};

const statusColor: Record<string, string> = {
  NOT_STARTED: 'default',
  IN_PROGRESS: 'blue',
  SUBMITTED: 'green',
  TIMEOUT: 'red',
};

const gradingText: Record<string, string> = {
  PENDING: '待批改',
  GRADING: '批改中',
  COMPLETED: '已批改',
};

const objectiveTypes = ['SINGLE', 'MULTIPLE', 'JUDGE'];

const formatDateTime = (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-');

const formatScore = (value?: number) => (value === undefined || value === null ? '-' : `${value} 分`);

const formatAnswer = (question: ExamSubmissionQuestionItem) => {
  if (!question.answerContent) {
    return '未作答';
  }
  if (question.questionType === 'PROGRAMMING') {
    return <pre className="submission-code-block">{question.answerContent}</pre>;
  }
  return question.answerContent;
};

export default function ExamSubmissionsPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const numericExamId = Number(examId);
  const [exam, setExam] = useState<ExamItem>();
  const [rows, setRows] = useState<ExamSubmissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<ExamSubmissionDetailItem>();
  const [scoreMap, setScoreMap] = useState<Record<number, number | null>>({});
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState({ pageNum: 1, pageSize: 10, total: 0 });

  const manualQuestions = useMemo(
    () => detail?.questions.filter((item) => item.answerId && !objectiveTypes.includes(item.questionType || '')) || [],
    [detail],
  );

  const loadExam = async () => {
    if (!numericExamId) {
      message.error('考试不存在');
      navigate('/exams', { replace: true });
      return;
    }
    setExam(await examApi.detail(numericExamId));
  };

  const loadRows = async (pageNum = page.pageNum, pageSize = page.pageSize) => {
    setLoading(true);
    try {
      const data = await examApi.submissions(numericExamId, { pageNum, pageSize });
      setRows(data.records);
      setPage({ pageNum: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (recordId?: number) => {
    if (!recordId) {
      return;
    }
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await examApi.submissionDetail(recordId);
      setDetail(data);
      setScoreMap(Object.fromEntries(
        data.questions
          .filter((item) => item.answerId && !objectiveTypes.includes(item.questionType || ''))
          .map((item) => [item.answerId as number, item.score ?? null]),
      ));
    } finally {
      setDetailLoading(false);
    }
  };

  const saveGrade = async () => {
    if (!detail) {
      return;
    }
    const answers = manualQuestions.map((item) => ({
      answerId: item.answerId as number,
      score: scoreMap[item.answerId as number],
    }));
    const empty = answers.find((item) => item.score === undefined || item.score === null);
    if (empty) {
      message.warning('请填写所有主观题/编程题分数');
      return;
    }
    setSaving(true);
    try {
      await examApi.gradeSubmission(detail.recordId, {
        answers: answers.map((item) => ({ answerId: item.answerId, score: Number(item.score) })),
      });
      message.success('批改保存成功');
      await openDetail(detail.recordId);
      await loadRows(page.pageNum, page.pageSize);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void loadExam();
    void loadRows(1, 10);
  }, [numericExamId]);

  const columns: TableColumnsType<ExamSubmissionItem> = [
    { title: '学生', dataIndex: 'studentName', width: 120, render: (value?: string) => value || '-' },
    { title: '手机号', dataIndex: 'studentPhone', width: 140, render: (value?: string) => value || '-' },
    {
      title: '提交状态',
      dataIndex: 'recordStatus',
      width: 120,
      render: (value: string, record) => <Tag color={statusColor[value] || 'default'}>{record.recordStatusText || value}</Tag>,
    },
    {
      title: '批改状态',
      dataIndex: 'gradingStatus',
      width: 120,
      render: (value: string | undefined, record) => (
        record.recordStatus === 'SUBMITTED' ? <Tag color={value === 'COMPLETED' ? 'green' : 'orange'}>{gradingText[value || 'PENDING']}</Tag> : '-'
      ),
    },
    { title: '得分', dataIndex: 'score', width: 100, render: formatScore },
    { title: '开始时间', dataIndex: 'startTime', width: 170, render: formatDateTime },
    { title: '提交时间', dataIndex: 'submitTime', width: 170, render: formatDateTime },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Button type="link" disabled={record.recordStatus !== 'SUBMITTED'} onClick={() => openDetail(record.recordId)}>
          查看/批改
        </Button>
      ),
    },
  ];

  return (
    <div className="page-panel exam-submission-page">
      <div className="table-toolbar">
        <div>
          <Typography.Title level={4}>{exam?.paperName || '考试提交记录'}</Typography.Title>
          <Typography.Text type="secondary">
            {exam?.classPeriod || '-'} / {formatDateTime(exam?.startTime)} 至 {formatDateTime(exam?.endTime)}
          </Typography.Text>
        </div>
        <Button onClick={() => navigate('/exams')}>返回考试列表</Button>
      </div>

      <Table
        rowKey={(record) => `${record.studentId}-${record.recordId || 'empty'}`}
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{
          current: page.pageNum,
          pageSize: page.pageSize,
          total: page.total,
          onChange: loadRows,
        }}
      />

      <Modal
        title="答卷详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>,
          <Button key="save" type="primary" loading={saving} disabled={manualQuestions.length === 0} onClick={saveGrade}>
            保存批改
          </Button>,
        ]}
        width={1040}
        destroyOnHidden
      >
        {detailLoading || !detail ? (
          <Empty description="加载中" />
        ) : (
          <div className="exam-submission-detail">
            <Descriptions size="small" column={3} bordered>
              <Descriptions.Item label="学生">{detail.studentName || '-'}</Descriptions.Item>
              <Descriptions.Item label="手机号">{detail.studentPhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="班级">{detail.classPeriod || '-'}</Descriptions.Item>
              <Descriptions.Item label="试卷">{detail.paperName}</Descriptions.Item>
              <Descriptions.Item label="阶段">{detail.stageName || '整门课程'}</Descriptions.Item>
              <Descriptions.Item label="总分">{detail.totalScore} 分</Descriptions.Item>
              <Descriptions.Item label="提交时间">{formatDateTime(detail.submitTime)}</Descriptions.Item>
              <Descriptions.Item label="当前得分">{formatScore(detail.score)}</Descriptions.Item>
              <Descriptions.Item label="批改状态">
                <Tag color={detail.gradingStatus === 'COMPLETED' ? 'green' : 'orange'}>{gradingText[detail.gradingStatus || 'PENDING']}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <div className="exam-submission-question-list">
              {detail.questions.map((question, index) => {
                const isObjective = objectiveTypes.includes(question.questionType || '');
                return (
                  <section className="exam-submission-question" key={`${question.questionId}-${question.answerId || index}`}>
                    <div className="exam-submission-question-head">
                      <Space wrap>
                        <Tag color="blue">{index + 1}</Tag>
                        <Tag>{questionTypeText[question.questionType || ''] || question.questionType}</Tag>
                        <Tag color="gold">{question.questionScore} 分</Tag>
                        {isObjective && question.correct !== undefined && question.correct !== null && (
                          <Tag color={question.correct ? 'green' : 'red'}>{question.correct ? '正确' : '错误'}</Tag>
                        )}
                      </Space>
                      {isObjective ? (
                        <Typography.Text strong>{formatScore(question.score)}</Typography.Text>
                      ) : (
                        <InputNumber
                          min={0}
                          max={question.questionScore}
                          precision={2}
                          addonAfter="分"
                          value={question.answerId ? scoreMap[question.answerId] : null}
                          onChange={(value) => question.answerId && setScoreMap((prev) => ({ ...prev, [question.answerId as number]: value }))}
                        />
                      )}
                    </div>
                    <Typography.Title level={5}>{question.questionContent}</Typography.Title>
                    {question.options.length > 0 && (
                      <div className="exam-submission-options">
                        {question.options.map((option) => (
                          <div key={option.id}>{option.optionKey}. {option.optionContent}</div>
                        ))}
                      </div>
                    )}
                    <div className="exam-submission-answer">
                      <Typography.Text type="secondary">学生答案</Typography.Text>
                      <div>{formatAnswer(question)}</div>
                    </div>
                    <div className="exam-submission-answer">
                      <Typography.Text type="secondary">参考答案</Typography.Text>
                      <div>{question.correctAnswer || '-'}</div>
                    </div>
                    {question.analysisContent && (
                      <div className="exam-submission-answer">
                        <Typography.Text type="secondary">解析</Typography.Text>
                        <div>{question.analysisContent}</div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
