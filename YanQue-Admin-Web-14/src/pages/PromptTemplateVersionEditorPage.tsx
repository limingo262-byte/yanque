import { Button, Form, Input, Space, Tag, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { promptTemplateApi, promptTemplateVersionApi } from '../api/system';
import type {
  PromptTemplateItem,
  PromptTemplateVersionCreateValues,
  PromptTemplateVersionItem,
} from '../types/system';

const formatVariableRows = (value?: string) => {
  if (!value || !value.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) =>
        typeof item === 'string'
          ? { name: item, description: '' }
          : {
              name: String((item as { name?: unknown; key?: unknown }).name || (item as { key?: unknown }).key || ''),
              description: String((item as { description?: unknown }).description || ''),
            },
      );
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed as Record<string, unknown>).map(([name, description]) => ({
        name,
        description: typeof description === 'string' ? description : JSON.stringify(description),
      }));
    }
  } catch {
    return [];
  }
  return [];
};

const validateJsonText = (_: unknown, value?: string) => {
  if (!value || !value.trim()) {
    return Promise.resolve();
  }
  try {
    JSON.parse(value);
    return Promise.resolve();
  } catch {
    return Promise.reject(new Error('请输入合法的 JSON'));
  }
};

export default function PromptTemplateVersionEditorPage() {
  const { templateId, versionId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm<PromptTemplateVersionCreateValues>();
  const [template, setTemplate] = useState<PromptTemplateItem>();
  const [versions, setVersions] = useState<PromptTemplateVersionItem[]>([]);
  const [sourceVersion, setSourceVersion] = useState<PromptTemplateVersionItem>();
  const [saving, setSaving] = useState(false);

  const id = Number(templateId);
  const sourceId = versionId ? Number(versionId) : undefined;
  const copyMode = Number.isFinite(sourceId);
  const content = Form.useWatch('content', form);
  const variables = Form.useWatch('variables', form);
  const changeNote = Form.useWatch('changeNote', form);

  const nextVersionNo = useMemo(() => {
    if (copyMode && sourceVersion) {
      return Math.max(...versions.map((item) => item.versionNo), 0) + 1;
    }
    return Math.max(...versions.map((item) => item.versionNo), 0) + 1;
  }, [copyMode, sourceVersion, versions]);
  const variableRows = useMemo(() => formatVariableRows(variables), [variables]);
  const hasVariables = Boolean(variables?.trim());
  const variablesValid = useMemo(() => {
    if (!variables || !variables.trim()) {
      return true;
    }
    try {
      JSON.parse(variables);
      return true;
    } catch {
      return false;
    }
  }, [variables]);

  useEffect(() => {
    const load = async () => {
      if (!Number.isFinite(id)) {
        return;
      }
      const [templateDetail, versionRows] = await Promise.all([
        promptTemplateApi.detail(id),
        promptTemplateVersionApi.list(id),
      ]);
      setTemplate(templateDetail);
      setVersions(versionRows);
      if (copyMode && sourceId) {
        const detail = await promptTemplateVersionApi.detail(id, sourceId);
        setSourceVersion(detail);
        form.setFieldsValue({
          content: detail.content,
          variables: detail.variables,
          changeNote: '',
        });
      } else {
        form.resetFields();
      }
    };
    void load();
  }, [copyMode, form, id, sourceId]);

  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await promptTemplateVersionApi.create(id, values);
      message.success(copyMode ? '提示词版本已复制' : '提示词版本已创建');
      navigate(`/promptTemplates/${id}/versions`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="prompt-editor-page">
      <div className="prompt-editor-header">
        <div>
          <div className="prompt-editor-title">{copyMode ? '复制提示词版本' : '新建提示词版本'}</div>
          <div className="prompt-editor-subtitle">{template?.name || '提示词模板'} / 版本管理</div>
        </div>
        <Space>
          <Button onClick={() => navigate(`/promptTemplates/${id}/versions`)}>返回列表</Button>
          <Button type="primary" loading={saving} onClick={submit}>
            保存版本
          </Button>
        </Space>
      </div>

      <Form form={form} layout="vertical" className="prompt-editor-grid">
        <section className="prompt-editor-main">
          <div className="prompt-section-title">提示词正文</div>
          <Form.Item name="content" rules={[{ required: true, message: '请输入提示词内容' }]}>
            <Input.TextArea
              className="prompt-content-editor"
              rows={20}
              placeholder="请输入 system prompt 或 user prompt 模板"
            />
          </Form.Item>
          <div className="prompt-supported-vars">
            支持变量：
            {variableRows.length > 0 ? variableRows.map((item) => `{{${item.name}}}`).join('、') : '暂无'}
          </div>
          <Form.Item name="changeNote">
            <Input className="prompt-change-input" maxLength={500} placeholder="变更说明：可不填，例如 增加知识库边界规则，降低无依据编造风险" />
          </Form.Item>
        </section>

        <aside className="prompt-editor-side">
          <section className="prompt-side-section">
            <div className="prompt-section-title">版本信息</div>
            <div className="prompt-meta-row">
              <span>模板</span>
              <strong>{template?.name || '-'}</strong>
            </div>
            <div className="prompt-meta-row">
              <span>新版本号</span>
              <strong>v{nextVersionNo}</strong>
            </div>
            <div className="prompt-meta-row">
              <span>类型</span>
              <strong>{template?.promptType || '-'}</strong>
            </div>
            {copyMode && sourceVersion ? (
              <div className="prompt-meta-row">
                <span>复制来源</span>
                <strong>v{sourceVersion.versionNo}</strong>
              </div>
            ) : null}
          </section>

          <section className="prompt-side-section">
            <div className="prompt-section-title">变量说明</div>
            <Form.Item name="variables" rules={[{ validator: validateJsonText }]}>
              <Input.TextArea
                className="prompt-variable-input"
                rows={6}
                placeholder='可不填；需要变量时填写 JSON，例如 {"question":"学生本次问题","history":"历史对话"}'
              />
            </Form.Item>
            <div className="prompt-variable-list">
              {variableRows.length > 0 ? (
                variableRows.map((item) => (
                  <div className="prompt-variable-item" key={item.name}>
                    <code>{item.name}</code>
                    <span>{item.description || '-'}</span>
                  </div>
                ))
              ) : (
                <div className="prompt-variable-empty">暂无变量</div>
              )}
            </div>
          </section>

          <section className="prompt-side-section">
            <div className="prompt-section-title">保存前检查</div>
            <div className="prompt-check-ok">
              {changeNote?.trim() ? '✓ 已填写变更说明' : '✓ 未填写变更说明'}
            </div>
            <div className={variablesValid ? 'prompt-check-ok' : 'prompt-check-warn'}>
              {!hasVariables ? '✓ 未配置变量' : variablesValid ? '✓ 变量格式正常' : '○ 变量 JSON 格式异常'}
            </div>
            <div className={content?.trim() ? 'prompt-check-ok' : 'prompt-check-warn'}>
              {content?.trim() ? '✓ 已填写提示词正文' : '○ 需要填写提示词正文'}
            </div>
          </section>
        </aside>
      </Form>
    </div>
  );
}
