import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { useEffect, useState } from 'react';
import { productApi } from '../api/system';
import type { ProductItem, ProductPageParams, ProductValues } from '../types/system';

const teachingModeOptions = [
  { label: '线上', value: 'ONLINE' },
  { label: '线下', value: 'OFFLINE' },
];

export default function ProductsPage() {
  const [form] = Form.useForm<ProductValues>();
  const [filterForm] = Form.useForm<Partial<ProductPageParams>>();
  const [rows, setRows] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ProductItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await productApi.page({ ...values, pageNum, pageSize });
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

  const openEdit = async (record: ProductItem) => {
    const detail = await productApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue(detail);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await productApi.update(editing.id, values);
      message.success('产品已更新');
    } else {
      await productApi.create(values);
      message.success('产品已创建');
    }
    setModalOpen(false);
    void load();
  };

  const remove = async (id: number) => {
    await productApi.remove(id);
    message.success('产品已删除');
    void load();
  };

  const columns: TableColumnsType<ProductItem> = [
    { title: '产品ID', dataIndex: 'id', width: 110 },
    { title: '课程内容', dataIndex: 'courseContent' },
    {
      title: '上课方式',
      dataIndex: 'teachingMode',
      width: 120,
      render: (value: string) => teachingModeOptions.find((item) => item.value === value)?.label || value,
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 160,
      render: (value: number) => `¥${Number(value || 0).toFixed(2)}`,
    },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该产品？" onConfirm={() => remove(record.id)}>
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
            <Input allowClear placeholder="课程内容" />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增产品
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

      <Modal title={editing ? '编辑产品' : '新增产品'} open={modalOpen} onOk={submit} onCancel={() => setModalOpen(false)} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="courseContent" label="课程内容" rules={[{ required: true, message: '请输入课程内容' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="teachingMode" label="上课方式" rules={[{ required: true, message: '请选择上课方式' }]}>
            <Select options={teachingModeOptions} />
          </Form.Item>
          <Form.Item name="price" label="价格" rules={[{ required: true, message: '请输入价格' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
