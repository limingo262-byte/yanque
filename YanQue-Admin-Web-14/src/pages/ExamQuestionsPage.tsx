import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { courseApi, examQuestionApi } from '../api/system';
import type {
  CourseItem,
  CourseDetailItem,
  ExamQuestionItem,
  ExamQuestionPageParams,
  ExamQuestionType,
  ExamQuestionValues,
} from '../types/system';

interface ExamQuestionFormValues extends Omit<ExamQuestionValues, 'courseStages'> {
  courseStageKeys?: string[];
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

const statusOptions = [
  { label: '启用', value: 'ENABLED' },
  { label: '停用', value: 'DISABLED' },
];

const judgeAnswerOptions = [
  { label: '正确', value: 'TRUE' },
  { label: '错误', value: 'FALSE' },
];

const defaultOptions = [
  { optionKey: 'A', optionContent: '' },
  { optionKey: 'B', optionContent: '' },
  { optionKey: 'C', optionContent: '' },
  { optionKey: 'D', optionContent: '' },
];

const isChoiceQuestion = (type?: ExamQuestionType) => type === 'SINGLE' || type === 'MULTIPLE';

export default function ExamQuestionsPage() {
  const [form] = Form.useForm<ExamQuestionFormValues>();
  const [filterForm] = Form.useForm<Partial<ExamQuestionPageParams>>();
  const questionType = Form.useWatch('questionType', form);
  const selectedCourseIds = Form.useWatch('courseIds', form) || [];
  const options = Form.useWatch('options', form) || [];
  const [rows, setRows] = useState<ExamQuestionItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [courseDetails, setCourseDetails] = useState<Record<number, CourseDetailItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ExamQuestionItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const courseOptions = useMemo(
    () => courses.map((course) => ({ label: course.courseName, value: course.id })),
    [courses],
  );

  const answerOptions = useMemo(
    () =>
      options
        .filter((item) => item?.optionKey)
        .map((item) => ({
          label: `${item.optionKey}${item.optionContent ? `：${item.optionContent}` : ''}`,
          value: item.optionKey,
        })),
    [options],
  );

  const courseStageOptions = useMemo(() => {
    const courseMap = new Map(courses.map((course) => [course.id, course.courseName]));
    return selectedCourseIds.flatMap((courseId) => {
      const stageNames = Array.from(new Set((courseDetails[courseId] || []).map((detail) => detail.stageName)));
      return stageNames.map((stageName) => ({
        label: `${courseMap.get(courseId) || courseId} / ${stageName}`,
        value: `${courseId}::${stageName}`,
      }));
    });
  }, [courseDetails, courses, selectedCourseIds]);

  const loadCourses = async () => {
    const data = await courseApi.page({ pageNum: 1, pageSize: 1000 });
    setCourses(data.records);
  };

  useEffect(() => {
    const missingCourseIds = selectedCourseIds.filter((courseId) => !courseDetails[courseId]);
    if (missingCourseIds.length === 0) {
      return;
    }
    void Promise.all(
      missingCourseIds.map(async (courseId) => {
        const details = await courseApi.listDetails(courseId);
        return { courseId, details };
      }),
    ).then((items) => {
      setCourseDetails((prev) => ({
        ...prev,
        ...Object.fromEntries(items.map((item) => [item.courseId, item.details])),
      }));
    });
  }, [courseDetails, selectedCourseIds]);

  useEffect(() => {
    if (selectedCourseIds.some((courseId) => !courseDetails[courseId])) {
      return;
    }
    const validValues = new Set(courseStageOptions.map((item) => item.value));
    const currentValues = form.getFieldValue('courseStageKeys') || [];
    const nextValues = currentValues.filter((value: string) => validValues.has(value));
    if (nextValues.length !== currentValues.length) {
      form.setFieldValue('courseStageKeys', nextValues);
    }
  }, [courseStageOptions, form]);

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await examQuestionApi.page({ ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
    void load(1, 10);
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue({
      questionType: 'SINGLE',
      difficulty: 'NORMAL',
      status: 'ENABLED',
      options: defaultOptions,
    });
    setModalOpen(true);
  };

  const openEdit = async (record: ExamQuestionItem) => {
    const detail = await examQuestionApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue({
      ...detail,
      answerContent: detail.questionType === 'MULTIPLE' ? detail.answerContent?.split(',') || [] : detail.answerContent || '',
      courseStageKeys: detail.courseStageKeys || [],
      options: isChoiceQuestion(detail.questionType) ? detail.options || defaultOptions : [],
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const data: ExamQuestionValues = {
      ...values,
      answerContent: Array.isArray(values.answerContent) ? values.answerContent.join(',') : values.answerContent,
      courseStages: (values.courseStageKeys || []).map((value) => {
        const [courseId, stageName] = value.split('::');
        return { courseId: Number(courseId), stageName };
      }),
      options: isChoiceQuestion(values.questionType) ? values.options : [],
    };
    delete (data as Partial<ExamQuestionFormValues>).courseStageKeys;
    if (editing) {
      await examQuestionApi.update(editing.id, data);
      message.success('题目已更新');
    } else {
      await examQuestionApi.create(data);
      message.success('题目已创建');
    }
    setModalOpen(false);
    void load();
  };

  const remove = async (id: number) => {
    await examQuestionApi.remove(id);
    message.success('题目已删除');
    void load();
  };

  const updateStatus = async (record: ExamQuestionItem) => {
    const status = record.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    await examQuestionApi.updateStatus(record.id, status);
    message.success(status === 'ENABLED' ? '题目已启用' : '题目已停用');
    void load();
  };

  const handleQuestionTypeChange = (type: ExamQuestionType) => {
    form.setFieldValue('answerContent', type === 'MULTIPLE' ? [] : undefined);
    form.setFieldValue('options', isChoiceQuestion(type) ? defaultOptions : []);
  };

  const columns: TableColumnsType<ExamQuestionItem> = [
    { title: '题目ID', dataIndex: 'id', width: 90 },
    {
      title: '题干',
      dataIndex: 'questionContent',
      ellipsis: true,
    },
    {
      title: '题型',
      dataIndex: 'questionType',
      width: 100,
      render: (value: ExamQuestionType) => questionTypeOptions.find((item) => item.value === value)?.label || value,
    },
    {
      title: '课程阶段',
      dataIndex: 'courseStageNames',
      width: 240,
      render: (value: string) => value || '-',
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 90,
      render: (value: string) => difficultyOptions.find((item) => item.value === value)?.label || value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: string) => <Tag color={value === 'ENABLED' ? 'green' : 'default'}>{value === 'ENABLED' ? '启用' : '停用'}</Tag>,
    },
    {
      title: '操作',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" onClick={() => updateStatus(record)}>
            {record.status === 'ENABLED' ? '停用' : '启用'}
          </Button>
          <Popconfirm title="确认删除该题目？" onConfirm={() => remove(record.id)}>
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-panel">
      <div className="table-toolbar">
        <Form form={filterForm} layout="inline" className="filter-row">
          <Form.Item name="questionType">
            <Select allowClear placeholder="题型" options={questionTypeOptions} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="courseId">
            <Select allowClear showSearch placeholder="课程" optionFilterProp="label" options={courseOptions} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="difficulty">
            <Select allowClear placeholder="难度" options={difficultyOptions} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select allowClear placeholder="状态" options={statusOptions} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="keyword">
            <Input allowClear placeholder="题干关键字" />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增题目
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={pagination}
        onChange={(page: TablePaginationConfig) => load(page.current || 1, page.pageSize || 10)}
      />

      <Modal
        title={editing ? '编辑题目' : '新增题目'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        width={760}
      >
        <Form form={form} layout="vertical">
          <Space align="start" style={{ width: '100%' }}>
            <Form.Item name="questionType" label="题型" rules={[{ required: true, message: '请选择题型' }]}>
              <Select options={questionTypeOptions} style={{ width: 140 }} onChange={handleQuestionTypeChange} />
            </Form.Item>
            <Form.Item name="difficulty" label="难度" rules={[{ required: true, message: '请选择难度' }]}>
              <Select options={difficultyOptions} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
              <Select options={statusOptions} style={{ width: 140 }} />
            </Form.Item>
          </Space>

          <Form.Item name="courseIds" label="关联课程">
            <Select
              allowClear
              mode="multiple"
              showSearch
              placeholder="可多选"
              optionFilterProp="label"
              options={courseOptions}
            />
          </Form.Item>
          <Form.Item name="courseStageKeys" label="关联阶段">
            <Select
              allowClear
              mode="multiple"
              placeholder="先选择课程，再选择阶段"
              options={courseStageOptions}
              disabled={selectedCourseIds.length === 0}
            />
          </Form.Item>
          <Form.Item name="questionContent" label="题干" rules={[{ required: true, message: '请输入题干' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>

          {isChoiceQuestion(questionType) && (
            <Form.List name="options">
              {(fields, { add, remove: removeOption }) => (
                <div>
                  {fields.map((field) => (
                    <div key={field.key} className="question-option-row">
                      <Form.Item
                        {...field}
                        name={[field.name, 'optionKey']}
                        rules={[{ required: true, message: '选项标识' }]}
                      >
                        <Input placeholder="A" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'optionContent']}
                        rules={[{ required: true, message: '请输入选项内容' }]}
                      >
                        <Input placeholder="选项内容" />
                      </Form.Item>
                      <Button onClick={() => removeOption(field.name)} disabled={fields.length <= 2}>
                        删除
                      </Button>
                    </div>
                  ))}
                  <Button onClick={() => add({ optionKey: '', optionContent: '' })}>
                    添加选项
                  </Button>
                </div>
              )}
            </Form.List>
          )}

          <Form.Item
            name="answerContent"
            label={questionType === 'PROGRAMMING' ? '参考答案/代码' : '正确答案'}
            rules={[{ required: true, message: questionType === 'PROGRAMMING' ? '请输入参考答案或代码' : '请选择或填写正确答案' }]}
          >
            {questionType === 'SINGLE' && <Select placeholder="请选择正确选项" options={answerOptions} />}
            {questionType === 'MULTIPLE' && <Select mode="multiple" placeholder="请选择正确选项" options={answerOptions} />}
            {questionType === 'JUDGE' && <Select placeholder="请选择判断答案" options={judgeAnswerOptions} />}
            {(questionType === 'FILL' || questionType === 'SHORT' || questionType === 'PROGRAMMING') && <Input.TextArea rows={5} />}
          </Form.Item>

          <Form.Item name="analysisContent" label="答案解析">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
