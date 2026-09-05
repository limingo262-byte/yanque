import { Button, Descriptions, Form, Input, Modal, Space, Table, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { promptTemplateApi, promptTemplateVersionApi } from '../api/system';
import type {
  PromptTemplateItem,
  PromptTemplateVersionItem,
} from '../types/system';

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

const versionStatusColor: Record<PromptTemplateVersionItem['status'], string> = {
  CURRENT: 'success',
  UNPUBLISHED: 'processing',
  HISTORY: 'default',
};

const versionStatusText: Record<PromptTemplateVersionItem['status'], string> = {
  CURRENT: '当前',
  UNPUBLISHED: '未发布',
  HISTORY: '历史',
};

export default function PromptTemplateVersionsPage() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<PromptTemplateItem>();
  const [rows, setRows] = useState<PromptTemplateVersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<PromptTemplateVersionItem>();

  const id = Number(templateId);
  const currentVersion = useMemo(() => rows.find((item) => item.current), [rows]);

  const load = async () => {
    if (!Number.isFinite(id)) {
      return;
    }
    setLoading(true);
    try {
      const [templateDetail, versions] = await Promise.all([
        promptTemplateApi.detail(id),
        promptTemplateVersionApi.list(id),
      ]);
      setTemplate(templateDetail);
      setRows(versions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const openView = async (record: PromptTemplateVersionItem) => {
    const detail = await promptTemplateVersionApi.detail(id, record.id);
    setViewing(detail);
  };

  const publishVersion = (record: PromptTemplateVersionItem) => {
    Modal.confirm({
      title: `确认发布 v${record.versionNo}？`,
      content: '发布后该版本将成为当前启用版本。',
      okText: '发布',
      cancelText: '取消',
      onOk: async () => {
        await promptTemplateVersionApi.publish(id, record.id);
        message.success('提示词版本已发布');
        await load();
      },
    });
  };

  const rollbackVersion = (record: PromptTemplateVersionItem) => {
    Modal.confirm({
      title: `确认回滚到 v${record.versionNo}？`,
      content: '回滚只会切换当前启用版本，不会删除任何版本。',
      okText: '回滚',
      cancelText: '取消',
      onOk: async () => {
        await promptTemplateVersionApi.rollback(id, record.id);
        message.success('提示词版本已回滚');
        await load();
      },
    });
  };

  const columns: TableColumnsType<PromptTemplateVersionItem> = [
    {
      title: '版本',
      dataIndex: 'versionNo',
      width: 110,
      render: (value: number) => `v${value}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value: PromptTemplateVersionItem['status'], record) => (
        <Tag color={versionStatusColor[value] || 'default'}>{record.statusText || versionStatusText[value] || '-'}</Tag>
      ),
    },
    { title: '变更说明', dataIndex: 'changeNote', ellipsis: true, render: (value?: string) => value || '-' },
    {
      title: '创建人',
      dataIndex: 'createByName',
      width: 140,
      render: (value: string | undefined, record) => value || record.createBy || '管理员',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      render: (value?: string) => formatDateTime(value),
    },
    {
      title: '操作',
      width: 260,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openView(record)}>
            查看
          </Button>
          <Button type="link" onClick={() => navigate(`/promptTemplates/${id}/versions/${record.id}/copy`)}>
            复制
          </Button>
          {record.status === 'UNPUBLISHED' ? (
            <Button type="link" onClick={() => publishVersion(record)}>
              发布
            </Button>
          ) : null}
          {record.status === 'HISTORY' ? (
            <Button type="link" onClick={() => rollbackVersion(record)}>
              回滚
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-panel">
      <div className="table-toolbar">
        <Space>
          <Button onClick={() => navigate('/promptTemplates')}>返回模板</Button>
          <Button type="primary" onClick={() => navigate(`/promptTemplates/${id}/versions/new`)}>
            新建版本
          </Button>
        </Space>
      </div>

      <Descriptions bordered column={3} size="small" title={template ? `${template.name} / 版本管理` : '提示词版本管理'}>
        <Descriptions.Item label="code">{template?.code || '-'}</Descriptions.Item>
        <Descriptions.Item label="Agent">{template?.agentCode || '-'}</Descriptions.Item>
        <Descriptions.Item label="当前启用">{currentVersion ? `v${currentVersion.versionNo}` : '-'}</Descriptions.Item>
        <Descriptions.Item label="说明" span={3}>
          {template?.description || '-'}
        </Descriptions.Item>
      </Descriptions>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={false}
        style={{ marginTop: 24 }}
      />

      <Modal
        title={viewing ? `查看版本 v${viewing.versionNo}` : '查看版本'}
        open={Boolean(viewing)}
        footer={<Button onClick={() => setViewing(undefined)}>关闭</Button>}
        onCancel={() => setViewing(undefined)}
        width={860}
      >
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="状态">
            {viewing ? (
              <Tag color={versionStatusColor[viewing.status] || 'default'}>
                {viewing.statusText || versionStatusText[viewing.status] || '-'}
              </Tag>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(viewing?.createTime)}</Descriptions.Item>
          <Descriptions.Item label="变更说明" span={2}>
            {viewing?.changeNote || '-'}
          </Descriptions.Item>
        </Descriptions>
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="提示词内容">
            <Input.TextArea rows={10} value={viewing?.content || ''} readOnly />
          </Form.Item>
          <Form.Item label="变量说明 JSON">
            <Input.TextArea rows={5} value={viewing?.variables || ''} readOnly />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
