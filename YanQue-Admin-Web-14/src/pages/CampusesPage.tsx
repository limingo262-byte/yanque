import { Button, Form, Input, Modal, Popconfirm, Space, Table, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { useEffect, useState } from 'react';
import { campusApi } from '../api/system';
import type { CampusItem, CampusPageParams, CampusValues } from '../types/system';

export default function CampusesPage() {
  const [form] = Form.useForm<CampusValues>();
  const [filterForm] = Form.useForm<Partial<CampusPageParams>>();
  const [rows, setRows] = useState<CampusItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<CampusItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await campusApi.page({ ...values, pageNum, pageSize });
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

  const openEdit = async (record: CampusItem) => {
    const detail = await campusApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue(detail);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await campusApi.update(editing.id, values);
      message.success('校区已更新');
    } else {
      await campusApi.create(values);
      message.success('校区已创建');
    }
    setModalOpen(false);
    void load();
  };

  const remove = async (id: number) => {
    await campusApi.remove(id);
    message.success('校区已删除');
    void load();
  };

  const columns: TableColumnsType<CampusItem> = [
    { title: 'ID', dataIndex: 'id', width: 90 },
    { title: '校区地点', dataIndex: 'campusLocation' },
    { title: '负责人', dataIndex: 'managerName', width: 180 },
    { title: '负责人电话', dataIndex: 'managerPhone', width: 180 },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该校区？" onConfirm={() => remove(record.id)}>
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
            <Input allowClear placeholder="校区地点/负责人/电话" />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增校区
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

      <Modal title={editing ? '编辑校区' : '新增校区'} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="campusLocation" label="校区地点" rules={[{ required: true, message: '请输入校区地点' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="managerName" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="managerPhone"
            label="负责人电话"
            rules={[
              { required: true, message: '请输入负责人电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
