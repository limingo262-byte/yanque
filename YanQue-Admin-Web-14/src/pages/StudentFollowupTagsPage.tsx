import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { studentFollowupTagApi, studentManageApi } from '../api/system';
import type { ActiveStatus, StudentFollowupTagItem, StudentFollowupTagPageParams, StudentFollowupTagValues } from '../types/system';

const statusOptions: Array<{ label: string; value: ActiveStatus }> = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
];

export default function StudentFollowupTagsPage() {
  const [form] = Form.useForm<StudentFollowupTagValues>();
  const [filterForm] = Form.useForm<Partial<StudentFollowupTagPageParams>>();
  const [rows, setRows] = useState<StudentFollowupTagItem[]>([]);
  const [studentTags, setStudentTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<StudentFollowupTagItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const studentTagOptions = useMemo(() => studentTags.map((item) => ({ label: item, value: item })), [studentTags]);

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await studentFollowupTagApi.page({ ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentTags = async () => {
    const data = await studentManageApi.tagOptions();
    setStudentTags(data);
  };

  useEffect(() => {
    void load(1, 10);
    void loadStudentTags();
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue({ status: 'ACTIVE', followupIntervalDays: 7 });
    setModalOpen(true);
  };

  const openEdit = async (record: StudentFollowupTagItem) => {
    const detail = await studentFollowupTagApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue(detail);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await studentFollowupTagApi.update(editing.id, values);
      message.success('回访标签配置已更新');
    } else {
      await studentFollowupTagApi.create(values);
      message.success('回访标签配置已创建');
    }
    setModalOpen(false);
    void load();
  };

  const remove = async (id: number) => {
    await studentFollowupTagApi.remove(id);
    message.success('回访标签配置已删除');
    void load();
  };

  const columns: TableColumnsType<StudentFollowupTagItem> = [
    { title: 'ID', dataIndex: 'id', width: 90 },
    { title: '学生标签', dataIndex: 'studentTag', width: 180 },
    {
      title: '回访间隔',
      dataIndex: 'followupIntervalDays',
      width: 140,
      render: (value: number) => `${value}天`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: ActiveStatus) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>{value === 'ACTIVE' ? '启用' : '停用'}</Tag>,
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该回访标签配置？" onConfirm={() => remove(record.id)}>
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
          <Form.Item name="studentTag">
            <Select allowClear placeholder="学生标签" options={studentTagOptions} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select allowClear placeholder="状态" options={statusOptions} style={{ width: 120 }} />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增回访标签
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
        title={editing ? '编辑回访标签' : '新增回访标签'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="studentTag" label="学生标签" rules={[{ required: true, message: '请选择学生标签' }]}>
            <Select placeholder="请选择学生标签" options={studentTagOptions} />
          </Form.Item>
          <Form.Item name="followupIntervalDays" label="回访间隔天数" rules={[{ required: true, message: '请输入回访间隔天数' }]}>
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
