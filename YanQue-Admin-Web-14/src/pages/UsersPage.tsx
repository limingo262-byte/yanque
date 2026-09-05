import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { useEffect, useState } from 'react';
import { roleApi, userApi } from '../api/system';
import type { RoleItem, UserCreateValues, UserItem, UserPageParams, UserUpdateValues } from '../types/system';

const statusOptions = [
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'INACTIVE', value: 'INACTIVE' },
];

export default function UsersPage() {
  const [form] = Form.useForm<UserCreateValues & UserUpdateValues>();
  const [filterForm] = Form.useForm<Partial<UserPageParams>>();
  const [assignForm] = Form.useForm<{ roleIds: number[] }>();
  const [rows, setRows] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<UserItem>();
  const [assigning, setAssigning] = useState<UserItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await userApi.page({ ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    const data = await roleApi.page({ pageNum: 1, pageSize: 1000 });
    setRoles(data.records);
  };

  useEffect(() => {
    void load();
    void loadRoles();
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldValue('status', 'ACTIVE');
    setModalOpen(true);
  };

  const openEdit = async (record: UserItem) => {
    const detail = await userApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue(detail);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await userApi.update(editing.id, values);
      message.success('用户已更新');
    } else {
      await userApi.create(values as UserCreateValues);
      message.success('用户已创建');
    }
    setModalOpen(false);
    void load();
  };

  const remove = async (id: number) => {
    await userApi.remove(id);
    message.success('用户已删除');
    void load();
  };

  const openAssign = async (record: UserItem) => {
    const detail = await userApi.detail(record.id);
    setAssigning(detail);
    assignForm.setFieldsValue({ roleIds: detail.roleIds || [] });
    setAssignOpen(true);
  };

  const submitAssign = async () => {
    const values = await assignForm.validateFields();
    if (!assigning) return;
    await userApi.assignRoles(assigning.id, values.roleIds);
    message.success('角色已分配');
    setAssignOpen(false);
  };

  const columns: TableColumnsType<UserItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username' },
    { title: '昵称', dataIndex: 'nickname' },
    { title: '真实姓名', dataIndex: 'realName' },
    { title: '手机号', dataIndex: 'phone' },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value: string) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: '操作',
      width: 240,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" onClick={() => openAssign(record)}>
            分配角色
          </Button>
          <Popconfirm title="确认删除该用户？" onConfirm={() => remove(record.id)}>
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
            <Input allowClear placeholder="用户名/昵称/真实姓名" />
          </Form.Item>
          <Form.Item name="status">
            <Select allowClear placeholder="状态" options={statusOptions} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="roleCode">
            <Input allowClear placeholder="角色编码" />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增用户
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

      <Modal title={editing ? '编辑用户' : '新增用户'} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)} destroyOnHidden>
        <Form form={form} layout="vertical">
          {!editing && (
            <>
              <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="密码" rules={[{ required: true }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}
          <Form.Item name="nickname" label="昵称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="realName" label="真实姓名">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          {editing && (
            <Form.Item name="unionId" label="飞书 union_id">
              <Input />
            </Form.Item>
          )}
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="分配角色" open={assignOpen} onOk={submitAssign} onCancel={() => setAssignOpen(false)} destroyOnHidden>
        <Form form={assignForm} layout="vertical">
          <Form.Item name="roleIds" label="角色" rules={[{ required: true, type: 'array' }]}>
            <Select
              mode="multiple"
              options={roles.map((item) => ({ label: `${item.roleName} (${item.roleCode})`, value: item.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
