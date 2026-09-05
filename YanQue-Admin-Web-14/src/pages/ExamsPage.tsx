import { Button, DatePicker, Form, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clazzApi, examApi, examPaperApi, userApi } from '../api/system';
import type { ClazzItem, ExamItem, ExamPageParams, ExamPaperItem, UserItem } from '../types/system';

interface ExamFormValues {
  paperId: number;
  classId: number;
  timeRange: [Dayjs, Dayjs];
  durationMinutes: number;
  invigilatorUserId: number;
}

interface FilterValues {
  paperId?: number;
  classId?: number;
  invigilatorUserId?: number;
}

const formatDateTime = (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-');

export default function ExamsPage() {
  const navigate = useNavigate();
  const [filterForm] = Form.useForm<FilterValues>();
  const [form] = Form.useForm<ExamFormValues>();
  const [rows, setRows] = useState<ExamItem[]>([]);
  const [papers, setPapers] = useState<ExamPaperItem[]>([]);
  const [classes, setClasses] = useState<ClazzItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExamItem>();
  const [page, setPage] = useState({ pageNum: 1, pageSize: 10, total: 0 });

  const paperOptions = useMemo(
    () => papers.map((item) => ({ label: item.paperName, value: item.id })),
    [papers],
  );

  const classOptions = useMemo(
    () => classes.map((item) => ({ label: item.classPeriod, value: item.id })),
    [classes],
  );

  const userOptions = useMemo(
    () => users.map((item) => ({ label: `${item.realName || item.nickname || item.username} (${item.id})`, value: item.id })),
    [users],
  );

  const loadOptions = async () => {
    const [paperData, classData, userData] = await Promise.all([
      examPaperApi.page({ pageNum: 1, pageSize: 1000 }),
      clazzApi.page({ pageNum: 1, pageSize: 1000 }),
      userApi.page({ pageNum: 1, pageSize: 1000, status: 'ACTIVE' }),
    ]);
    setPapers(paperData.records);
    setClasses(classData.records);
    setUsers(userData.records);
  };

  const loadRows = async (pageNum = page.pageNum, pageSize = page.pageSize) => {
    const values = filterForm.getFieldsValue();
    const params: ExamPageParams = {
      ...values,
      pageNum,
      pageSize,
    };
    setLoading(true);
    try {
      const data = await examApi.page(params);
      setRows(data.records);
      setPage({ pageNum: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOptions();
    void loadRows(1, 10);
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = async (record: ExamItem) => {
    const detail = await examApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue({
      paperId: detail.paperId,
      classId: detail.classId,
      timeRange: [dayjs(detail.startTime), dayjs(detail.endTime)],
      durationMinutes: detail.durationMinutes,
      invigilatorUserId: detail.invigilatorUserId,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const [startTime, endTime] = values.timeRange;
    if (!startTime.isBefore(endTime)) {
      message.warning('可进入开始时间必须早于可进入截止时间');
      return;
    }
    const payload = {
      paperId: values.paperId,
      classId: values.classId,
      startTime: startTime.format('YYYY-MM-DD HH:mm:ss'),
      endTime: endTime.format('YYYY-MM-DD HH:mm:ss'),
      durationMinutes: values.durationMinutes,
      invigilatorUserId: values.invigilatorUserId,
    };
    if (editing) {
      await examApi.update(editing.id, payload);
      message.success('考试已更新');
    } else {
      await examApi.create(payload);
      message.success('考试已创建');
    }
    setModalOpen(false);
    await loadRows(editing ? page.pageNum : 1, page.pageSize);
  };

  const remove = async (id: number) => {
    await examApi.remove(id);
    message.success('考试已删除');
    await loadRows(page.pageNum, page.pageSize);
  };

  const updateAnswerVisible = async (record: ExamItem, answerVisible: boolean) => {
    await examApi.updateAnswerVisible(record.id, answerVisible);
    message.success(answerVisible ? '考试结果已公布' : '已取消公布考试结果');
    await loadRows(page.pageNum, page.pageSize);
  };

  const columns: TableColumnsType<ExamItem> = [
    { title: '考试ID', dataIndex: 'id', width: 90 },
    { title: '试卷', dataIndex: 'paperName', ellipsis: true },
    { title: '班级', dataIndex: 'classPeriod', width: 160 },
    {
      title: '可进入开始时间',
      dataIndex: 'startTime',
      width: 180,
      render: formatDateTime,
    },
    {
      title: '可进入截止时间',
      dataIndex: 'endTime',
      width: 180,
      render: formatDateTime,
    },
    {
      title: '答题时长',
      dataIndex: 'durationMinutes',
      width: 120,
      render: (value: number) => `${value} 分钟`,
    },
    { title: '监考老师', dataIndex: 'invigilatorName', width: 140 },
    {
      title: '结果公布',
      dataIndex: 'answerVisible',
      width: 120,
      render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? '已公布' : '未公布'}</Tag>,
    },
    {
      title: '操作',
      width: 240,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" onClick={() => navigate(`/exams/${record.id}/submissions`)}>
            提交记录
          </Button>
          <Popconfirm
            title={record.answerVisible ? '确认取消公布结果？' : '确认向学生公布结果？'}
            onConfirm={() => updateAnswerVisible(record, !record.answerVisible)}
          >
            <Button type="link">{record.answerVisible ? '取消公布' : '公布结果'}</Button>
          </Popconfirm>
          <Popconfirm title="确认删除该考试？" onConfirm={() => remove(record.id)}>
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
          <Form.Item name="paperId">
            <Select allowClear showSearch placeholder="试卷" optionFilterProp="label" options={paperOptions} style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="classId">
            <Select allowClear showSearch placeholder="班级" optionFilterProp="label" options={classOptions} style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="invigilatorUserId">
            <Select allowClear showSearch placeholder="监考老师" optionFilterProp="label" options={userOptions} style={{ width: 180 }} />
          </Form.Item>
          <Button type="primary" onClick={() => loadRows(1, page.pageSize)}>
            查询
          </Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增考试
        </Button>
      </div>

      <Table
        rowKey="id"
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
        title={editing ? '编辑考试' : '新增考试'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        width={720}
      >
        <Typography.Text type="secondary">学生可在时间窗口内进入考试，进入后按答题时长倒计时。</Typography.Text>
        <Form form={form} layout="vertical" className="exam-form">
          <Form.Item name="paperId" label="试卷" rules={[{ required: true, message: '请选择试卷' }]}>
            <Select showSearch placeholder="请选择试卷" optionFilterProp="label" options={paperOptions} />
          </Form.Item>
          <Form.Item name="classId" label="班级" rules={[{ required: true, message: '请选择班级' }]}>
            <Select showSearch placeholder="请选择班级" optionFilterProp="label" options={classOptions} />
          </Form.Item>
          <Form.Item name="timeRange" label="可进入时间窗口" rules={[{ required: true, message: '请选择可进入时间窗口' }]}>
            <DatePicker.RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="durationMinutes" label="答题时长" rules={[{ required: true, message: '请输入答题时长' }]}>
            <InputNumber min={1} precision={0} addonAfter="分钟" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="invigilatorUserId" label="监考老师" rules={[{ required: true, message: '请选择监考老师' }]}>
            <Select showSearch placeholder="请选择监考老师" optionFilterProp="label" options={userOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
