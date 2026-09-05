import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { courseApi, examPaperApi, examQuestionApi } from '../api/system';
import type {
  CourseDetailItem,
  CourseItem,
  ExamPaperItem,
  ExamPaperPageParams,
  ExamQuestionDifficulty,
  ExamQuestionItem,
  ExamQuestionType,
} from '../types/system';

interface ExamPaperFormValues {
  paperName: string;
  courseId: number;
  stageName?: string;
  totalScore: number;
}

interface SelectedPaperQuestion {
  questionId: number;
  questionContent: string;
  questionType?: ExamQuestionType;
  difficulty?: ExamQuestionDifficulty;
  questionScore: number;
}

interface BatchPickValues {
  questionType: ExamQuestionType;
  difficulty: ExamQuestionDifficulty;
  count: number;
  questionScore: number;
}

const questionTypeOptions = [
  { label: '单选题', value: 'SINGLE' },
  { label: '多选题', value: 'MULTIPLE' },
  { label: '判断题', value: 'JUDGE' },
  { label: '填空题', value: 'FILL' },
  { label: '简答题', value: 'SHORT' },
  { label: '编程题', value: 'PROGRAMMING' },
];

const difficultyOptions = [
  { label: '简单', value: 'EASY' },
  { label: '普通', value: 'NORMAL' },
  { label: '困难', value: 'HARD' },
];

const defaultScoreMap: Record<ExamQuestionType, number> = {
  SINGLE: 2,
  MULTIPLE: 4,
  JUDGE: 1,
  FILL: 3,
  SHORT: 5,
  PROGRAMMING: 10,
};

const filterQuestionsByPaperScope = (questions: ExamQuestionItem[], paper: ExamPaperItem) => {
  if (!paper.stageName) {
    return questions;
  }
  const stageKey = `${paper.courseId}::${paper.stageName}`;
  return questions.filter((item) => item.courseStageKeys?.includes(stageKey));
};

const getPaperScopeText = (paper: ExamPaperItem) => `${paper.courseName || '课程'} / ${paper.stageName || '整门课程'}`;

