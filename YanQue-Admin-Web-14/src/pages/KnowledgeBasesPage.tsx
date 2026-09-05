import { Button, Dropdown, Empty, Form, Input, Modal, Pagination, Select, Tag, message } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { knowledgeBaseApi } from '../api/system';
import type {
  ActiveStatus,
  KnowledgeBaseCreateValues,
  KnowledgeBaseItem,
  KnowledgeBasePageParams,
} from '../types/system';

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '禁用', value: 'INACTIVE' },
];

const statusText: Record<ActiveStatus, string> = {
  ACTIVE: '启用',
  INACTIVE: '禁用',
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

const guideSteps = [
  {
    step: '第 1 步',
    title: '创建知识库',
    description: '按课程资料、教务规则、招生 FAQ 等场景维护独立知识库。',
  },
  {
    step: '第 2 步',
    title: '上传文档',
    description: '进入文档管理页后上传 Markdown、PDF、Word 等资料。',
  },
  {
    step: '第 3 步',
    title: '检索问答',
    description: '完成入库后用于召回测试、知识问答和学生端 AI 辅助。',
  },
];

/**
 * 知识库列表页。
 *
 * 这里只管理知识库元信息；“文档”按钮先占位，等文档管理页完成后再接跳转。
 */
export default function KnowledgeBasesPage() {
  const [form] = Form.useForm<KnowledgeBaseCreateValues>();
  const [filterForm] = Form.useForm<Partial<KnowledgeBasePageParams>>();
  const navigate = useNavigate();
  const [rows, setRows] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<KnowledgeBaseItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const load = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = filterForm.getFieldsValue();
      const data = await knowledgeBaseApi.page({ ...values, pageNum, pageSize });
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

  const openEdit = async (record: KnowledgeBaseItem) => {
    // 编辑前重新拉详情，避免用列表里的旧数据覆盖刚被其他人修改过的内容。
    const detail = await knowledgeBaseApi.detail(record.id);
    setEditing(detail);
    form.setFieldsValue(detail);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await knowledgeBaseApi.update(editing.id, {
        name: values.name,
        description: values.description,
      });
      message.success('知识库已更新');
    } else {
      await knowledgeBaseApi.create(values);
      message.success('知识库已创建');
    }
    setModalOpen(false);
    void load();
  };

  const switchStatus = async (record: KnowledgeBaseItem) => {
    const nextStatus: ActiveStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await knowledgeBaseApi.updateStatus(record.id, nextStatus);
    message.success(nextStatus === 'ACTIVE' ? '知识库已启用' : '知识库已禁用');
    void load();
  };

  const remove = async (id: number) => {
    await knowledgeBaseApi.remove(id);
    message.success('知识库已删除');
    // 物理删除后回到第一页，避免最后一页删除后出现空页。
    void load(1, pagination.pageSize);
  };

  const openRemoveConfirm = (record: KnowledgeBaseItem) => {
    Modal.confirm({
      title: '确认物理删除该知识库？',
      content: '删除后不可恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => remove(record.id),
    });
  };

  const cardMenuItems = (record: KnowledgeBaseItem): MenuProps['items'] => [
    { key: 'edit', label: '编辑' },
    { key: 'status', label: record.status === 'ACTIVE' ? '禁用' : '启用' },
    { key: 'delete', label: '删除', danger: true },
  ];

  const handleCardMenuClick = (record: KnowledgeBaseItem, key: string) => {
    if (key === 'edit') {
      void openEdit(record);
    } else if (key === 'documents') {
      navigate(`/knowledgeBases/${record.id}/documents`);
    } else if (key === 'recall') {
      navigate(`/knowledgeBases/${record.id}/recall`);
    } else if (key === 'qa') {
      navigate(`/knowledgeBases/${record.id}/qa`);
    } else if (key === 'status') {
      void switchStatus(record);
    } else if (key === 'delete') {
      openRemoveConfirm(record);
    }
  };

  return (
    <div className="knowledge-page">
      <section className="knowledge-guide">
        <div className="knowledge-guide-copy">
          <p>提供知识管理与文档检索能力，支持企业文档统一接入、构建索引并完成问答检索。</p>
        </div>
        <div className="knowledge-guide-steps">
          {guideSteps.map((item) => (
            <div className="knowledge-guide-step" key={item.step}>
              <div className="knowledge-step-label">{item.step}</div>
              <div className="knowledge-step-title">{item.title}</div>
              <div className="knowledge-step-desc">{item.description}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="knowledge-list-section">
        <div className="knowledge-toolbar">
          <div className="knowledge-toolbar-left">
            <Button type="primary" size="large" onClick={openCreate}>
              创建库
            </Button>
            <span className="knowledge-total">共 {pagination.total} 个知识库</span>
          </div>
          <Form form={filterForm} layout="inline" className="knowledge-filter">
            <Form.Item name="status">
              <Select allowClear placeholder="全部状态" options={statusOptions} style={{ width: 128 }} />
            </Form.Item>
            <Form.Item name="keyword">
              <Input.Search
                allowClear
                placeholder="搜索知识库..."
                onSearch={() => load(1, pagination.pageSize)}
                style={{ width: 280 }}
              />
            </Form.Item>
            <Button onClick={() => load(1, pagination.pageSize)}>查询</Button>
          </Form>
        </div>

        {rows.length > 0 ? (
          <div className={loading ? 'knowledge-card-grid knowledge-card-grid-loading' : 'knowledge-card-grid'}>
            {rows.map((record) => (
              <article className="knowledge-card" key={record.id}>
                <div className="knowledge-card-head">
                  <div className="knowledge-card-icon">KB</div>
                  <div className="knowledge-card-title-wrap">
                    <div className="knowledge-card-title">{record.name}</div>
                    <div className="knowledge-card-meta">
                      {record.code}
                      {record.updatedAt ? ` / ${formatDateTime(record.updatedAt)} 更新` : ''}
                    </div>
                  </div>
                  <Tag className="knowledge-status-tag" color={record.status === 'ACTIVE' ? 'blue' : 'default'}>
                    {record.statusText || statusText[record.status]}
                  </Tag>
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: cardMenuItems(record),
                      onClick: ({ key }) => handleCardMenuClick(record, key),
                    }}
                  >
                    <Button className="knowledge-more-button">...</Button>
                  </Dropdown>
                </div>

                <div className="knowledge-card-desc">{record.description || '暂无说明'}</div>

                <div className="knowledge-card-actions">
                  <Button size="small" onClick={() => navigate(`/knowledgeBases/${record.id}/documents`)}>
                    文档
                  </Button>
                  <Button
                    size="small"
                    disabled={record.status !== 'ACTIVE'}
                    onClick={() => navigate(`/knowledgeBases/${record.id}/recall`)}
                  >
                    召回测试
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    disabled={record.status !== 'ACTIVE'}
                    onClick={() => navigate(`/knowledgeBases/${record.id}/qa`)}
                  >
                    知识问答
                  </Button>
                </div>

                <div className="knowledge-card-stats">
                  <div>
                    <strong>{record.documentCount}</strong>
                    <span>文档数量</span>
                  </div>
                  <div>
                    <strong>{record.chunkCount}</strong>
                    <span>切片数量</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="knowledge-empty">
            <Empty description={loading ? '正在加载知识库...' : '暂无知识库'} />
          </div>
        )}

        <div className="knowledge-pagination">
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger
            onChange={(page, pageSize) => load(page, pageSize)}
          />
        </div>
      </section>

      <Modal
        title={editing ? '编辑知识库' : '新建知识库'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="知识库名称" rules={[{ required: true, message: '请输入知识库名称' }]}>
            <Input maxLength={100} showCount />
          </Form.Item>
          <Form.Item
            name="code"
            label="知识库编码"
            rules={[
              { required: !editing, message: '请输入知识库编码' },
              { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线' },
            ]}
          >
            {/* code 是向量侧稳定标识，创建后不允许修改。 */}
            <Input disabled={Boolean(editing)} maxLength={64} showCount placeholder="course_material" />
          </Form.Item>
          <Form.Item name="description" label="知识库说明">
            <Input.TextArea rows={4} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
