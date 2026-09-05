import { Button, DatePicker, Form, Input, Modal, Popconfirm, Select, Space, Table, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { campusApi, clazzApi, courseApi, userApi } from '../api/system';
import type { CampusItem, ClazzItem, ClazzPageParams, ClazzValues, CourseItem, UserItem } from '../types/system';

interface ScheduleFormValues {
  firstClassDate: { format: (template: string) => string };
}

export default function ClassesPage() {
  const [form] = Form.useForm<ClazzValues>();
  const [scheduleForm] = Form.useForm<ScheduleFormValues>();
  const [filterForm] = Form.useForm<Partial<ClazzPageParams>>();
  const [rows, setRows] = useState<ClazzItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [scheduleCounts, setScheduleCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [editing, setEditing] = useState<ClazzItem>();
  const [scheduling, setScheduling] = useState<ClazzItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const userOptions = useMemo(
    () => users.map((item) => ({ label: `${item.nickname || item.username} (${item.id})`, value: item.id })),
    [users],
  );
  const campusOptions = useMemo(
    () => campuses.map((item) => ({ label: `${item.campusLocation} (${item.id})`, value: item.id })),
    [campuses],
  );
  const courseOptions = useMemo(
    () => courses.map((item) => ({ label: `${item.courseName} (${item.id})`, value: item.id })),
    [courses],
  );

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await clazzApi.page({ ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
      const schedulePairs = await Promise.all(
        data.records.map(async (item) => {
          const schedules = await clazzApi.listSchedules(item.id);
          return [item.id, schedules.length] as const;
        }),
      );
      setScheduleCounts(Object.fromEntries(schedulePairs));
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    const [userData, campusData, courseData] = await Promise.all([
      userApi.page({ pageNum: 1, pageSize: 1000, roleCode: 'HEAD_TEACHER' }),
      campusApi.page({ pageNum: 1, pageSize: 1000 }),
      courseApi.page({ pageNum: 1, pageSize: 1000 }),
    ]);
    setUsers(userData.records);
    setCampuses(campusData.records);
    setCourses(courseData.records);
  };

  useEffect(() => {
    void load(1, 10);
    void loadOptions();
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = async (record: ClazzItem) => {
    const detail = await clazzApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue(detail);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await clazzApi.update(editing.id, values);
      message.success('班级已更新');
    } else {
      await clazzApi.create(values);
      message.success('班级已创建');
    }
    setModalOpen(false);
    void load();
  };

  const remove = async (id: number) => {
    await clazzApi.remove(id);
    message.success('班级已删除');
    void load();
  };

  const openScheduleGenerate = (record: ClazzItem) => {
    setScheduling(record);
    scheduleForm.resetFields();
    setScheduleModalOpen(true);
  };

  const submitScheduleGenerate = async () => {
    if (!scheduling) {
      return;
    }
    const values = await scheduleForm.validateFields();
    setScheduleSubmitting(true);
    try {
      const result = await clazzApi.generateSchedule({
        classId: scheduling.id,
        firstClassDate: values.firstClassDate.format('YYYY-MM-DD'),
      });
      message.success(`课表已生成，共 ${result.scheduleCount} 条`);
      setScheduleModalOpen(false);
      void load();
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const columns: TableColumnsType<ClazzItem> = [
    { title: 'ID', dataIndex: 'id', width: 90 },
    { title: '班级期数', dataIndex: 'classPeriod' },
    {
      title: '班主任',
      dataIndex: 'headTeacherName',
      width: 160,
      render: (value: string, record) => value || record.headTeacherId,
    },
    {
      title: '校区',
      dataIndex: 'campusName',
      width: 180,
      render: (value: string, record) => value || record.campusId,
    },
    {
      title: '课程',
      dataIndex: 'courseName',
      width: 180,
      render: (value: string, record) => value || record.courseId,
    },
    {
      title: '操作',
      width: 260,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openScheduleGenerate(record)}>
            {scheduleCounts[record.id] > 0 ? '重新生成课表' : '生成课表'}
          </Button>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该班级？" onConfirm={() => remove(record.id)}>
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
          <Form.Item name="keyword">
            <Input allowClear placeholder="班级期数" />
          </Form.Item>
          <Form.Item name="headTeacherId">
            <Select allowClear showSearch placeholder="班主任" options={userOptions} style={{ width: 180 }} optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="campusId">
            <Select allowClear showSearch placeholder="校区" options={campusOptions} style={{ width: 180 }} optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="courseId">
            <Select allowClear showSearch placeholder="课程" options={courseOptions} style={{ width: 180 }} optionFilterProp="label" />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增班级
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

      <Modal title={editing ? '编辑班级' : '新增班级'} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="classPeriod" label="班级期数" rules={[{ required: true, message: '请输入班级期数' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="headTeacherId" label="班主任" rules={[{ required: true, message: '请选择班主任' }]}>
            <Select showSearch options={userOptions} optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="campusId" label="校区" rules={[{ required: true, message: '请选择校区' }]}>
            <Select showSearch options={campusOptions} optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="courseId" label="课程" rules={[{ required: true, message: '请选择课程' }]}>
            <Select showSearch options={courseOptions} optionFilterProp="label" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${scheduleCounts[scheduling?.id || 0] > 0 ? '重新生成课表' : '生成课表'}${scheduling ? ` - ${scheduling.classPeriod}` : ''}`}
        open={scheduleModalOpen}
        onOk={submitScheduleGenerate}
        confirmLoading={scheduleSubmitting}
        onCancel={() => setScheduleModalOpen(false)}
        destroyOnHidden
      >
        <Form form={scheduleForm} layout="vertical">
          <Form.Item name="firstClassDate" label="第一天上课时间" rules={[{ required: true, message: '请选择第一天上课时间' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
