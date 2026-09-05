import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useState } from 'react';
import { permissionApi } from '../api/system';
import type { PermissionItem, PermissionPageParams, PermissionValues } from '../types/system';

const statusOptions = [
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'INACTIVE', value: 'INACTIVE' },
];

const permissionTypeOptions = [
  { label: 'MENU', value: 'MENU' },
  { label: 'API', value: 'API' },
  { label: 'BUTTON', value: 'BUTTON' },
];

interface PermissionTreeItem extends PermissionItem {
  children?: PermissionTreeItem[];
}

const buildPermissionTree = (items: PermissionItem[]): PermissionTreeItem[] => {
  const nodeMap = new Map<number, PermissionTreeItem>();
  const roots: PermissionTreeItem[] = [];

  items.forEach((item) => {
    nodeMap.set(item.id, { ...item, children: [] });
  });

  nodeMap.forEach((node) => {
    const parent = node.parentId ? nodeMap.get(node.parentId) : undefined;
    if (parent) {
      parent.children?.push(node);
    } else {
      roots.push(node);
    }
  });

  nodeMap.forEach((node) => {
    if (node.children?.length === 0) {
      delete node.children;
    }
  });

  return roots;
};

export default function PermissionsPage() {
  const [form] = Form.useForm<PermissionValues>();
  const [filterForm] = Form.useForm<Partial<PermissionPageParams>>();
  const [rows, setRows] = useState<PermissionTreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<PermissionItem>();
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await permissionApi.page({ ...values, pageNum: 1, pageSize: 1000 });
      setRows(buildPermissionTree(data.records));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue({ parentId: 0, permissionType: 'MENU', status: 'ACTIVE' });
    setModalOpen(true);
  };

  const openEdit = async (record: PermissionItem) => {
    const detail = await permissionApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue(detail);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await permissionApi.update(editing.id, values);
      message.success('权限已更新');
    } else {
      await permissionApi.create(values);
      message.success('权限已创建');
    }
    setModalOpen(false);
    void load();
  };

  const remove = async (id: number) => {
    await permissionApi.remove(id);
    message.success('权限已删除');
    void load();
  };

  const columns: TableColumnsType<PermissionTreeItem> = [
    { title: '权限名称', dataIndex: 'permissionName', width: 220 },
    { title: '权限编码', dataIndex: 'permissionCode', width: 220 },
    { title: '类型', dataIndex: 'permissionType', width: 100 },
    { title: 'API路径', dataIndex: 'apiPath' },
    { title: '排序', dataIndex: 'sortNum', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value: string) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该权限？" onConfirm={() => remove(record.id)}>
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
            <Input allowClear placeholder="编码/名称/API路径" />
          </Form.Item>
          <Form.Item name="permissionType">
            <Select allowClear placeholder="类型" options={permissionTypeOptions} style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select allowClear placeholder="状态" options={statusOptions} style={{ width: 140 }} />
          </Form.Item>
          <Button type="primary" onClick={() => load()}>
            查询
          </Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增权限
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={false}
        expandable={{ defaultExpandAllRows: true }}
      />

      <Modal title={editing ? '编辑权限' : '新增权限'} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="parentId" label="父级ID" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="permissionCode" label="权限编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="permissionName" label="权限名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="permissionType" label="权限类型" rules={[{ required: true }]}>
            <Select options={permissionTypeOptions} />
          </Form.Item>
          <Form.Item name="apiPath" label="API路径">
            <Input />
          </Form.Item>
          <Form.Item name="sortNum" label="排序">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