export default function ExamPapersPage() {
  const [paperForm] = Form.useForm<ExamPaperFormValues>();
  const [paperFilterForm] = Form.useForm<Partial<ExamPaperPageParams>>();
  const [questionFilterForm] = Form.useForm<{
    questionType?: ExamQuestionType;
    difficulty?: ExamQuestionDifficulty;
    keyword?: string;
  }>();
  const [batchPickForm] = Form.useForm<BatchPickValues>();
  const selectedCourseId = Form.useWatch('courseId', paperForm);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [courseDetails, setCourseDetails] = useState<Record<number, CourseDetailItem[]>>({});
  const [papers, setPapers] = useState<ExamPaperItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [composingPaper, setComposingPaper] = useState<ExamPaperItem>();
  const [availableQuestions, setAvailableQuestions] = useState<ExamQuestionItem[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedPaperQuestion[]>([]);
  const [paperLoading, setPaperLoading] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [batchPicking, setBatchPicking] = useState(false);
  const [savingPaper, setSavingPaper] = useState(false);
  const [questionDetailOpen, setQuestionDetailOpen] = useState(false);
  const [questionDetailLoading, setQuestionDetailLoading] = useState(false);
  const [questionDetail, setQuestionDetail] = useState<ExamQuestionItem>();
  const [paperPage, setPaperPage] = useState({ pageNum: 1, pageSize: 10, total: 0 });

  const courseOptions = useMemo(
    () => courses.map((course) => ({ label: course.courseName, value: course.id })),
    [courses],
  );

  const stageOptions = useMemo(() => {
    const details = selectedCourseId ? courseDetails[selectedCourseId] || [] : [];
    return Array.from(new Set(details.map((detail) => detail.stageName))).map((stageName) => ({
      label: stageName,
      value: stageName,
    }));
  }, [courseDetails, selectedCourseId]);

  const selectedScore = useMemo(
    () => selectedQuestions.reduce((total, item) => total + Number(item.questionScore || 0), 0),
    [selectedQuestions],
  );

  useEffect(() => {
    void courseApi.page({ pageNum: 1, pageSize: 1000 }).then((data) => setCourses(data.records));
  }, []);

  const loadPapers = async (params?: Partial<ExamPaperPageParams>) => {
    const nextPageNum = params?.pageNum || paperPage.pageNum;
    const nextPageSize = params?.pageSize || paperPage.pageSize;
    setPaperLoading(true);
    try {
      const data = await examPaperApi.page({
        ...paperFilterForm.getFieldsValue(),
        ...params,
        pageNum: nextPageNum,
        pageSize: nextPageSize,
      });
      setPapers(data.records);
      setPaperPage({ pageNum: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setPaperLoading(false);
    }
  };

  useEffect(() => {
    void loadPapers({ pageNum: 1, pageSize: 10 });
  }, []);

  useEffect(() => {
    if (!selectedCourseId || courseDetails[selectedCourseId]) {
      return;
    }
    void courseApi.listDetails(selectedCourseId).then((details) => {
      setCourseDetails((prev) => ({ ...prev, [selectedCourseId]: details }));
    });
  }, [courseDetails, selectedCourseId]);

  useEffect(() => {
    if (!composingPaper || courseDetails[composingPaper.courseId]) {
      return;
    }
    void courseApi.listDetails(composingPaper.courseId).then((details) => {
      setCourseDetails((prev) => ({ ...prev, [composingPaper.courseId]: details }));
    });
  }, [composingPaper, courseDetails]);

  const openCreate = () => {
    paperForm.resetFields();
    setModalOpen(true);
  };

  const submitPaper = async () => {
    const values = await paperForm.validateFields();
    const courseName = courses.find((course) => course.id === values.courseId)?.courseName || '';
    const draftPaper: ExamPaperItem = {
      id: 0,
      ...values,
      courseName,
      questionCount: 0,
    };
    setSelectedQuestions([]);
    questionFilterForm.resetFields();
    setComposingPaper(draftPaper);
    setModalOpen(false);
    message.success('已进入组题页，保存后才会生成试卷');
  };

  const removePaper = async (id: number) => {
    await examPaperApi.remove(id);
    await loadPapers();
    if (composingPaper?.id === id) {
      setComposingPaper(undefined);
      setSelectedQuestions([]);
    }
    message.success('试卷已删除');
  };

  const loadQuestions = async () => {
    if (!composingPaper) {
      return;
    }
    setQuestionLoading(true);
    try {
      const values = questionFilterForm.getFieldsValue();
      const data = await examQuestionApi.page({
        courseId: composingPaper.courseId,
        stageName: composingPaper.stageName,
        questionType: values.questionType,
        difficulty: values.difficulty,
        keyword: values.keyword,
        status: 'ENABLED',
        pageNum: 1,
        pageSize: 200,
      });
      setAvailableQuestions(filterQuestionsByPaperScope(data.records, composingPaper));
    } finally {
      setQuestionLoading(false);
    }
  };

  useEffect(() => {
    if (composingPaper && composingPaper.id === 0) {
      void loadQuestions();
    }
  }, [composingPaper]);

  const addQuestion = (question: ExamQuestionItem) => {
    if (selectedQuestions.some((item) => item.questionId === question.id)) {
      message.warning('该题目已加入试卷');
      return;
    }
    setSelectedQuestions((items) => [
      ...items,
      {
        questionId: question.id,
        questionContent: question.questionContent,
        questionType: question.questionType,
        difficulty: question.difficulty,
        questionScore: defaultScoreMap[question.questionType],
      },
    ]);
  };

  const addQuestions = (questions: ExamQuestionItem[], questionScore?: number) => {
    setSelectedQuestions((items) => {
      const selectedIds = new Set(items.map((item) => item.questionId));
      const nextItems = questions
        .filter((question) => !selectedIds.has(question.id))
        .map((question) => ({
          questionId: question.id,
          questionContent: question.questionContent,
          questionType: question.questionType,
          difficulty: question.difficulty,
          questionScore: questionScore ?? defaultScoreMap[question.questionType],
        }));
      return [...items, ...nextItems];
    });
  };

  const batchPickQuestions = async () => {
    if (!composingPaper) {
      return;
    }
    const values = await batchPickForm.validateFields();
    setBatchPicking(true);
    try {
      const data = await examQuestionApi.page({
        courseId: composingPaper.courseId,
        stageName: composingPaper.stageName,
        questionType: values.questionType,
        difficulty: values.difficulty,
        status: 'ENABLED',
        pageNum: 1,
        pageSize: 500,
      });
      const selectedIds = new Set(selectedQuestions.map((item) => item.questionId));
      const candidates = filterQuestionsByPaperScope(data.records, composingPaper).filter(
        (item) => !selectedIds.has(item.id),
      );
      const pickedQuestions = candidates.slice(0, values.count);
      if (pickedQuestions.length === 0) {
        message.warning('没有符合条件且未加入的题目');
        return;
      }
      addQuestions(pickedQuestions, values.questionScore);
      if (pickedQuestions.length < values.count) {
        message.warning(`只找到 ${pickedQuestions.length} 道符合条件的题目，已全部加入`);
        return;
      }
      message.success(`已批量加入 ${pickedQuestions.length} 道题目`);
    } finally {
      setBatchPicking(false);
    }
  };

  const startCompose = async (paper: ExamPaperItem) => {
    const detail = await examPaperApi.detail(paper.id);
    setComposingPaper(detail);
    setSelectedQuestions(
      detail.questions.map((item) => ({
        questionId: item.questionId,
        questionContent: item.questionContent || '',
        questionType: item.questionType,
        difficulty: item.difficulty,
        questionScore: Number(item.questionScore),
      })),
    );
    questionFilterForm.resetFields();
    batchPickForm.setFieldsValue({
      questionType: 'SINGLE',
      difficulty: 'EASY',
      count: 10,
      questionScore: defaultScoreMap.SINGLE,
    });
  };

  const backToList = () => {
    if (composingPaper?.id === 0 && selectedQuestions.length > 0) {
      Modal.confirm({
        title: '确认放弃当前组题？',
        content: '当前试卷还没有保存，返回列表会丢弃已选题目。',
        onOk: () => {
          setComposingPaper(undefined);
          setSelectedQuestions([]);
        },
      });
      return;
    }
    setComposingPaper(undefined);
    setSelectedQuestions([]);
  };

  const updateQuestionScore = (questionId: number, questionScore: number | null) => {
    setSelectedQuestions((items) =>
      items.map((item) => (item.questionId === questionId ? { ...item, questionScore: questionScore || 0 } : item)),
    );
  };

  const openQuestionDetail = async (questionId: number) => {
    setQuestionDetailOpen(true);
    setQuestionDetailLoading(true);
    try {
      setQuestionDetail(await examQuestionApi.detail(questionId));
    } finally {
      setQuestionDetailLoading(false);
    }
  };

  const saveQuestions = async () => {
    if (!composingPaper) {
      return;
    }
    if (composingPaper.id !== 0) {
      message.info('已保存试卷暂不支持重新保存');
      return;
    }
    if (selectedScore !== composingPaper.totalScore) {
      message.warning(`当前题目总分 ${selectedScore} 分，试卷总分 ${composingPaper.totalScore} 分`);
      return;
    }
    if (selectedQuestions.length === 0) {
      message.warning('请至少选择一道题目');
      return;
    }
    setSavingPaper(true);
    try {
      await examPaperApi.create({
        paperName: composingPaper.paperName,
        courseId: composingPaper.courseId,
        stageName: composingPaper.stageName,
        totalScore: composingPaper.totalScore,
        questions: selectedQuestions.map((item) => ({
          questionId: item.questionId,
          questionScore: item.questionScore,
        })),
      });
      message.success('试卷已保存');
      setComposingPaper(undefined);
      setSelectedQuestions([]);
      await loadPapers({ pageNum: 1, pageSize: paperPage.pageSize });
    } finally {
      setSavingPaper(false);
    }
  };

  const paperColumns: TableColumnsType<ExamPaperItem> = [
    { title: '试卷ID', dataIndex: 'id', width: 100 },
    { title: '试卷名称', dataIndex: 'paperName' },
    { title: '课程', dataIndex: 'courseName', width: 180 },
    { title: '阶段', dataIndex: 'stageName', width: 120, render: (value?: string) => value || '整门课程' },
    {
      title: '总分数',
      dataIndex: 'totalScore',
      width: 120,
      render: (value: number) => `${value} 分`,
    },
    {
      title: '题目数',
      dataIndex: 'questionCount',
      width: 110,
      render: (value: number) => `${value || 0} 道`,
    },
    {
      title: '操作',
      width: 240,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => startCompose(record)}>
            查看组题
          </Button>
          <Popconfirm title="确认删除该试卷？" onConfirm={() => removePaper(record.id)}>
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const availableColumns: TableColumnsType<ExamQuestionItem> = [
    { title: '题目ID', dataIndex: 'id', width: 90 },
    { title: '题干', dataIndex: 'questionContent', ellipsis: true },
    {
      title: '题型',
      dataIndex: 'questionType',
      width: 100,
      render: (value?: ExamQuestionType) => questionTypeOptions.find((item) => item.value === value)?.label || value || '-',
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 100,
      render: (value: ExamQuestionDifficulty) => difficultyOptions.find((item) => item.value === value)?.label || value,
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openQuestionDetail(record.id)}>
            详情
          </Button>
          <Button
            type="link"
            disabled={composingPaper?.id !== 0 || selectedQuestions.some((item) => item.questionId === record.id)}
            onClick={() => addQuestion(record)}
          >
            {selectedQuestions.some((item) => item.questionId === record.id) ? '已加入' : '加入'}
          </Button>
        </Space>
      ),
    },
  ];

  const selectedColumns: TableColumnsType<SelectedPaperQuestion> = [
    { title: '题目ID', dataIndex: 'questionId', width: 90 },
    { title: '题干', dataIndex: 'questionContent', ellipsis: true },
    {
      title: '题型',
      dataIndex: 'questionType',
      width: 100,
      render: (value?: ExamQuestionType) => questionTypeOptions.find((item) => item.value === value)?.label || value || '-',
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 100,
      render: (value?: ExamQuestionDifficulty) => difficultyOptions.find((item) => item.value === value)?.label || value || '-',
    },
    {
      title: '题目分数',
      dataIndex: 'questionScore',
      width: 130,
      render: (value: number, record) => (
        <InputNumber
          min={0}
          precision={1}
          value={value}
          disabled={composingPaper?.id !== 0}
          onChange={(nextValue) => updateQuestionScore(record.questionId, nextValue)}
        />
      ),
    },
    {
      title: '操作',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openQuestionDetail(record.questionId)}>
            详情
          </Button>
          <Button
            type="link"
            danger
            disabled={composingPaper?.id !== 0}
            onClick={() => setSelectedQuestions((items) => items.filter((item) => item.questionId !== record.questionId))}
          >
            移除
          </Button>
        </Space>
      ),
    },
  ];

  if (composingPaper) {
    const isDraftPaper = composingPaper.id === 0;
    const scoreMatched = selectedScore === composingPaper.totalScore;
    const selectedQuestionTypeCount = selectedQuestions.reduce<Record<string, number>>((result, item) => {
      const label = questionTypeOptions.find((option) => option.value === item.questionType)?.label || item.questionType || '未知题型';
      result[label] = (result[label] || 0) + 1;
      return result;
    }, {});
    const selectedDifficultyStats = selectedQuestions.reduce<Record<string, { count: number; score: number }>>((result, item) => {
      const label = difficultyOptions.find((option) => option.value === item.difficulty)?.label || item.difficulty || '未知难度';
      const current = result[label] || { count: 0, score: 0 };
      result[label] = {
        count: current.count + 1,
        score: current.score + Number(item.questionScore || 0),
      };
      return result;
    }, {});
    return (
      <div className="paper-compose-page">
        <div className="paper-compose-header">
          <Space direction="vertical" size={2}>
            <Space>
              <Typography.Title level={4}>{composingPaper.paperName}</Typography.Title>
              {composingPaper.id === 0 && <Tag color="blue">未保存草稿</Tag>}
            </Space>
            <Typography.Text type="secondary">
              {getPaperScopeText(composingPaper)}
            </Typography.Text>
          </Space>
          <Space>
            <Tag color={scoreMatched ? 'green' : 'orange'}>
              已选 {selectedScore} / 总分 {composingPaper.totalScore}
            </Tag>
            <Button onClick={backToList}>返回列表</Button>
            {isDraftPaper && (
              <Button type="primary" loading={savingPaper} onClick={saveQuestions}>
                保存组题
              </Button>
            )}
          </Space>
        </div>

        <div className="paper-compose-stats">
          <Card size="small">
            <Typography.Text type="secondary">已选题目</Typography.Text>
            <div className="paper-stat-value">{selectedQuestions.length} 道</div>
          </Card>
          <Card size="small">
            <Typography.Text type="secondary">分数进度</Typography.Text>
            <div className={scoreMatched ? 'paper-stat-value success' : 'paper-stat-value warning'}>
              {selectedScore} / {composingPaper.totalScore}
            </div>
          </Card>
          <Card size="small">
            <Typography.Text type="secondary">题型结构</Typography.Text>
            <div className="paper-type-tags">
              {Object.keys(selectedQuestionTypeCount).length === 0 ? (
                <Typography.Text type="secondary">暂无</Typography.Text>
              ) : (
                Object.entries(selectedQuestionTypeCount).map(([label, count]) => <Tag key={label}>{label} {count}</Tag>)
              )}
            </div>
          </Card>
          <Card size="small">
            <Typography.Text type="secondary">难度结构</Typography.Text>
            <div className="paper-type-tags">
              {Object.keys(selectedDifficultyStats).length === 0 ? (
                <Typography.Text type="secondary">暂无</Typography.Text>
              ) : (
                Object.entries(selectedDifficultyStats).map(([label, stat]) => (
                  <Tag key={label}>{label} {stat.count}道 / {stat.score}分</Tag>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className={isDraftPaper ? 'paper-compose-grid' : 'paper-compose-grid paper-compose-grid-readonly'}>
          {isDraftPaper && (
            <section className="paper-compose-section">
              <div className="paper-section-title">
                <Typography.Text strong>可选题目</Typography.Text>
                <Typography.Text type="secondary">
                  {composingPaper.stageName ? '只展示当前课程阶段下已启用的题目' : '展示当前课程下已启用的题目'}
                </Typography.Text>
              </div>
              <Form
                form={batchPickForm}
                className="paper-batch-picker"
                layout="inline"
                initialValues={{
                  questionType: 'SINGLE',
                  difficulty: 'EASY',
                  count: 10,
                  questionScore: defaultScoreMap.SINGLE,
                }}
              >
                <Form.Item name="questionType" rules={[{ required: true, message: '请选择题型' }]}>
                  <Select
                    placeholder="题型"
                    options={questionTypeOptions}
                    style={{ width: 120 }}
                    onChange={(value: ExamQuestionType) => {
                      batchPickForm.setFieldValue('questionScore', defaultScoreMap[value]);
                    }}
                  />
                </Form.Item>
                <Form.Item name="difficulty" rules={[{ required: true, message: '请选择难度' }]}>
                  <Select placeholder="难度" options={difficultyOptions} style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="count" rules={[{ required: true, message: '请输入数量' }]}>
                  <InputNumber min={1} max={100} precision={0} addonAfter="道" style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="questionScore" rules={[{ required: true, message: '请输入分数' }]}>
                  <InputNumber min={0.5} precision={1} addonAfter="分/题" style={{ width: 140 }} />
                </Form.Item>
                <Button loading={batchPicking} onClick={batchPickQuestions}>
                  批量加入
                </Button>
              </Form>
              <div className="table-toolbar">
                <Form form={questionFilterForm} layout="inline" className="filter-row">
                  <Form.Item name="questionType">
                    <Select allowClear placeholder="题型" options={questionTypeOptions} style={{ width: 120 }} />
                  </Form.Item>
                  <Form.Item name="difficulty">
                    <Select allowClear placeholder="难度" options={difficultyOptions} style={{ width: 120 }} />
                  </Form.Item>
                  <Form.Item name="keyword">
                    <Input allowClear placeholder="题干关键字" />
                  </Form.Item>
                  <Button type="primary" onClick={loadQuestions}>
                    查询
                  </Button>
                </Form>
              </div>
              <Table
                rowKey="id"
                loading={questionLoading}
                columns={availableColumns}
                dataSource={availableQuestions}
                pagination={{ pageSize: 8 }}
              />
            </section>
          )}

          <section className="paper-compose-section">
            <div className="paper-selected-summary">
              <Typography.Text strong>{isDraftPaper ? '已选题目' : '题组题目'}</Typography.Text>
              <Typography.Text type={scoreMatched ? 'success' : 'warning'}>
                当前 {selectedScore} 分，目标 {composingPaper.totalScore} 分
              </Typography.Text>
            </div>
            <Table rowKey="questionId" columns={selectedColumns} dataSource={selectedQuestions} pagination={{ pageSize: isDraftPaper ? 8 : 10 }} />
          </section>
        </div>
        <Modal
          title="题目详情"
          open={questionDetailOpen}
          onCancel={() => setQuestionDetailOpen(false)}
          footer={<Button onClick={() => setQuestionDetailOpen(false)}>关闭</Button>}
          width={900}
          destroyOnHidden
        >
          {questionDetailLoading || !questionDetail ? (
            <Typography.Text type="secondary">加载中...</Typography.Text>
          ) : (
            <div className="question-detail-view">
              <Descriptions size="small" column={3}>
                <Descriptions.Item label="题目ID">{questionDetail.id}</Descriptions.Item>
                <Descriptions.Item label="题型">
                  {questionTypeOptions.find((item) => item.value === questionDetail.questionType)?.label || questionDetail.questionType}
                </Descriptions.Item>
                <Descriptions.Item label="难度">
                  {difficultyOptions.find((item) => item.value === questionDetail.difficulty)?.label || questionDetail.difficulty}
                </Descriptions.Item>
                <Descriptions.Item label="课程阶段" span={3}>
                  {questionDetail.courseStageNames || '-'}
                </Descriptions.Item>
              </Descriptions>

              <div className="question-detail-block">
                <Typography.Text strong>题干</Typography.Text>
                <pre>{questionDetail.questionContent}</pre>
              </div>

              {questionDetail.options && questionDetail.options.length > 0 && (
                <div className="question-detail-block">
                  <Typography.Text strong>选项</Typography.Text>
                  <div className="question-detail-options">
                    {questionDetail.options.map((option) => (
                      <div key={option.optionKey} className="question-detail-option">
                        <Tag>{option.optionKey}</Tag>
                        <span>{option.optionContent}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="question-detail-block">
                <Typography.Text strong>正确答案</Typography.Text>
                <pre>{questionDetail.answerContent || '-'}</pre>
              </div>

              <div className="question-detail-block">
                <Typography.Text strong>答案解析</Typography.Text>
                <pre>{questionDetail.analysisContent || '-'}</pre>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="page-panel">
      <div className="table-toolbar">
        <Space direction="vertical" size={2}>
          <Typography.Text strong>试卷列表</Typography.Text>
          <Typography.Text type="secondary">先创建试卷基础信息，再进入组题页维护题目和分数</Typography.Text>
        </Space>
        <Button type="primary" onClick={openCreate}>
          新增试卷
        </Button>
      </div>

      <Form form={paperFilterForm} layout="inline" className="filter-row">
        <Form.Item name="paperName">
          <Input allowClear placeholder="试卷名称" />
        </Form.Item>
        <Form.Item name="courseId">
          <Select allowClear showSearch optionFilterProp="label" placeholder="课程" options={courseOptions} style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="stageName">
          <Input allowClear placeholder="阶段名称" />
        </Form.Item>
        <Button type="primary" onClick={() => loadPapers({ pageNum: 1 })}>查询</Button>
        <Button onClick={() => { paperFilterForm.resetFields(); void loadPapers({ pageNum: 1, courseId: undefined, stageName: undefined, paperName: undefined }); }}>重置</Button>
      </Form>

      <Table
        rowKey="id"
        loading={paperLoading}
        columns={paperColumns}
        dataSource={papers}
        pagination={{
          current: paperPage.pageNum,
          pageSize: paperPage.pageSize,
          total: paperPage.total,
          onChange: (pageNum, pageSize) => loadPapers({ pageNum, pageSize }),
        }}
      />

      <Modal
        title="新增试卷"
        open={modalOpen}
        onOk={submitPaper}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={paperForm} layout="vertical">
          <Form.Item name="paperName" label="试卷名称" rules={[{ required: true, message: '请输入试卷名称' }]}>
            <Input placeholder="例如：JAVA+AI BASIC阶段测验" />
          </Form.Item>
          <Form.Item name="courseId" label="课程" rules={[{ required: true, message: '请选择课程' }]}>
            <Select
              showSearch
              placeholder="请选择课程"
              optionFilterProp="label"
              options={courseOptions}
              onChange={() => paperForm.setFieldValue('stageName', undefined)}
            />
          </Form.Item>
          <Form.Item name="stageName" label="阶段">
            <Select allowClear placeholder="不选则为整门课程考试" options={stageOptions} disabled={!selectedCourseId} />
          </Form.Item>
          <Form.Item name="totalScore" label="总分数" rules={[{ required: true, message: '请输入总分数' }]}>
            <InputNumber min={1} precision={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
