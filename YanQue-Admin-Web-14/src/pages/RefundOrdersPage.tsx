import { Button, Form, Input, Select, Table, Tag } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { useEffect, useState } from 'react';
import { refundOrderApi } from '../api/system';
import type { RefundOrderItem, RefundOrderPageParams, RefundOrderStatus } from '../types/system';

const refundStatusOptions: Array<{ label: string; value: RefundOrderStatus; color: string }> = [
  { label: '初始化', value: 'INIT', color: 'default' },
  { label: '退款处理中', value: 'PROCESSING', color: 'blue' },
  { label: '退款成功', value: 'SUCCESS', color: 'green' },
  { label: '退款失败', value: 'FAIL', color: 'red' },
  { label: '已关闭', value: 'CLOSED', color: 'orange' },
];

const getStatusMeta = (status: RefundOrderStatus) => refundStatusOptions.find((item) => item.value === status);

const formatMoney = (value?: number) => `¥${Number(value || 0).toFixed(2)}`;

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 19);
};

export default function RefundOrdersPage() {
  const [filterForm] = Form.useForm<Partial<RefundOrderPageParams>>();
  const [rows, setRows] = useState<RefundOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await refundOrderApi.page({ ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, 10);
  }, []);

  const columns: TableColumnsType<RefundOrderItem> = [
    { title: '退款订单号', dataIndex: 'refundOrderNo', width: 220 },
    { title: '支付订单号', dataIndex: 'paymentOrderNo', width: 220 },
    {
      title: '支付金额',
      dataIndex: 'paymentAmount',
      width: 120,
      render: (value?: number) => formatMoney(value),
    },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      width: 120,
      render: (value?: number) => formatMoney(value),
    },
    {
      title: '退款状态',
      dataIndex: 'status',
      width: 130,
      render: (value: RefundOrderStatus) => {
        const meta = getStatusMeta(value);
        return <Tag color={meta?.color}>{meta?.label || value}</Tag>;
      },
    },
    {
      title: '退款原因',
      dataIndex: 'reason',
      width: 220,
      render: (value?: string) => value || '-',
    },
    {
      title: '易宝退款流水号',
      dataIndex: 'uniqueRefundNo',
      width: 220,
      render: (value?: string) => value || '-',
    },
    {
      title: '失败原因',
      dataIndex: 'failReason',
      width: 220,
      render: (value?: string) => value || '-',
    },
    {
      title: '退款成功时间',
      dataIndex: 'refundSuccessTime',
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
  ];

  return (
    <div className="page-panel">
      <div className="table-toolbar">
        <Form form={filterForm} layout="inline" className="filter-row">
          <Form.Item name="refundOrderNo">
            <Input allowClear placeholder="退款订单号" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="paymentOrderNo">
            <Input allowClear placeholder="支付订单号" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select allowClear placeholder="退款状态" options={refundStatusOptions} style={{ width: 150 }} />
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
    </div>
  );
}
