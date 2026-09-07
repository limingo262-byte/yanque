import { Alert, Button, DatePicker, Empty, Form, Input, InputNumber, Select, Space, Spin, Tag, Typography, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useState } from 'react';
import { opsLogApi } from '../api/system';
import type { SlsLogQueryResult } from '../types/system';

const { RangePicker } = DatePicker;

const serviceOptions = [
  { value: '', label: '全部服务' },
  { value: 'yanque-admin', label: 'yanque-admin' },
  { value: 'yanque-ai', label: 'yanque-ai' },
  { value: 'bear-mcp', label: 'bear-mcp' },
];

const formatTimestamp = (seconds: number) => dayjs.unix(seconds).format('YYYY-MM-DD HH:mm:ss');

export default function OpsLogsPage() {
  const [form] = Form.useForm();
  const [result, setResult] = useState<SlsLogQueryResult>();
  const [loading, setLoading] = useState(false);

  async function submit(values: { range: [Dayjs, Dayjs]; keyword?: string; query?: string; service?: string; line?: number }) {
    if (!values.range?.[0] || !values.range?.[1]) {
      message.warning('请选择日志时间范围');
      return;
    }
    setLoading(true);
    try {
      const data = await opsLogApi.query({
        fromTime: values.range[0].unix(),
        toTime: values.range[1].unix(),
        keyword: values.keyword?.trim(),
        query: values.query?.trim(),
        service: values.service || undefined,
        line: values.line || 100,
      });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  function usePreset(keyword: string) {
    form.setFieldsValue({ keyword, query: undefined });
    void form.submit();
  }

  return (
    <div className="ops-logs-page">
      <section className="ops-logs-hero">
        <div>
          <div className="ops-logs-kicker">运维中心</div>
          <h2>服务日志</h2>
          <p>查询 Docker stdout 经 Logtail 采集到阿里云 SLS 的应用日志。</p>
        </div>
        {result ? (
          <div className="ops-logs-stats">
            <Stat label="返回条数" value={String(result.returnedCount)} />
            <Stat label="耗时" value={`${result.elapsedMs} ms`} />
            <Stat label="查询类型" value={result.analysisQuery ? 'SQL 分析' : '纯查询'} />
          </div>
        ) : null}
      </section>

      <section className="ops-logs-filter">
        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          initialValues={{ range: [dayjs().subtract(1, 'hour'), dayjs()], line: 100, service: '' }}
        >
          <div className="ops-logs-filter-grid">
            <Form.Item name="service" label="服务">
              <Select options={serviceOptions} />
            </Form.Item>
            <Form.Item name="range" label="时间范围" rules={[{ required: true, message: '请选择时间范围' }]}>
              <RangePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="line" label="最多返回条数">
              <InputNumber min={1} max={500} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div className="ops-logs-query-grid">
            <Form.Item name="keyword" label="关键词">
              <Input placeholder="例如：error、timeout、登录失败" allowClear />
            </Form.Item>
            <Form.Item name="query" label="SLS 查询语句（可选）">
              <Input.TextArea rows={2} placeholder="纯查询或 SQL 分析，例如：level:error | select count(*) as total" />
            </Form.Item>
          </div>
          <Space wrap>
            <Button type="primary" htmlType="submit" loading={loading}>查询日志</Button>
            <Button onClick={() => usePreset('error')}>错误日志</Button>
            <Button onClick={() => usePreset('timeout')}>超时日志</Button>
          </Space>
        </Form>
      </section>

      <section className="ops-logs-result">
        <div className="ops-logs-result-head">
          <Typography.Title level={4}>查询结果</Typography.Title>
          {result ? <Tag color={result.completed ? 'green' : 'orange'}>{result.completed ? '结果完整' : '结果可能不完整'}</Tag> : null}
        </div>
        <Spin spinning={loading}>
          {!result ? <Empty description="提交查询后显示日志" /> : result.records.length === 0 ? <Empty description="当前条件没有日志" /> : (
            <div className="ops-log-list">
              {result.records.map((record, index) => <LogRow key={`${record.timestamp}-${index}`} record={record} />)}
            </div>
          )}
        </Spin>
        {result && !result.completed ? <Alert type="warning" showIcon message="SLS 返回结果未标记为完整，已按上限重试，请缩小时间范围或增加筛选条件。" /> : null}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="ops-logs-stat"><span>{label}</span><strong>{value}</strong></div>;
}

function LogRow({ record }: { record: SlsLogQueryResult['records'][number] }) {
  const content = record.fields.log || record.fields.message || record.fields.content || JSON.stringify(record.fields);
  return (
    <article className="ops-log-row">
      <div className="ops-log-meta"><span>{formatTimestamp(record.timestamp)}</span><span>{record.source || '-'}</span></div>
      <pre>{content}</pre>
      <details><summary>查看字段</summary><pre>{JSON.stringify(record.fields, null, 2)}</pre></details>
    </article>
  );
}
