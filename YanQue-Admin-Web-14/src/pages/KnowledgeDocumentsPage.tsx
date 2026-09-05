import { Button, Empty, Form, Input, Modal, Pagination, Select, Space, Table, Tag, Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { knowledgeBaseApi, knowledgeDocumentApi, uploadApi } from '../api/system';
import type {
  KnowledgeBaseItem,
  KnowledgeChunkStrategy,
  KnowledgeDocumentItem,
  KnowledgeDocumentPageParams,
  KnowledgeDocumentStatus,
} from '../types/system';

const statusOptions = [
  { label: '入库中', value: 'INDEXING' },
  { label: '已完成', value: 'READY' },
  { label: '失败', value: 'FAILED' },
];

const statusColor: Record<KnowledgeDocumentStatus, string> = {
  INDEXING: 'processing',
  READY: 'success',
  FAILED: 'error',
};

const chunkStrategyOptions = [
  { label: '按 Markdown 切分', value: 'MARKDOWN' },
  { label: '不切分', value: 'NONE' },
  { label: '按 JSON 数组切分', value: 'BY_ITEM' },
];

const chunkStrategyText: Record<KnowledgeChunkStrategy, string> = {
  MARKDOWN: 'Markdown',
  NONE: '不切分',
  BY_ITEM: 'JSON数组',
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

const buildDocumentCode = (fileName: string) => {
  const baseName = fileName.replace(/\.(md|json)$/i, '');
  const code = baseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return code || `doc_${Date.now()}`;
};

const isSupportedKnowledgeFile = (fileName: string) => /\.(md|json)$/i.test(fileName);

const defaultChunkStrategy = (fileName: string): KnowledgeChunkStrategy => (
  fileName.toLowerCase().endsWith('.json') ? 'NONE' : 'MARKDOWN'
);

/**
 * 知识库文档列表页。
 *
 * 文档新增采用 TOS 直传：前端上传文件后再提交文档元数据，后端异步入库。
 */
export default function KnowledgeDocumentsPage() {
  const { knowledgeBaseId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm<Partial<KnowledgeDocumentPageParams>>();
  const [uploadForm] = Form.useForm<{
    file?: UploadFile[];
    name?: string;
    code?: string;
    chunkStrategy?: KnowledgeChunkStrategy;
  }>();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseItem>();
  const [rows, setRows] = useState<KnowledgeDocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const kbId = useMemo(() => Number(knowledgeBaseId), [knowledgeBaseId]);

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    if (!kbId) {
      return;
    }
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const data = await knowledgeDocumentApi.page(kbId, { ...values, pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  const loadKnowledgeBase = async () => {
    if (!kbId) {
      return;
    }
    setKnowledgeBase(await knowledgeBaseApi.detail(kbId));
  };

  useEffect(() => {
    void loadKnowledgeBase();
    void load(1, 10);
  }, [kbId]);

  const openUpload = () => {
    uploadForm.resetFields();
    setUploadOpen(true);
  };

  const submitUpload = async () => {
    const values = await uploadForm.validateFields();
    const file = values.file?.[0]?.originFileObj;
    if (!file) {
      message.error('请选择知识文档');
      return;
    }
    if (!isSupportedKnowledgeFile(file.name)) {
      message.error('当前只支持 md 和 json 格式');
      return;
    }
    setUploading(true);
    try {
      const sign = await knowledgeDocumentApi.presignUpload(kbId, { fileName: file.name });
      const response = await fetch(sign.uploadUrl, {
        method: 'PUT',
        headers: sign.headers || {},
        body: file,
      });
      if (!response.ok) {
        throw new Error('文档上传失败');
      }
      await knowledgeDocumentApi.create(kbId, {
        name: values.name || file.name,
        code: values.code || buildDocumentCode(file.name),
        objectKey: sign.objectKey,
        chunkStrategy: values.chunkStrategy || defaultChunkStrategy(file.name),
        fileSize: file.size,
      });
      message.success('文档已提交入库');
      setUploadOpen(false);
      await load(1, pagination.pageSize);
      await loadKnowledgeBase();
    } finally {
      setUploading(false);
    }
  };

  const previewMarkdown = async (record: KnowledgeDocumentItem) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewTitle(record.name);
    setPreviewContent('');
    try {
      const data = await uploadApi.presignDownload(record.objectKey);
      const response = await fetch(data.downloadUrl);
      if (!response.ok) {
        throw new Error('文档预览失败');
      }
      setPreviewContent(await response.text());
    } finally {
      setPreviewLoading(false);
    }
  };

  const rebuild = async (record: KnowledgeDocumentItem) => {
    await knowledgeDocumentApi.rebuild(kbId, record.id);
    message.success('已提交重新入库');
    await load();
  };

  const remove = (record: KnowledgeDocumentItem) => {
    Modal.confirm({
      title: '确认物理删除该文档？',
      content: '删除后会同步删除向量数据，且不可恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await knowledgeDocumentApi.remove(kbId, record.id);
        message.success('文档已删除');
        await load(1, pagination.pageSize);
        await loadKnowledgeBase();
      },
    });
  };

  const columns = [
    {
      title: '文档名称',
      dataIndex: 'name',
      render: (value: string, record: KnowledgeDocumentItem) => (
        <div>
          <Button type="link" className="table-link-button" onClick={() => previewMarkdown(record)}>
            {value}
          </Button>
          <div className="table-subtext">{record.code}</div>
        </div>
      ),
    },
    { title: '类型', dataIndex: 'fileType', width: 90 },
    {
      title: '切分',
      dataIndex: 'chunkStrategy',
      width: 120,
      render: (value: KnowledgeChunkStrategy) => chunkStrategyText[value] || value,
    },
    { title: '大小', dataIndex: 'fileSizeText', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value: KnowledgeDocumentStatus, record: KnowledgeDocumentItem) => (
        <Tag color={statusColor[value]}>{record.statusText || value}</Tag>
      ),
    },
    { title: 'chunk', dataIndex: 'chunkCount', width: 100 },
    {
      title: '版本',
      dataIndex: 'version',
      width: 90,
      render: (value: number) => `v${value}`,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: formatDateTime,
    },
    {
      title: '操作',
      width: 230,
      render: (_: unknown, record: KnowledgeDocumentItem) => (
        <Space>
          <Button
            type="link"
            disabled={record.status !== 'READY'}
            onClick={() => navigate(`/knowledgeBases/${kbId}/documents/${record.id}/chunks`)}
          >
            分段
          </Button>
          <Button type="link" onClick={() => rebuild(record)}>
            重建
          </Button>
          <Button type="link" danger onClick={() => remove(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="knowledge-doc-page">
      <div className="knowledge-doc-header">
        <div>
          <Button type="link" className="knowledge-doc-back" onClick={() => navigate('/knowledgeBases')}>
            返回知识库
          </Button>
          <h2>{knowledgeBase?.name || '知识库'} / 文档管理</h2>
          <p>上传 Markdown 或 JSON 文档，查看每份文档的入库状态和分段结果。</p>
        </div>
        <div className="knowledge-doc-summary">
          <div>
            <strong>{knowledgeBase?.documentCount ?? 0}</strong>
            <span>文档数量</span>
          </div>
          <div>
            <strong>{knowledgeBase?.chunkCount ?? 0}</strong>
            <span>切片数量</span>
          </div>
        </div>
      </div>

      <div className="page-panel">
        <div className="knowledge-doc-toolbar">
          <Button type="primary" onClick={openUpload}>
            上传文档
          </Button>
          <Form form={form} layout="inline" className="knowledge-filter">
            <Form.Item name="status">
              <Select allowClear placeholder="全部状态" options={statusOptions} style={{ width: 128 }} />
            </Form.Item>
            <Form.Item name="keyword">
              <Input.Search
                allowClear
                placeholder="搜索文档..."
                onSearch={() => load(1, pagination.pageSize)}
                style={{ width: 280 }}
              />
            </Form.Item>
            <Button onClick={() => load(1, pagination.pageSize)}>查询</Button>
            <Button onClick={() => load()}>刷新</Button>
          </Form>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无文档" /> }}
        />
        <div className="knowledge-pagination">
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger
            onChange={(page, pageSize) => load(page, pageSize)}
          />
        </div>
      </div>

      <Modal
        title="上传知识文档"
        open={uploadOpen}
        confirmLoading={uploading}
        onOk={submitUpload}
        onCancel={() => setUploadOpen(false)}
        destroyOnHidden
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item
            name="file"
            label="文件"
            valuePropName="fileList"
            getValueFromEvent={(event) => event?.fileList}
            rules={[{ required: true, message: '请选择知识文档' }]}
          >
            <Upload
              accept=".md,.json"
              maxCount={1}
              beforeUpload={(file) => {
                if (!isSupportedKnowledgeFile(file.name)) {
                  message.error('当前只支持 md 和 json 格式');
                  return Upload.LIST_IGNORE;
                }
                uploadForm.setFieldsValue({
                  name: file.name,
                  code: buildDocumentCode(file.name),
                  chunkStrategy: defaultChunkStrategy(file.name),
                });
                return false;
              }}
            >
              <Button>选择文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="name" label="文档名称" rules={[{ required: true, message: '请输入文档名称' }]}>
            <Input maxLength={200} showCount />
          </Form.Item>
          <Form.Item
            name="code"
            label="文档编码"
            rules={[
              { required: true, message: '请输入文档编码' },
              { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线' },
            ]}
          >
            <Input maxLength={64} showCount />
          </Form.Item>
          <Form.Item name="chunkStrategy" label="切分策略" rules={[{ required: true, message: '请选择切分策略' }]}>
            <Select options={chunkStrategyOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={previewTitle} open={previewOpen} footer={null} onCancel={() => setPreviewOpen(false)} width={820}>
        <div className="markdown-preview">{previewLoading ? '加载中...' : previewContent}</div>
      </Modal>
    </div>
  );
}
