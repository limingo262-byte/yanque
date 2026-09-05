import { AutoComplete, Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { promptTemplateApi } from '../api/system';
import type {
  ActiveStatus,
  PromptTemplateCreateValues,
  PromptTemplateItem,
  PromptTemplatePageParams,
  PromptTemplateScene,
  PromptTemplateType,
} from '../types/system';

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '禁用', value: 'INACTIVE' },
];

const promptTypeOptions = [
  { label: 'SYSTEM', value: 'SYSTEM' },
  { label: 'USER', value: 'USER' },
];

const sceneOptions = [
  { label: 'CHAT', value: 'CHAT' },
  { label: 'RAG', value: 'RAG' },
  { label: 'SUMMARY', value: 'SUMMARY' },
  { label: 'JUDGE', value: 'JUDGE' },
  { label: 'STRUCTURED_EXTRACT', value: 'STRUCTURED_EXTRACT' },
];

const agentOptions = [
  { label: 'student_chat_agent', value: 'student_chat_agent' },
  { label: 'knowledge_qa_agent', value: 'knowledge_qa_agent' },
  { label: 'summary_agent', value: 'summary_agent' },
  { label: 'structured_extract_agent', value: 'structured_extract_agent' },
  { label: 'judge_agent', value: 'judge_agent' },
];

const statusText: Record<ActiveStatus, string> = {
  ACTIVE: '启用',
  INACTIVE: '禁用',
};

const sceneColor: Record<PromptTemplateScene, string> = {
  CHAT: 'blue',
  RAG: 'cyan',
  SUMMARY: 'purple',
  JUDGE: 'volcano',
  STRUCTURED_EXTRACT: 'gold',
};

const typeColor: Record<PromptTemplateType, string> = {
  SYSTEM: 'geekblue',
  USER: 'green',
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const normalized = value.replace('T', ' ');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return normalized.slice(0, 16);
  }
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function PromptTemplatesPage() {
  const [form] = Form.useForm<PromptTemplateCreateValues>();
  const [filterForm] = Form.useForm<Partial<PromptTemplatePageParams>>();
  const navigate = useNavigate();
  const [rows, setRows] = useState<PromptTemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<PromptTemplateItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await promptTemplateApi.page({ ...values, pageNum, pageSize });
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
    form.setFieldsValue({ status: 'ACTIVE', promptType: 'SYSTEM' });
    setModalOpen(true);
  };

  const openEdit = async (record: PromptTemplateItem) => {
    const detail = await promptTemplateApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue(detail);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await promptTemplateApi.update(editing.id, {
        name: values.name,
        agentCode: values.agentCode,
        promptType: values.promptType,
        sceneCode: values.sceneCode,
        description: values.description,
      });
      message.success('提示词模板已更新');
    } else {
      await promptTemplateApi.create(values);
      message.success('提示词模板已创建');
    }
    setModalOpen(false);
    void load();
  };

  const switchStatus = async (record: PromptTemplateItem) => {
    const nextStatus: ActiveStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await promptTemplateApi.updateStatus(record.id, nextStatus);
    message.success(nextStatus === 'ACTIVE' ? '提示词模板已启用' : '提示词模板已禁用');
    void load();
  };

  const remove = async (id: number) => {
    await promptTemplateApi.remove(id);
    message.success('提示词模板已删除');
    void load(1, pagination.pageSize);
  };

  const resetFilters = () => {
    filterForm.resetFields();
    void load(1, pagination.pageSize);
  };

  const columns: TableColumnsType<PromptTemplateItem> = [
    { title: '名称', dataIndex: 'name', width: 180, ellipsis: true },
    { title: '编码', dataIndex: 'code', width: 210, ellipsis: true },
    { title: 'Agent', dataIndex: 'agentCode', width: 220, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'promptType',
      width: 110,
      render: (value: PromptTemplateType) => <Tag color={typeColor[value]}>{value}</Tag>,
    },
    {
      title: '场景',
      dataIndex: 'sceneCode',
      width: 170,
      render: (value?: PromptTemplateScene) => (value ? <Tag color={sceneColor[value]}>{value}</Tag> : '-'),
    },
    {
      title: '当前版本',
      dataIndex: 'activeVersionNo',
      width: 110,
      render: (value?: number) => (value ? `v${value}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: ActiveStatus, record) => (
        <Tag color={value === 'ACTIVE' ? 'success' : 'default'}>{record.statusText || statusText[value]}</Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 170,
      render: (value?: string) => formatDateTime(value),
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" onClick={() => navigate(`/promptTemplates/${record.id}/versions`)}>
            版本
          </Button>
          <Button type="link" onClick={() => switchStatus(record)}>
            {record.status === 'ACTIVE' ? '禁用' : '启用'}
          </Button>
          <Popconfirm title="确认物理删除该提示词模板？" description="删除后不可恢复。" onConfirm={() => remove(record.id)}>
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
            <Input allowClear placeholder="搜索名称 / code" style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="agentCode">
            <Select
              allowClear
              showSearch
              placeholder="全部 Agent"
              options={agentOptions}
              style={{ width: 220 }}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select allowClear placeholder="全部状态" options={statusOptions} style={{ width: 128 }} />
          </Form.Item>
          <Button type="primary" onClick={() => load(1, pagination.pageSize)}>
            查询
          </Button>
          <Button onClick={resetFilters}>重置</Button>
        </Form>
        <Button type="primary" onClick={openCreate}>
          新增模板
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 1400 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => load(page, pageSize),
        }}
      />

      <Modal
        title={editing ? '编辑提示词模板' : '新增提示词模板'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="提示词名称" rules={[{ required: true, message: '请输入提示词名称' }]}>
            <Input maxLength={100} showCount />
          </Form.Item>
          <Form.Item
            name="code"
            label="提示词编码"
            rules={[
              { required: !editing, message: '请输入提示词编码' },
              { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线' },
            ]}
          >
            <Input disabled={Boolean(editing)} maxLength={100} showCount placeholder="student_chat_system" />
          </Form.Item>
          <Form.Item
            name="agentCode"
            label="所属 Agent"
            rules={[
              { required: true, message: '请输入或选择 Agent' },
              { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线' },
            ]}
          >
            <AutoComplete options={agentOptions} placeholder="student_chat_agent" />
          </Form.Item>
          <Form.Item name="promptType" label="提示词类型" rules={[{ required: true, message: '请选择提示词类型' }]}>
            <Select options={promptTypeOptions} />
          </Form.Item>
          <Form.Item name="sceneCode" label="使用场景">
            <Select allowClear options={sceneOptions} placeholder="请选择使用场景" />
          </Form.Item>
          {!editing ? (
            <Form.Item name="status" label="状态">
              <Select options={statusOptions} />
            </Form.Item>
          ) : null}
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={4} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
