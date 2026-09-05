import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, TreeSelect, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { useEffect, useState } from 'react';
import { permissionApi, roleApi } from '../api/system';
import type { PermissionItem, RoleItem, RolePageParams, RoleValues } from '../types/system';

const statusOptions = [
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'INACTIVE', value: 'INACTIVE' },
];

interface PermissionTreeNode {
  title: string;
  value: number;
  children?: PermissionTreeNode[];
}

const buildPermissionTree = (items: PermissionItem[]): PermissionTreeNode[] => {
  const nodeMap = new Map<number, PermissionTreeNode & { parentId: number }>();
  const roots: PermissionTreeNode[] = [];

  items.forEach((item) => {
    nodeMap.set(item.id, {
      title: `${item.permissionName} (${item.permissionCode})`,
      value: item.id,
      parentId: item.parentId,
      children: [],
    });
  });

  nodeMap.forEach((node) => {
    const parent = node.parentId ? nodeMap.get(node.parentId) : undefined;
    const treeNode: PermissionTreeNode = {
      title: node.title,
      value: node.value,
      children: node.children,
    };
    if (parent) {
      parent.children?.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  });

  const removeEmptyChildren = (nodes: PermissionTreeNode[]) => {
    nodes.forEach((node) => {
      if (node.children?.length) {
        removeEmptyChildren(node.children);
      } else {
        delete node.children;
      }
    });
  };
  removeEmptyChildren(roots);

  return roots;
};

export default function RolesPage() {
  const [form] = Form.useForm<RoleValues>();
  const [filterForm] = Form.useForm<Partial<RolePageParams>>();
  const [assignForm] = Form.useForm<{ permissionIds: number[] }>();
  const [rows, setRows] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<RoleItem>();
  const [assigning, setAssigning] = useState<RoleItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const permissionTreeData = buildPermissionTree(permissions);

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await roleApi.page({ ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    const data = await permissionApi.page({ pageNum: 1, pageSize: 1000 });
    setPermissions(data.records);
  };

  useEffect(() => {
    void load();
    void loadPermissions();
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldValue('status', 'ACTIVE');
    setModalOpen(true);
  };

  const openEdit = async (record: RoleItem) => {
    const detail = await roleApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue(detail);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await roleApi.update(editing.id, values);
      message.success('角色已更新');
    } else {
      await roleApi.create(values);
      message.success('角色已创建');
    }
    setModalOpen(false);
    void load();
  };

  const remove = async (id: number) => {
    await roleApi.remove(id);
    message.success('角色已删除');
    void load();
  };

  const openAssign = async (record: RoleItem) => {
    const detail = await roleApi.detail(record.id);
    setAssigning(detail);
    assignForm.setFieldsValue({ permissionIds: detail.permissionIds || [] });
    setAssignOpen(true);
  };

  const submitAssign = async () => {
    const values = await assignForm.validateFields();
    if (!assigning) return;
    await roleApi.assignPermissions(assigning.id, values.permissionIds);
    message.success('权限已分配');
    setAssignOpen(false);
  };

  const columns: TableColumnsType<RoleItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '角色编码', dataIndex: 'roleCode' },
    { title: '角色名称', dataIndex: 'roleName' },
    { title: '描述', dataIndex: 'description' },
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
            分配权限
          </Button>
          <Popconfirm title="确认删除该角色？" onConfirm={() => remove(record.id)}>
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
            <Input allowClear placeholder="角色编码/角色名称" />
          </Form.Item>
          <Form.Item name="status">
            <Select allowClear placeholder="状态" options={statusOptions} style={{ width: 140 }} />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增角色
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

      <Modal title={editing ? '编辑角色' : '新增角色'} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="roleCode" label="角色编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="roleName" label="角色名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="permissionIds" label="权限">
            <TreeSelect
              treeData={permissionTreeData}
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              placeholder="请选择权限"
              treeDefaultExpandAll
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="分配权限" open={assignOpen} onOk={submitAssign} onCancel={() => setAssignOpen(false)} destroyOnHidden>
        <Form form={assignForm} layout="vertical">
          <Form.Item name="permissionIds" label="权限" rules={[{ required: true, type: 'array' }]}>
            <TreeSelect
              treeData={permissionTreeData}
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              placeholder="请选择权限"
              treeDefaultExpandAll
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
