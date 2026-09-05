import { Button, Empty, Form, Input, InputNumber, Segmented, Select, Spin, Tag, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { knowledgeBaseApi } from '../api/system';
import type {
  KnowledgeBaseItem,
  KnowledgeQaCitation,
  KnowledgeQaDone,
  KnowledgeQaValues,
  KnowledgeRecallMode,
} from '../types/system';

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

const toCitation = (item: Record<string, unknown>): KnowledgeQaCitation => ({
  rank: Number(item.rank || 0),
  score: Number(item.score || 0),
  documentCode: String(item.document_code || ''),
  documentVersion: Number(item.document_version || 0),
  chunkIndex: Number(item.chunk_index || 0),
  content: String(item.content || ''),
  contentPreview: String(item.content_preview || ''),
  wordCount: Number(item.word_count || 0),
});

/**
 * 知识库问答测试页。
 *
 * 只做管理端效果验证：Java 校验知识库，Python 召回并流式调用模型，不保存问答记录。
 */
export default function KnowledgeQaPage() {
  const { knowledgeBaseId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm<KnowledgeQaValues>();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseItem>();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<number>();
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<KnowledgeQaCitation[]>([]);
  const [done, setDone] = useState<KnowledgeQaDone>();
  const [currentMode, setCurrentMode] = useState<KnowledgeRecallMode>('HYBRID');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | undefined>(undefined);
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
    form.setFieldsValue({ recallMode: 'HYBRID', topK: 5 });
    void loadKnowledgeBases();
    return () => abortRef.current?.abort();
  }, [kbId]);

  const resetResult = () => {
    setAnswer('');
    setCitations([]);
    setDone(undefined);
  };

  const changeKnowledgeBase = (id: number) => {
    abortRef.current?.abort();
    setSelectedKnowledgeBaseId(id);
    setKnowledgeBase(knowledgeBases.find((item) => item.id === id));
    resetResult();
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (!activeKnowledgeBaseId) {
      message.warning('请先选择知识库');
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    resetResult();
    setCurrentMode(values.recallMode);
    setLoading(true);
    try {
      await knowledgeBaseApi.streamQa(
        activeKnowledgeBaseId,
        {
          question: values.question.trim(),
          recallMode: values.recallMode,
          topK: values.topK,
        },
        {
          onEvent: ({ event, data }) => {
            if (event === 'citations') {
              const items = Array.isArray(data.citations) ? data.citations : [];
              setCitations(items.map((item) => toCitation(item as Record<string, unknown>)));
            } else if (event === 'delta') {
              setAnswer((previous) => `${previous}${String(data.content || '')}`);
            } else if (event === 'done') {
              setDone({
                model: String(data.model || ''),
                finishReason: String(data.finish_reason || ''),
                truncated: Boolean(data.truncated),
                usage: data.usage,
              });
              setLoading(false);
            } else if (event === 'error') {
              setLoading(false);
              message.error(String(data.message || '知识库问答失败'));
            }
          },
          onError: (error) => {
            setLoading(false);
            message.error(error.message || '知识库问答失败');
          },
        },
        controller.signal,
      );
    } catch {
      // 错误提示已经在 streamPost 的 onError 或 SSE error 事件中处理。
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="qa-page">
      <div className="chunk-header qa-header">
        <div>
          <Button type="link" className="knowledge-doc-back" onClick={() => navigate('/knowledgeBases')}>
            返回知识库列表
          </Button>
          <h2>{knowledgeBase?.name || '知识库'} / 知识问答</h2>
          <p>{knowledgeBase?.description || '输入问题，验证当前知识库的回答效果和引用依据'}</p>
        </div>
        <Tag color={knowledgeBase?.status === 'ACTIVE' ? 'success' : 'default'}>{knowledgeBase?.statusText || '-'}</Tag>
      </div>

      <div className="qa-workspace">
        <section className="qa-control-panel">
          <div className="qa-panel-kicker">AI 调试台</div>
          <h3>问答设置</h3>
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
              name="question"
              label="测试问题"
              rules={[{ required: true, whitespace: true, message: '请输入测试问题' }]}
            >
              <Input.TextArea rows={8} maxLength={1000} showCount placeholder="例如：作业什么时候提交？" />
            </Form.Item>
            <Form.Item name="recallMode" label="召回方式" rules={[{ required: true, message: '请选择召回方式' }]}>
              <Segmented block options={modeOptions} />
            </Form.Item>
            <Form.Item name="topK" label="Top-K" rules={[{ required: true, message: '请选择召回数量' }]}>
              <InputNumber min={1} max={20} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Button type="primary" block size="large" loading={loading} onClick={submit}>
              开始问答
            </Button>
          </Form>
        </section>

        <section className="qa-answer-panel">
          <div className="qa-answer-head">
            <div>
              <span>回答结果</span>
              <strong>{loading ? '生成中' : answer ? '已完成' : '等待测试'}</strong>
            </div>
            <Tag color="blue">{modeText[currentMode]}</Tag>
          </div>

          <div className="qa-answer-card">
            <Spin spinning={loading && !answer}>
              {!answer ? (
                <Empty description="输入问题后验证知识库回答效果" />
              ) : (
                <pre>{answer}</pre>
              )}
            </Spin>
          </div>

          <div className="qa-answer-foot">
            <span>模型：{done?.model || '等待返回'}</span>
            <span>引用：{citations.length} 段</span>
            {done?.truncated && <Tag color="warning">回答被截断</Tag>}
          </div>

          <div className="qa-citation-head">
            <span>引用依据</span>
            <strong>{citations.length ? `${citations.length} 个 chunk` : '暂无引用'}</strong>
          </div>
          {citations.length === 0 ? (
            <div className="qa-citation-empty">
              <Empty description="未召回到可用于回答的分段" />
            </div>
          ) : (
            <div className="qa-citation-list">
              {citations.map((item) => (
                <article className="qa-citation-card" key={`${item.documentCode}_${item.chunkIndex}_${item.rank}`}>
                  <div className="qa-citation-meta">
                    <span>#{item.rank}</span>
                    <Tag color="geekblue">{item.documentCode}</Tag>
                    <Tag>v{item.documentVersion}</Tag>
                    <Tag>chunk {item.chunkIndex + 1}</Tag>
                    <Tag>{item.wordCount} 字</Tag>
                    <strong>{item.score.toFixed(4)}</strong>
                  </div>
                  <p>{item.content}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
