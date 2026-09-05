import { Button, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { useEffect, useState } from 'react';
import { clazzApi, studentManageApi, userApi } from '../api/system';
import type { ActiveStatus, ClazzItem, ProductTeachingMode, StudentItem, StudentPageParams, UserItem } from '../types/system';

interface SopFormValues {
  mentorId: number;
}

const statusOptions: Array<{ label: string; value: ActiveStatus }> = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
];

const educationOptions = [
  { label: '高中', value: '高中' },
  { label: '大专', value: '大专' },
  { label: '本科', value: '本科' },
  { label: '硕士', value: '硕士' },
  { label: '博士', value: '博士' },
  { label: '其他', value: '其他' },
];

const teachingModeOptions: Array<{ label: string; value: ProductTeachingMode }> = [
  { label: '线上', value: 'ONLINE' },
  { label: '线下', value: 'OFFLINE' },
];

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 19);
};

export default function StudentsPage() {
  const [filterForm] = Form.useForm<Partial<StudentPageParams>>();
  const [assignForm] = Form.useForm<{ classId: number }>();
  const [tagForm] = Form.useForm<{ studentTag?: string }>();
  const [sopForm] = Form.useForm<SopFormValues>();
  const [rows, setRows] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClazzItem[]>([]);
  const [teachers, setTeachers] = useState<UserItem[]>([]);
  const [studentTagOptions, setStudentTagOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [assigning, setAssigning] = useState<StudentItem>();
  const [tagEditing, setTagEditing] = useState<StudentItem>();
  const [sopAssigning, setSopAssigning] = useState<StudentItem>();
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);
  const [sopLoading, setSopLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const classOptions = classes.map((item) => ({ label: item.classPeriod, value: item.id }));
  const teacherOptions = teachers.map((item) => ({ label: `${item.realName || item.nickname || item.username} (${item.id})`, value: item.id }));

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await studentManageApi.page({ ...values, pageNum, pageSize });
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
    const loadStudentTagOptions = async () => {
      const data = await studentManageApi.tagOptions();
      setStudentTagOptions(data.map((item) => ({ label: item, value: item })));
    };
    const loadTeachers = async () => {
      const data = await userApi.page({ pageNum: 1, pageSize: 1000, roleCode: 'ADVISOR', status: 'ACTIVE' });
      setTeachers(data.records);
    };
    void loadClasses();
    void loadStudentTagOptions();
    void loadTeachers();
  }, []);

  const openAssignClass = (record: StudentItem) => {
    setAssigning(record);
    assignForm.resetFields();
  };

  const openEditTag = (record: StudentItem) => {
    setTagEditing(record);
    tagForm.setFieldsValue({ studentTag: record.studentTag });
  };

  const openAssignSop = (record: StudentItem) => {
    setSopAssigning(record);
    sopForm.resetFields();
  };

  const submitAssignClass = async () => {
    if (!assigning) {
      return;
    }
    const values = await assignForm.validateFields();
    setAssignLoading(true);
    try {
      await studentManageApi.assignClass(assigning.id, values.classId);
      message.success('班级分配成功');
      setAssigning(undefined);
      await load(pagination.current, pagination.pageSize);
    } finally {
      setAssignLoading(false);
    }
  };

  const submitAssignSop = async () => {
    if (!sopAssigning) {
      return;
    }
    const values = await sopForm.validateFields();
    setSopLoading(true);
    try {
      await studentManageApi.assignSop(sopAssigning.id, {
        mentorId: values.mentorId,
      });
      message.success('SOP分配成功');
      setSopAssigning(undefined);
      await load(pagination.current, pagination.pageSize);
    } finally {
      setSopLoading(false);
    }
  };

  const submitEditTag = async () => {
    if (!tagEditing) {
      return;
    }
    const values = await tagForm.validateFields();
    setTagLoading(true);
    try {
      await studentManageApi.updateTag(tagEditing.id, { studentTag: values.studentTag });
      message.success('学生标签已更新');
      setTagEditing(undefined);
      await load(pagination.current, pagination.pageSize);
    } finally {
      setTagLoading(false);
    }
  };

  const columns: TableColumnsType<StudentItem> = [
    { title: '学员编号', dataIndex: 'studentNo', width: 180 },
    { title: '学生姓名', dataIndex: 'studentName', width: 120 },
    { title: '手机号', dataIndex: 'studentPhone', width: 140 },
    { title: '学历', dataIndex: 'education', width: 100 },
    {
      title: '届数',
      dataIndex: 'gradeYear',
      width: 100,
      render: (value: number) => `${value}届`,
    },
    { title: '学校', dataIndex: 'school', width: 180 },
    {
      title: '专业',
      dataIndex: 'major',
      width: 160,
      render: (value?: string) => value || '-',
    },
    {
      title: '产品内容',
      dataIndex: 'productContent',
      width: 220,
      render: (value?: string) => value || '-',
    },
    {
      title: '上课方式',
      dataIndex: 'teachingMode',
      width: 100,
      render: (value: ProductTeachingMode) => teachingModeOptions.find((item) => item.value === value)?.label || value,
    },
    {
      title: '班级期数',
      dataIndex: 'classPeriod',
      width: 120,
      render: (value?: string) => value || '-',
    },
    {
      title: '标签',
      dataIndex: 'studentTag',
      width: 130,
      render: (value?: string) => (value ? <Tag color="blue">{value}</Tag> : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: ActiveStatus) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>{value === 'ACTIVE' ? '启用' : '停用'}</Tag>,
    },
    {
      title: '入学SOP',
      dataIndex: 'sopAssigned',
      width: 220,
      render: (_: unknown, record) => {
        if (record.teachingMode !== 'ONLINE') {
          return '-';
        }
        return record.sopAssigned ? (
          <Space direction="vertical" size={0}>
            <Tag color="green">已分配</Tag>
            <span>{record.sopMentorName || '-'}</span>
          </Space>
        ) : (
          <Tag>未分配</Tag>
        );
      },
    },
    {
      title: '加入时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (value?: string) => formatDateTime(value),
    },
    {
      title: '操作',
      dataIndex: 'actions',
      fixed: 'right',
      width: 160,
      render: (_: unknown, record) => (
        <Space>
          <Button type="link" onClick={() => openEditTag(record)}>
            编辑标签
          </Button>
          {record.teachingMode === 'ONLINE' && !record.sopAssigned ? (
            <Button type="link" onClick={() => openAssignSop(record)}>
              分配SOP
            </Button>
          ) : null}
          {record.teachingMode === 'OFFLINE' && !record.classId ? (
            <Button type="link" onClick={() => openAssignClass(record)}>
              分配班级
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-panel">
      <div className="table-toolbar">
        <Form form={filterForm} layout="inline" className="filter-row">
          <Form.Item name="studentName">
            <Input allowClear placeholder="学生姓名" style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="studentPhone">
            <Input allowClear placeholder="手机号" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="education">
            <Select allowClear placeholder="学历" options={educationOptions} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="school">
            <Input allowClear placeholder="学校" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="teachingMode">
            <Select allowClear placeholder="上课方式" options={teachingModeOptions} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="studentTag">
            <Select allowClear placeholder="学生标签" options={studentTagOptions} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select allowClear placeholder="状态" options={statusOptions} style={{ width: 120 }} />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={pagination}
        scroll={{ x: 2200 }}
        onChange={(page: TablePaginationConfig) => load(page.current || 1, page.pageSize || 10)}
      />

      <Modal
        title={tagEditing ? `编辑标签 - ${tagEditing.studentName}` : '编辑标签'}
        open={!!tagEditing}
        confirmLoading={tagLoading}
        onOk={submitEditTag}
        onCancel={() => setTagEditing(undefined)}
        destroyOnClose
      >
        <Form form={tagForm} layout="vertical">
          <Form.Item name="studentTag" label="学生标签">
            <Select allowClear placeholder="请选择学生标签" options={studentTagOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={sopAssigning ? `分配SOP - ${sopAssigning.studentName}` : '分配SOP'}
        open={!!sopAssigning}
        confirmLoading={sopLoading}
        onOk={submitAssignSop}
        onCancel={() => setSopAssigning(undefined)}
        destroyOnClose
      >
        <Form form={sopForm} layout="vertical">
          <Form.Item name="mentorId" label="导师" rules={[{ required: true, message: '请选择导师' }]}>
            <Select showSearch optionFilterProp="label" placeholder="请选择导师" options={teacherOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={assigning ? `分配班级 - ${assigning.studentName}` : '分配班级'}
        open={!!assigning}
        confirmLoading={assignLoading}
        onOk={submitAssignClass}
        onCancel={() => setAssigning(undefined)}
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item name="classId" label="班级" rules={[{ required: true, message: '请选择班级' }]}>
            <Select showSearch optionFilterProp="label" placeholder="请选择班级" options={classOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
