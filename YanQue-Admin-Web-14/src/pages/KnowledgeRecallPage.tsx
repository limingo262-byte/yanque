import { Button, Empty, Form, Input, InputNumber, Segmented, Select, Spin, Tag, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { knowledgeBaseApi } from '../api/system';
import type { KnowledgeBaseItem, KnowledgeRecallMode, KnowledgeRecallResult, KnowledgeRecallValues } from '../types/system';

const modeOptions: { label: string; value: KnowledgeRecallMode }[] = [
  { label: '语义召回', value: 'SEMANTIC' },
  { label: '关键字召回', value: 'KEYWORD' },
  { label: '混合召回', value: 'HYBRID' },
];

const modeText: Record<KnowledgeRecallMode, string> = {
  SEMANTIC: '语义召回',
  KEYWORD: '关键字召回',
  HYBRID: '混合召回',
};

/**
 * 知识库召回测试页。
 *
 * 页面只做测试调试，召回直接走 Milvus，不新增数据库记录。
 */
export default function KnowledgeRecallPage() {
  const { knowledgeBaseId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm<KnowledgeRecallValues>();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseItem>();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<number>();
  const [result, setResult] = useState<KnowledgeRecallResult>();
  const [loading, setLoading] = useState(false);
  const kbId = useMemo(() => Number(knowledgeBaseId), [knowledgeBaseId]);
  const activeKnowledgeBaseId = selectedKnowledgeBaseId || (Number.isFinite(kbId) && kbId > 0 ? kbId : undefined);

  const loadKnowledgeBases = async () => {
    const data = await knowledgeBaseApi.page({ pageNum: 1, pageSize: 100, status: 'ACTIVE' });
    setKnowledgeBases(data.records);
    if (Number.isFinite(kbId) && kbId > 0) {
      const detail = await knowledgeBaseApi.detail(kbId);
      setKnowledgeBase(detail);
      setSelectedKnowledgeBaseId(detail.id);
    }
  };

  useEffect(() => {
    form.setFieldsValue({ mode: 'HYBRID', topK: 5 });
    void loadKnowledgeBases();
  }, [kbId]);

  const changeKnowledgeBase = (id: number) => {
    setSelectedKnowledgeBaseId(id);
    setKnowledgeBase(knowledgeBases.find((item) => item.id === id));
    setResult(undefined);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (!activeKnowledgeBaseId) {
      message.warning('请先选择知识库');
      return;
    }
    setLoading(true);
    try {
      const data = await knowledgeBaseApi.recall(activeKnowledgeBaseId, {
        query: values.query.trim(),
        mode: values.mode,
        topK: values.topK,
      });
      setResult(data);
      if (data.records.length === 0) {
        message.info('未召回到相关 chunk');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recall-page">
      <div className="chunk-header">
        <div>
          <Button type="link" className="knowledge-doc-back" onClick={() => navigate('/knowledgeBases')}>
            返回知识库列表
          </Button>
          <h2>{knowledgeBase?.name || '知识库'} / 召回测试</h2>
          <p>{knowledgeBase?.description || '输入问题，测试当前知识库的 chunk 召回效果'}</p>
        </div>
        <div className="chunk-header-actions">
          <Button onClick={() => navigate(activeKnowledgeBaseId ? `/knowledgeBases/${activeKnowledgeBaseId}/qa` : '/knowledgeQa')}>
            去问答测试
          </Button>
          <Tag color={knowledgeBase?.status === 'ACTIVE' ? 'success' : 'default'}>{knowledgeBase?.statusText || '-'}</Tag>
        </div>
      </div>

      <div className="recall-workspace">
        <section className="recall-control-panel">
          <div className="recall-panel-title">查询设置</div>
          <Form form={form} layout="vertical">
            <Form.Item label="知识库" required>
              <Select
                placeholder="请选择知识库"
                value={activeKnowledgeBaseId}
                options={knowledgeBases.map((item) => ({ label: `${item.name}（${item.code}）`, value: item.id }))}
                onChange={changeKnowledgeBase}
              />
            </Form.Item>
            <Form.Item
              name="query"
              label="测试问题"
              rules={[{ required: true, whitespace: true, message: '请输入测试问题' }]}
            >
              <Input.TextArea rows={7} maxLength={1000} showCount placeholder="例如：补课请假规则是什么？" />
            </Form.Item>
            <Form.Item name="mode" label="召回方式" rules={[{ required: true, message: '请选择召回方式' }]}>
              <Segmented block options={modeOptions} />
            </Form.Item>
            <Form.Item name="topK" label="Top-K" rules={[{ required: true, message: '请选择召回数量' }]}>
              <InputNumber min={1} max={20} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Button type="primary" block size="large" loading={loading} onClick={submit}>
              开始召回
            </Button>
          </Form>
        </section>

        <section className="recall-result-panel">
          <div className="recall-result-head">
            <div>
              <span>召回结果</span>
              <strong>{result ? `${result.records.length} / ${result.topK}` : '等待测试'}</strong>
            </div>
            {result && <Tag color="blue">{modeText[result.mode]}</Tag>}
          </div>
          <Spin spinning={loading}>
            {!result ? (
              <div className="recall-empty">
                <Empty description="输入问题后测试知识库召回效果" />
              </div>
            ) : result.records.length === 0 ? (
              <div className="recall-empty">
                <Empty description="未召回到相关 chunk" />
              </div>
            ) : (
              <div className="recall-result-list">
                {result.records.map((item) => (
                  <article className="recall-result-card" key={`${item.documentCode}_${item.chunkIndex}_${item.rank}`}>
                    <div className="recall-card-head">
                      <span>#{item.rank}</span>
                      <strong>score {item.score.toFixed(4)}</strong>
                    </div>
                    <div className="recall-card-meta">
                      <Tag color="geekblue">{item.documentCode}</Tag>
                      <Tag>v{item.documentVersion}</Tag>
                      <Tag>chunk {item.chunkIndex + 1}</Tag>
                      <Tag>{item.wordCount} 字</Tag>
                    </div>
                    <pre>{item.content}</pre>
                  </article>
                ))}
              </div>
            )}
          </Spin>
        </section>
      </div>
    </div>
  );
}
