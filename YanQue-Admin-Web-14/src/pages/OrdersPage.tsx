import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { useEffect, useState } from 'react';
import { paymentOrderApi, refundOrderApi } from '../api/system';
import type { PaymentOrderItem, PaymentOrderPageParams, PaymentOrderStatus, RefundOrderApplyValues } from '../types/system';

const orderStatusOptions: Array<{ label: string; value: PaymentOrderStatus; color: string }> = [
  { label: '初始化', value: 'INIT', color: 'default' },
  { label: '失败', value: 'FAIL', color: 'red' },
  { label: '支付中', value: 'PROCESSING', color: 'blue' },
  { label: '支付成功', value: 'SUCCESS', color: 'green' },
  { label: '超时', value: 'TIMEOUT', color: 'orange' },
];

const getStatusMeta = (status: PaymentOrderStatus) => orderStatusOptions.find((item) => item.value === status);

const formatMoney = (value?: number) => `¥${Number(value || 0).toFixed(2)}`;

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 19);
};

export default function OrdersPage() {
  const [filterForm] = Form.useForm<Partial<PaymentOrderPageParams>>();
  const [refundForm] = Form.useForm<RefundOrderApplyValues>();
  const [rows, setRows] = useState<PaymentOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundingOrder, setRefundingOrder] = useState<PaymentOrderItem>();
  const [refundOrderNo, setRefundOrderNo] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await paymentOrderApi.page({ ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, 10);
  }, []);

  const getRefundedAmount = (record?: PaymentOrderItem) => Number(record?.refundedAmount || 0);

  const getRefundableAmount = (record?: PaymentOrderItem) => Math.max(Number(record?.orderAmount || 0) - getRefundedAmount(record), 0);

  const openRefund = async (record: PaymentOrderItem) => {
    setRefundLoading(true);
    setRefundingOrder(record);
    refundForm.resetFields();
    try {
      const data = await refundOrderApi.create();
      setRefundOrderNo(data.refundOrderNo);
      refundForm.setFieldsValue({ paymentOrderNo: record.orderNo });
      setRefundModalOpen(true);
    } finally {
      setRefundLoading(false);
    }
  };

  const submitRefund = async () => {
    if (!refundingOrder || !refundOrderNo) {
      return;
    }
    const values = await refundForm.validateFields();
    setSubmittingRefund(true);
    try {
      await refundOrderApi.apply(refundOrderNo, values);
      message.success('退款申请已提交');
      setRefundModalOpen(false);
      setRefundingOrder(undefined);
      setRefundOrderNo('');
      await load(pagination.current, pagination.pageSize);
    } finally {
      setSubmittingRefund(false);
    }
  };

  const columns: TableColumnsType<PaymentOrderItem> = [
    { title: '支付订单号', dataIndex: 'orderNo', width: 220 },
    { title: '学生姓名', dataIndex: 'studentName', width: 120 },
    { title: '手机号', dataIndex: 'studentPhone', width: 140 },
    {
      title: '产品内容',
      dataIndex: 'productContent',
      width: 220,
      render: (value: string | undefined, record) => value || `产品ID ${record.productId}`,
    },
    {
      title: '订单金额',
      dataIndex: 'orderAmount',
      width: 120,
      render: (value: number) => formatMoney(value),
    },
    {
      title: '已申请退款',
      dataIndex: 'refundedAmount',
      width: 130,
      render: (value?: number) => formatMoney(value),
    },
    { title: '预支付订单号', dataIndex: 'prepayOrderNo', width: 220 },
    {
      title: '订单状态',
      dataIndex: 'status',
      width: 120,
      render: (value: PaymentOrderStatus) => {
        const meta = getStatusMeta(value);
        return <Tag color={meta?.color}>{meta?.label || value}</Tag>;
      },
    },
    {
      title: '支付渠道单号',
      dataIndex: 'uniqueOrderNo',
      width: 220,
      render: (value?: string) => value || '-',
    },
    {
      title: '支付成功时间',
      dataIndex: 'paySuccessTime',
      width: 170,
      render: (value?: string) => formatDateTime(value),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (value?: string) => formatDateTime(value),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: (value?: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => {
        const refundableAmount = getRefundableAmount(record);
        const disabled = record.status !== 'SUCCESS' || refundableAmount <= 0;
        return (
          <Space>
            <Button type="link" disabled={disabled} loading={refundLoading && refundingOrder?.id === record.id} onClick={() => openRefund(record)}>
              退款
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page-panel">
      <div className="table-toolbar">
        <Form form={filterForm} layout="inline" className="filter-row">
          <Form.Item name="orderNo">
            <Input allowClear placeholder="支付订单号" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="studentName">
            <Input allowClear placeholder="学生姓名" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="studentPhone">
            <Input allowClear placeholder="手机号" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="prepayOrderNo">
            <Input allowClear placeholder="预支付订单号" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select allowClear placeholder="订单状态" options={orderStatusOptions} style={{ width: 140 }} />
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
        scroll={{ x: 1900 }}
        onChange={(page: TablePaginationConfig) => load(page.current || 1, page.pageSize || 10)}
      />

      <Modal
        title="申请退款"
        open={refundModalOpen}
        onCancel={() => setRefundModalOpen(false)}
        onOk={submitRefund}
        confirmLoading={submittingRefund}
        destroyOnClose
      >
        <Form form={refundForm} layout="vertical">
          <Form.Item label="支付订单号" name="paymentOrderNo">
            <Input disabled />
          </Form.Item>
          <Form.Item label="退款订单号">
            <Input value={refundOrderNo} disabled />
          </Form.Item>
          <Space size={24} style={{ marginBottom: 12 }}>
            <span>订单金额：{formatMoney(refundingOrder?.orderAmount)}</span>
            <span>已申请退款：{formatMoney(refundingOrder?.refundedAmount)}</span>
            <span>可退金额：{formatMoney(getRefundableAmount(refundingOrder))}</span>
          </Space>
          <Form.Item
            name="refundAmount"
            label="退款金额"
            rules={[
              { required: true, message: '请输入退款金额' },
              {
                validator: (_, value) => {
                  if (!value || Number(value) <= 0) {
                    return Promise.reject(new Error('退款金额必须大于0'));
                  }
                  if (Number(value) > getRefundableAmount(refundingOrder)) {
                    return Promise.reject(new Error('退款金额不能超过可退金额'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber min={0.01} max={getRefundableAmount(refundingOrder)} precision={2} style={{ width: '100%' }} placeholder="请输入退款金额" />
          </Form.Item>
          <Form.Item name="reason" label="退款原因" rules={[{ max: 200, message: '退款原因不能超过200个字符' }]}>
            <Input.TextArea rows={3} placeholder="请输入退款原因" maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
