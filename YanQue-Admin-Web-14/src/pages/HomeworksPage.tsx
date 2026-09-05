import { UploadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, Upload, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig, UploadFile } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { clazzApi, homeworkApi, uploadApi } from '../api/system';
import type { ClazzItem, HomeworkItem, HomeworkPageParams, HomeworkSubmissionItem } from '../types/system';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface HomeworkFormValues {
  homeworkDate: Dayjs;
  title: string;
  classId: number;
  classContent: string;
  timeRange: [Dayjs, Dayjs];
  contentFile: UploadFile[];
  remark?: string;
}

interface HomeworkFilterValues {
  title?: string;
  classId?: number;
  homeworkDate?: Dayjs;
}

interface HomeworkAnswerFormValues {
  answerFile: UploadFile[];
  answerStudentVisible: boolean;
}

interface HomeworkGradeFormValues {
  score: number;
  teacherRemark?: string;
}

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 19);
};

const toApiDateTime = (value: unknown) => {
  if (value && typeof value === 'object' && 'format' in value && typeof (value as { format: (pattern: string) => string }).format === 'function') {
    return (value as { format: (pattern: string) => string }).format('YYYY-MM-DD HH:mm:ss');
  }
  return String(value || '');
};

const toApiDate = (value?: Dayjs) => (value ? value.format('YYYY-MM-DD') : undefined);

