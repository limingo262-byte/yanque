import { Button, Form, Input, Modal, Popconfirm, Space, Table, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useState } from 'react';
import { sysConfigApi } from '../api/system';
import type { SysConfigItem, SysConfigPageParams, SysConfigValues } from '../types/system';

export default function SysConfigsPage() {
  const [form] = Form.useForm<SysConfigValues>();
  const [filterForm] = Form.useForm<Partial<SysConfigPageParams>>();
  const [rows, setRows] = useState<SysConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<SysConfigItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await sysConfigApi.page({ ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, 10);
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = async (record: SysConfigItem) => {
    const detail = await sysConfigApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue(detail);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await sysConfigApi.update(editing.id, values);
      message.success('配置已更新');
    } else {
      await sysConfigApi.create(values);
      message.success('配置已创建');
    }
    setModalOpen(false);
    void load();
  };

  const remove = async (id: number) => {
    await sysConfigApi.remove(id);
    message.success('配置已删除');
    void load();
  };

  const columns: TableColumnsType<SysConfigItem> = [
    { title: 'ID', dataIndex: 'id', width: 90 },
    { title: '配置键', dataIndex: 'k', width: 260 },
    { title: '配置值', dataIndex: 'v', ellipsis: true },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该配置？" onConfirm={() => remove(record.id)}>
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
            <Input allowClear placeholder="配置键/配置值" />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增配置
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => load(page, pageSize),
        }}
      />

      <Modal title={editing ? '编辑配置' : '新增配置'} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="k" label="配置键" rules={[{ required: true, message: '请输入配置键' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="v" label="配置值" rules={[{ required: true, message: '请输入配置值' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
