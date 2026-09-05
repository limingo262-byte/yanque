import { Button, Empty, Pagination, Spin, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { knowledgeBaseApi, knowledgeDocumentApi } from '../api/system';
import type {
  KnowledgeBaseItem,
  KnowledgeDocumentChunkDetail,
  KnowledgeDocumentChunkItem,
  KnowledgeDocumentItem,
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
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
};

const formatChunkNo = (index: number) => `#${String(index + 1).padStart(3, '0')}`;

/**
 * 文档分段页。
 *
 * Chunk 正文不落 Java 数据库，页面通过 Java 转调 Python，从 Milvus 查询当前文档的分段内容。
 */
export default function KnowledgeDocumentChunksPage() {
  const { knowledgeBaseId, documentId } = useParams();
  const navigate = useNavigate();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseItem>();
  const [document, setDocument] = useState<KnowledgeDocumentItem>();
  const [rows, setRows] = useState<KnowledgeDocumentChunkItem[]>([]);
  const [selected, setSelected] = useState<KnowledgeDocumentChunkDetail>();
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const kbId = useMemo(() => Number(knowledgeBaseId), [knowledgeBaseId]);
  const docId = useMemo(() => Number(documentId), [documentId]);
  const currentPageWordCount = rows.reduce((sum, item) => sum + (item.wordCount || 0), 0);
  const averageWordCount = rows.length ? Math.round(currentPageWordCount / rows.length) : 0;
  const isReady = document?.status === 'READY';

  const loadDocumentMeta = async () => {
    if (!kbId || !docId) {
      return;
    }
    const [kb, docs] = await Promise.all([
      knowledgeBaseApi.detail(kbId),
      knowledgeDocumentApi.page(kbId, { pageNum: 1, pageSize: 100 }),
    ]);
    setKnowledgeBase(kb);
    setDocument(docs.records.find((item) => item.id === docId));
  };

  const openChunk = async (chunkIndex: number) => {
    if (!kbId || !docId || !isReady) {
      return;
    }
    setDetailLoading(true);
    try {
      setSelected(await knowledgeDocumentApi.chunkDetail(kbId, docId, chunkIndex));
    } finally {
      setDetailLoading(false);
    }
  };

  const loadChunks = async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    if (!kbId || !docId) {
      return;
    }
    setLoading(true);
    try {
      const data = await knowledgeDocumentApi.chunks(kbId, docId, { pageNum, pageSize });
      setRows(data.records);
      setPagination({ current: data.pageNum, pageSize: data.pageSize, total: data.total });
      if (data.records.length > 0) {
        await openChunk(data.records[0].chunkIndex);
      } else {
        setSelected(undefined);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocumentMeta();
  }, [kbId, docId]);

  useEffect(() => {
    if (document) {
      void loadChunks(1, 10);
    }
  }, [document?.id, document?.status, document?.version]);

  return (
    <div className="chunk-page">
      <div className="chunk-header">
        <div>
          <Button type="link" className="knowledge-doc-back" onClick={() => navigate(`/knowledgeBases/${kbId}/documents`)}>
            返回文档管理
          </Button>
          <h2>{document?.name || '文档分段'}</h2>
          <p>{knowledgeBase?.name || '知识库'} · 从 Milvus 查询当前文档的切分结果</p>
        </div>
        <Tag color={isReady ? 'success' : document?.status === 'FAILED' ? 'error' : 'processing'}>
          {document?.statusText || document?.status || '加载中'}
        </Tag>
      </div>

      <div className="chunk-stats">
        <div>
          <span>chunk 数</span>
          <strong>{document?.chunkCount ?? pagination.total}</strong>
        </div>
        <div>
          <span>当前页字数</span>
          <strong>{currentPageWordCount}</strong>
        </div>
        <div>
          <span>平均字数</span>
          <strong>{averageWordCount}</strong>
        </div>
        <div>
          <span>版本 / 更新时间</span>
          <strong>v{document?.version || '-'}</strong>
          <em>{formatDateTime(document?.updatedAt)}</em>
        </div>
      </div>

      {!isReady ? (
        <div className="chunk-empty-panel">
          <Empty description="文档入库完成后可查看分段" />
        </div>
      ) : (
        <div className="chunk-workspace">
          <div className="chunk-list-panel">
            <div className="chunk-list-head">
              <span>分段列表</span>
              <span>{pagination.total} 个 chunk</span>
            </div>
            <Spin spinning={loading}>
              {rows.length === 0 ? (
                <div className="chunk-list-empty">
                  <Empty description="暂无分段" />
                </div>
              ) : (
                <div className="chunk-list">
                  {rows.map((item) => (
                    <button
                      key={item.chunkIndex}
                      type="button"
                      className={`chunk-card ${selected?.chunkIndex === item.chunkIndex ? 'chunk-card-active' : ''}`}
                      onClick={() => openChunk(item.chunkIndex)}
                    >
                      <div className="chunk-card-top">
                        <span>{formatChunkNo(item.chunkIndex)}</span>
                        <strong>{item.wordCount} 字</strong>
                      </div>
                      <p>{item.contentPreview || '空内容'}</p>
                    </button>
                  ))}
                </div>
              )}
            </Spin>
            <div className="chunk-pagination">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                showSizeChanger
                onChange={(page, pageSize) => loadChunks(page, pageSize)}
              />
            </div>
          </div>

          <div className="chunk-detail-panel">
            <div className="chunk-detail-head">
              <div>
                <span>当前分段</span>
                <strong>{selected ? formatChunkNo(selected.chunkIndex) : '-'}</strong>
              </div>
              {selected && <Tag color="blue">{selected.wordCount} 字</Tag>}
            </div>
            <Spin spinning={detailLoading}>
              <pre className="chunk-detail-content">{selected?.content || '请选择左侧 chunk 查看完整内容'}</pre>
            </Spin>
          </div>
        </div>
      )}
    </div>
  );
}