const createMarkdownObjectKey = (prefix: string, bizId: number) => {
  const uuid = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}/${bizId}/${dayjs().format('YYYYMMDD')}/${uuid}.md`;
};

const renderMarkdownPreview = (content: string) => {
  const lines = content.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inCodeBlock = false;

  const flushList = (key: string) => {
    if (listItems.length === 0) {
      return;
    }
    nodes.push(
      <ul key={key}>
        {listItems.map((item, index) => (
          <li key={`${key}-${index}`}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  const flushCode = (key: string) => {
    nodes.push(
      <pre key={key}>
        <code>{codeLines.join('\n')}</code>
      </pre>,
    );
    codeLines = [];
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCode(`code-${index}`);
        inCodeBlock = false;
      } else {
        flushList(`list-before-code-${index}`);
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList(`list-before-heading-${index}`);
      const level = heading[1].length;
      const text = heading[2];
      if (level === 1) {
        nodes.push(<h1 key={index}>{text}</h1>);
      } else if (level === 2) {
        nodes.push(<h2 key={index}>{text}</h2>);
      } else {
        nodes.push(<h3 key={index}>{text}</h3>);
      }
      return;
    }

    const listItem = line.match(/^\s*[-*]\s+(.+)$/);
    if (listItem) {
      listItems.push(listItem[1]);
      return;
    }

    flushList(`list-before-p-${index}`);
    nodes.push(line.trim() ? <p key={index}>{line}</p> : <div key={index} className="markdown-preview-spacer" />);
  });

  flushList('list-end');
  if (inCodeBlock) {
    flushCode('code-end');
  }
  return nodes;
};

export default function HomeworksPage() {
  const [filterForm] = Form.useForm<HomeworkFilterValues>();
  const [form] = Form.useForm<HomeworkFormValues>();
  const [answerForm] = Form.useForm<HomeworkAnswerFormValues>();
  const [gradeForm] = Form.useForm<HomeworkGradeFormValues>();
  const [rows, setRows] = useState<HomeworkItem[]>([]);
  const [classes, setClasses] = useState<ClazzItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [gradePreviewOpen, setGradePreviewOpen] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [currentHomework, setCurrentHomework] = useState<HomeworkItem>();
  const [currentSubmission, setCurrentSubmission] = useState<HomeworkSubmissionItem>();
  const [submissionRows, setSubmissionRows] = useState<HomeworkSubmissionItem[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [gradePreviewLoading, setGradePreviewLoading] = useState(false);
  const [gradePreviewContent, setGradePreviewContent] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [submissionPagination, setSubmissionPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const selectedClassId = Form.useWatch('classId', form);
  const selectedHomeworkDate = Form.useWatch('homeworkDate', form);

  const classOptions = classes.map((item) => ({ label: item.classPeriod, value: item.id }));

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const params: HomeworkPageParams = {
        title: values.title,
        classId: values.classId,
        homeworkDate: toApiDate(values.homeworkDate),
        pageNum,
        pageSize,
      };
      const data = await homeworkApi.page(params);
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, 10);
    const loadClasses = async () => {
      const data = await clazzApi.page({ pageNum: 1, pageSize: 1000 });
      setClasses(data.records);
    };
    void loadClasses();
  }, []);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ homeworkDate: dayjs() });
    setOpen(true);
  };

  const openAnswer = (record: HomeworkItem) => {
    setCurrentHomework(record);
    answerForm.resetFields();
    answerForm.setFieldsValue({ answerStudentVisible: record.answerStudentVisible || false });
    setAnswerOpen(true);
  };

  const loadSubmissions = async (homeworkId: number, pageNum = submissionPagination.current, pageSize = submissionPagination.pageSize) => {
    setSubmissionLoading(true);
    try {
      const data = await homeworkApi.submissions(homeworkId, { pageNum, pageSize });
      setSubmissionRows(data.records);
      setSubmissionPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setSubmissionLoading(false);
    }
  };

  const openSubmissions = async (record: HomeworkItem) => {
    setCurrentHomework(record);
    setSubmissionOpen(true);
    await loadSubmissions(record.id, 1, 10);
  };

  const openGradePreview = async (record: HomeworkSubmissionItem) => {
    setCurrentSubmission(record);
    gradeForm.setFieldsValue({
      score: record.score,
      teacherRemark: record.teacherRemark,
    });
    setGradePreviewOpen(true);
    setGradePreviewLoading(true);
    setGradePreviewContent('');
    try {
      const data = await uploadApi.presignDownload(record.contentObjectKey);
      const response = await fetch(data.downloadUrl);
      if (!response.ok) {
        throw new Error('提交文件预览失败');
      }
      setGradePreviewContent(await response.text());
    } finally {
      setGradePreviewLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !selectedClassId || !selectedHomeworkDate) {
      return;
    }
    const prepare = async () => {
      setPreparing(true);
      try {
        const data = await homeworkApi.prepare(selectedClassId, selectedHomeworkDate.format('YYYY-MM-DD'));
        form.setFieldsValue({
          title: data.defaultTitle,
          classContent: data.classContent,
          timeRange: [dayjs(data.startTime), dayjs(data.deadline)],
        });
      } catch {
        form.setFieldsValue({
          title: undefined,
          classContent: undefined,
          timeRange: undefined,
        });
      } finally {
        setPreparing(false);
      }
    };
    void prepare();
  }, [open, selectedClassId, selectedHomeworkDate, form]);

  const previewMarkdown = async (objectKey: string | undefined, fileName: string | undefined, fileLabel: string) => {
    if (!objectKey) {
      message.error(`${fileLabel}不存在`);
      return;
    }
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewFileName(fileName || `${fileLabel}.md`);
    setPreviewContent('');
    try {
      const data = await uploadApi.presignDownload(objectKey);
      const response = await fetch(data.downloadUrl);
      if (!response.ok) {
        throw new Error(`${fileLabel}预览失败`);
      }
      setPreviewContent(await response.text());
    } finally {
      setPreviewLoading(false);
    }
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const file = values.contentFile?.[0]?.originFileObj;
      if (!file) {
        message.error('请选择作业内容文件');
        return;
      }
      const objectKey = createMarkdownObjectKey('homework/content', values.classId);
      const sign = await uploadApi.presignUpload(objectKey);
      const response = await fetch(sign.uploadUrl, {
        method: 'PUT',
        headers: sign.headers || {},
        body: file,
      });
      if (!response.ok) {
        throw new Error('作业内容上传失败');
      }
      await homeworkApi.create({
        title: values.title,
        contentObjectKey: sign.objectKey,
        contentFileName: file.name,
        classId: values.classId,
        homeworkDate: values.homeworkDate.format('YYYY-MM-DD'),
        classContent: values.classContent,
        startTime: toApiDateTime(values.timeRange[0]),
        deadline: toApiDateTime(values.timeRange[1]),
        remark: values.remark,
      });
      message.success('作业创建成功');
      setOpen(false);
      await load(1, pagination.pageSize);
    } finally {
      setSaving(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentHomework) {
      return;
    }
    const values = await answerForm.validateFields();
    setSaving(true);
    try {
      const file = values.answerFile?.[0]?.originFileObj;
      if (!file) {
        message.error('请选择答案文件');
        return;
      }
      const objectKey = createMarkdownObjectKey('homework/answer', currentHomework.id);
      const sign = await uploadApi.presignUpload(objectKey);
      const response = await fetch(sign.uploadUrl, {
        method: 'PUT',
        headers: sign.headers || {},
        body: file,
      });
      if (!response.ok) {
        throw new Error('答案文件上传失败');
      }
      await homeworkApi.publishAnswer(currentHomework.id, {
        answerObjectKey: sign.objectKey,
        answerFileName: file.name,
        answerStudentVisible: values.answerStudentVisible,
      });
      message.success('答案发布成功');
      setAnswerOpen(false);
      setCurrentHomework(undefined);
      await load(pagination.current, pagination.pageSize);
    } finally {
      setSaving(false);
    }
  };

  const submitGrade = async () => {
    if (!currentSubmission || !currentHomework) {
      return;
    }
    const values = await gradeForm.validateFields();
    setGrading(true);
    try {
      await homeworkApi.gradeSubmission(currentSubmission.id, {
        score: values.score,
        teacherRemark: values.teacherRemark,
      });
      message.success('批改保存成功');
      const nextSubmission = {
        ...currentSubmission,
        score: values.score,
        teacherRemark: values.teacherRemark,
      };
      setCurrentSubmission(nextSubmission);
      setSubmissionRows((items) => items.map((item) => (item.id === currentSubmission.id ? nextSubmission : item)));
      await loadSubmissions(currentHomework.id, submissionPagination.current, submissionPagination.pageSize);
    } finally {
      setGrading(false);
    }
  };

  const columns: TableColumnsType<HomeworkItem> = [
    { title: '作业标题', dataIndex: 'title', width: 180 },
    {
      title: '作业文件',
      dataIndex: 'contentFileName',
      width: 180,
      render: (value: string, record) => (
        <Button type="link" className="table-link-button" onClick={() => previewMarkdown(record.contentObjectKey, value, '作业文件')}>
          {value || record.contentObjectKey?.split('/').pop() || '预览作业'}
        </Button>
      ),
    },
    { title: '班级期数', dataIndex: 'classPeriod', width: 120, render: (value?: string) => value || '-' },
    { title: '作业日期', dataIndex: 'homeworkDate', width: 120, render: (value?: string) => value || '-' },
    { title: '课程内容', dataIndex: 'classContent', width: 180 },
    {
      title: '答案文件',
      dataIndex: 'answerFileName',
      width: 160,
      render: (value: string | undefined, record) => {
        if (!record.answerObjectKey) {
          return '-';
        }
        return (
          <Button type="link" className="table-link-button" onClick={() => previewMarkdown(record.answerObjectKey, value, '答案文件')}>
            {value || record.answerObjectKey.split('/').pop() || '预览答案'}
          </Button>
        );
      },
    },
    { title: '学生可见', dataIndex: 'answerStudentVisible', width: 100, render: (value?: boolean) => (value ? '是' : '否') },
    { title: '开始时间', dataIndex: 'startTime', width: 170, render: (value?: string) => formatDateTime(value) },
    { title: '截止时间', dataIndex: 'deadline', width: 170, render: (value?: string) => formatDateTime(value) },
    { title: '备注', dataIndex: 'remark', width: 180, render: (value?: string) => value || '-' },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, render: (value?: string) => formatDateTime(value) },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" className="table-link-button" onClick={() => openSubmissions(record)}>
            查看提交
          </Button>
          <Button type="link" className="table-link-button" onClick={() => openAnswer(record)}>
            {record.answerObjectKey ? '更新答案' : '发布答案'}
          </Button>
        </Space>
      ),
    },
  ];

  const submissionColumns: TableColumnsType<HomeworkSubmissionItem> = [
    { title: '学生姓名', dataIndex: 'studentName', width: 120, render: (value?: string) => value || '-' },
    { title: '手机号', dataIndex: 'studentPhone', width: 140, render: (value?: string) => value || '-' },
    {
      title: '提交文件',
      dataIndex: 'contentFileName',
      width: 220,
      render: (value: string, record) => (
        <Button type="link" className="table-link-button" onClick={() => openGradePreview(record)}>
          {value || record.contentObjectKey?.split('/').pop() || '预览提交'}
        </Button>
      ),
    },
    { title: '提交时间', dataIndex: 'submitTime', width: 170, render: (value?: string) => formatDateTime(value) },
    { title: '是否逾期', dataIndex: 'lateSubmitted', width: 100, render: (value?: boolean) => (value ? '是' : '否') },
    { title: '批改状态', dataIndex: 'score', width: 100, render: (value?: number) => (value === undefined || value === null ? <Tag>未批改</Tag> : <Tag color="green">已批改</Tag>) },
    { title: '分数', dataIndex: 'score', width: 90, render: (value?: number) => (value === undefined || value === null ? '-' : value) },
    { title: '评语', dataIndex: 'teacherRemark', width: 180, render: (value?: string) => value || '-' },
    {
      title: '操作',
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" className="table-link-button" onClick={() => openGradePreview(record)}>
          {record.score === undefined || record.score === null ? '批改' : '修改'}
        </Button>
      ),
    },
  ];

  return (
    <div className="page-panel">
      <div className="table-toolbar">
        <Form form={filterForm} layout="inline" className="filter-row">
          <Form.Item name="title">
            <Input allowClear placeholder="作业标题" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="classId">
            <Select allowClear showSearch optionFilterProp="label" placeholder="班级" options={classOptions} style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="homeworkDate">
            <DatePicker allowClear placeholder="作业日期" style={{ width: 150 }} />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
          <Button type="primary" onClick={openCreate}>
            新增作业
          </Button>
        </Form>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={pagination}
        scroll={{ x: 1850 }}
        onChange={(page: TablePaginationConfig) => load(page.current || 1, page.pageSize || 10)}
      />

      <Modal title="新增作业" open={open} confirmLoading={saving} onOk={submit} onCancel={() => setOpen(false)} width={760} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="homeworkDate" label="作业日期" rules={[{ required: true, message: '请选择作业日期' }]}>
            <DatePicker allowClear={false} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="classId" label="班级" rules={[{ required: true, message: '请选择班级' }]}>
            <Select showSearch optionFilterProp="label" placeholder="请选择班级" options={classOptions} loading={preparing} />
          </Form.Item>
          <Form.Item name="title" label="作业标题" rules={[{ required: true, message: '请输入作业标题' }]}>
            <Input placeholder="选择日期和班级后自动生成，可修改" />
          </Form.Item>
          <Form.Item name="classContent" label="课程内容" rules={[{ required: true, message: '请输入课程内容' }]}>
            <Input readOnly placeholder="选择日期和班级后自动带出" />
          </Form.Item>
          <Form.Item name="timeRange" label="作业时间" rules={[{ required: true, message: '请选择开始和截止时间' }]}>
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="contentFile"
            label="作业内容文件"
            valuePropName="fileList"
            getValueFromEvent={(event) => event?.fileList || []}
            rules={[
              { required: true, message: '请上传作业内容文件' },
              {
                validator: (_, fileList?: UploadFile[]) => {
                  const file = fileList?.[0];
                  if (!file) {
                    return Promise.reject(new Error('请上传作业内容文件'));
                  }
                  if (!file.name.toLowerCase().endsWith('.md')) {
                    return Promise.reject(new Error('作业内容只支持md格式'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Upload
              accept=".md,text/markdown,text/plain"
              maxCount={1}
              beforeUpload={(file) => {
                if (!file.name.toLowerCase().endsWith('.md')) {
                  message.error('作业内容只支持md格式');
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>选择 Markdown 文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注，可选" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={previewFileName}
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={960}
        className="homework-preview-modal"
      >
        <div className="markdown-preview">
          {previewLoading ? '加载中...' : renderMarkdownPreview(previewContent)}
        </div>
      </Modal>

      <Modal
        title={currentHomework?.answerObjectKey ? '更新答案' : '发布答案'}
        open={answerOpen}
        confirmLoading={saving}
        onOk={submitAnswer}
        onCancel={() => setAnswerOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form form={answerForm} layout="vertical" initialValues={{ answerStudentVisible: false }}>
          <Form.Item
            name="answerFile"
            label="答案文件"
            valuePropName="fileList"
            getValueFromEvent={(event) => event?.fileList || []}
            rules={[
              { required: true, message: '请上传答案文件' },
              {
                validator: (_, fileList?: UploadFile[]) => {
                  const file = fileList?.[0];
                  if (!file) {
                    return Promise.reject(new Error('请上传答案文件'));
                  }
                  if (!file.name.toLowerCase().endsWith('.md')) {
                    return Promise.reject(new Error('答案只支持md格式'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Upload
              accept=".md,text/markdown,text/plain"
              maxCount={1}
              beforeUpload={(file) => {
                if (!file.name.toLowerCase().endsWith('.md')) {
                  message.error('答案只支持md格式');
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>选择 Markdown 文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="answerStudentVisible" label="学生是否可见" valuePropName="checked">
            <Switch checkedChildren="可见" unCheckedChildren="不可见" />
          </Form.Item>
          {currentHomework?.answerFileName && (
            <Space className="form-tip" size={8}>
              <span>当前答案：</span>
              <span>{currentHomework.answerFileName}</span>
            </Space>
          )}
        </Form>
      </Modal>

      <Modal
        title={`提交记录${currentHomework?.title ? `：${currentHomework.title}` : ''}`}
        open={submissionOpen}
        footer={null}
        onCancel={() => setSubmissionOpen(false)}
        width={860}
      >
        <Table
          rowKey="id"
          loading={submissionLoading}
          columns={submissionColumns}
          dataSource={submissionRows}
          pagination={submissionPagination}
          scroll={{ x: 1020 }}
          onChange={(page: TablePaginationConfig) => {
            if (currentHomework) {
              void loadSubmissions(currentHomework.id, page.current || 1, page.pageSize || 10);
            }
          }}
        />
      </Modal>

      <Modal
        title={currentSubmission?.contentFileName || '批改作业'}
        open={gradePreviewOpen}
        footer={null}
        onCancel={() => setGradePreviewOpen(false)}
        width={1180}
        className="homework-grade-modal"
        destroyOnClose
      >
        <div className="homework-grade-workbench">
          <div className="homework-grade-preview">
            <div className="markdown-preview">
              {gradePreviewLoading ? '加载中...' : renderMarkdownPreview(gradePreviewContent)}
            </div>
          </div>
          <aside className="homework-grade-panel">
            <div className="grade-student-card">
              <span>学生信息</span>
              <strong>{currentSubmission?.studentName || '-'}</strong>
              <p>{currentSubmission?.studentPhone || '-'}</p>
            </div>
            <div className="grade-meta-list">
              <div>
                <span>提交时间</span>
                <strong>{formatDateTime(currentSubmission?.submitTime)}</strong>
              </div>
              <div>
                <span>提交状态</span>
                <Tag color={currentSubmission?.lateSubmitted ? 'red' : 'green'}>{currentSubmission?.lateSubmitted ? '逾期' : '正常'}</Tag>
              </div>
              <div>
                <span>批改状态</span>
                <Tag color={currentSubmission?.score === undefined || currentSubmission?.score === null ? 'default' : 'green'}>
                  {currentSubmission?.score === undefined || currentSubmission?.score === null ? '未批改' : '已批改'}
                </Tag>
              </div>
            </div>
            <Form form={gradeForm} layout="vertical" className="grade-form">
              <Form.Item name="score" label="分数" rules={[{ required: true, message: '请输入分数' }]}>
                <InputNumber min={0} max={100} precision={0} style={{ width: '100%' }} placeholder="请输入0-100之间的分数" />
              </Form.Item>
              <Form.Item name="teacherRemark" label="老师评语">
                <TextArea rows={7} maxLength={500} showCount placeholder="边看作业边记录评语，可选" />
              </Form.Item>
              <Button type="primary" block loading={grading} onClick={submitGrade}>
                保存批改
              </Button>
            </Form>
          </aside>
        </div>
      </Modal>
    </div>
  );
}
