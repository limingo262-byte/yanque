import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { useEffect, useState } from 'react';
import { prepayOrderApi, productApi } from '../api/system';
import type { PrepayOrderItem, PrepayOrderPageParams, PrepayOrderStatus, PrepayOrderValues, ProductItem } from '../types/system';

const orderStatusOptions: Array<{ label: string; value: PrepayOrderStatus; color: string }> = [
  { label: '待支付', value: 'PENDING_PAYMENT', color: 'orange' },
  { label: '已支付', value: 'PAID', color: 'green' },
  { label: '已取消', value: 'CANCELED', color: 'default' },
];

const getStatusMeta = (status: PrepayOrderStatus) => orderStatusOptions.find((item) => item.value === status);

const teachingModeText: Record<string, string> = {
  ONLINE: '线上',
  OFFLINE: '线下',
};

export default function PrepayOrdersPage() {
  const [form] = Form.useForm<PrepayOrderValues>();
  const [filterForm] = Form.useForm<Partial<PrepayOrderPageParams>>();
  const [rows, setRows] = useState<PrepayOrderItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [editing, setEditing] = useState<PrepayOrderItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await prepayOrderApi.page({ ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    setProductLoading(true);
    try {
      const data = await productApi.page({ pageNum: 1, pageSize: 1000 });
      setProducts(data.records);
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    void load(1, 10);
    void loadProducts();
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue({ discountAmount: 0, orderStatus: 'PENDING_PAYMENT' } as PrepayOrderValues);
    setModalOpen(true);
  };

  const openEdit = async (record: PrepayOrderItem) => {
    const detail = await prepayOrderApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue(detail);
    setModalOpen(true);
  };

  const handleProductChange = (productId: number) => {
    const product = products.find((item) => item.id === productId);
    if (product) {
      form.setFieldsValue({ productAmount: product.price });
    }
  };

  const productOptions = products.map((product) => ({
    label: `#${product.id} ${product.courseContent} / ${teachingModeText[product.teachingMode] || product.teachingMode} / ¥${Number(product.price || 0).toFixed(2)}`,
    value: product.id,
  }));

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await prepayOrderApi.update(editing.id, values);
      message.success('预支付订单已更新');
    } else {
      await prepayOrderApi.create(values);
      message.success('预支付订单已创建');
    }
    setModalOpen(false);
    void load();
  };

  const remove = async (id: number) => {
    await prepayOrderApi.remove(id);
    message.success('预支付订单已删除');
    void load();
  };

  const columns: TableColumnsType<PrepayOrderItem> = [
    { title: '订单号', dataIndex: 'orderNo', width: 220 },
    { title: '学生姓名', dataIndex: 'studentName', width: 140 },
    { title: '手机号', dataIndex: 'studentPhone', width: 150 },
    { title: '产品ID', dataIndex: 'productId', width: 110 },
    {
      title: '产品金额',
      dataIndex: 'productAmount',
      width: 140,
      render: (value: number) => `¥${Number(value || 0).toFixed(2)}`,
    },
    {
      title: '优惠金额',
      dataIndex: 'discountAmount',
      width: 140,
      render: (value: number) => `¥${Number(value || 0).toFixed(2)}`,
    },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      width: 120,
      render: (value: PrepayOrderStatus) => {
        const meta = getStatusMeta(value);
        return <Tag color={meta?.color}>{meta?.label || value}</Tag>;
      },
    },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该预支付订单？" onConfirm={() => remove(record.id)}>
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
            <Input allowClear placeholder="学生姓名/手机号" />
          </Form.Item>
          <Form.Item name="orderStatus">
            <Select allowClear placeholder="订单状态" options={orderStatusOptions} style={{ width: 140 }} />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增预支付订单
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
        title={editing ? '编辑预支付订单' : '新增预支付订单'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="studentName" label="学生姓名" rules={[{ required: true, message: '请输入学生姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="studentPhone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="productId" label="产品" rules={[{ required: true, message: '请选择产品' }]}>
            <Select
              showSearch
              loading={productLoading}
              options={productOptions}
              optionFilterProp="label"
              placeholder="请选择产品"
              onChange={handleProductChange}
            />
          </Form.Item>
          <Form.Item name="productAmount" label="产品金额" rules={[{ required: true, message: '请输入产品金额' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="discountAmount" label="优惠金额" rules={[{ required: true, message: '请输入优惠金额' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="orderStatus" label="订单状态" rules={[{ required: true, message: '请选择订单状态' }]}>
            <Select options={orderStatusOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
