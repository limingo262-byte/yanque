import { Button, Empty, Form, Input, Select, Space, Spin, Tag, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { promptTemplateApi, promptTemplateVersionApi, promptTestApi } from '../api/system';
import type { PromptTemplateItem, PromptTemplateVersionItem, PromptTestValues } from '../types/system';

interface PromptTestFormValues {
  systemTemplateId?: number;
  systemVersionId?: number;
  userTemplateId?: number;
  userVersionId?: number;
  model?: string;
}

interface VariableMeta {
  name: string;
  description: string;
  required: boolean;
}

const modelOptions = [
  { label: 'qwen3.7-plus', value: 'qwen3.7-plus' },
  { label: 'qwen-plus', value: 'qwen-plus' },
  { label: 'qwen-turbo', value: 'qwen-turbo' },
];

const versionStatusColor: Record<PromptTemplateVersionItem['status'], string> = {
  CURRENT: 'success',
  UNPUBLISHED: 'processing',
  HISTORY: 'default',
};

const parseVariables = (value?: string): VariableMeta[] => {
  if (!value?.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return [];
    }
    return Object.entries(parsed as Record<string, unknown>).map(([name, config]) => {
      if (typeof config === 'string') {
        return { name, description: config, required: false };
      }
      if (config && typeof config === 'object' && !Array.isArray(config)) {
        const item = config as Record<string, unknown>;
        return {
          name,
          description: String(item.description || item.label || ''),
          required: item.required === true,
        };
      }
      return { name, description: '', required: false };
    });
  } catch {
    return [];
  }
};

const buildVersionLabel = (item: PromptTemplateVersionItem) =>
  `v${item.versionNo} ${item.statusText || item.status || ''}`.trim();

const renderPreview = (template: string, variables: Record<string, string>) =>
  template.replace(/\{([a-zA-Z0-9_]+)\}/g, (source, key: string) => variables[key] || source);

export default function PromptTestPage() {
  const [form] = Form.useForm<PromptTestFormValues>();
  const [systemTemplates, setSystemTemplates] = useState<PromptTemplateItem[]>([]);
  const [userTemplates, setUserTemplates] = useState<PromptTemplateItem[]>([]);
  const [systemVersions, setSystemVersions] = useState<PromptTemplateVersionItem[]>([]);
  const [userVersions, setUserVersions] = useState<PromptTemplateVersionItem[]>([]);
  const [selectedSystemVersion, setSelectedSystemVersion] = useState<PromptTemplateVersionItem>();
  const [selectedUserVersion, setSelectedUserVersion] = useState<PromptTemplateVersionItem>();
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorText, setErrorText] = useState('');
  const abortRef = useRef<AbortController | undefined>(undefined);

  const variableMetas = useMemo(() => parseVariables(selectedUserVersion?.variables), [selectedUserVersion]);
  const renderedUserPrompt = useMemo(
    () => renderPreview(selectedUserVersion?.content || '', variableValues),
    [selectedUserVersion, variableValues],
  );
  const selectedSystemTemplateId = Form.useWatch('systemTemplateId', form);
  const selectedSystemVersionId = Form.useWatch('systemVersionId', form);
  const selectedUserTemplateId = Form.useWatch('userTemplateId', form);
  const selectedUserVersionId = Form.useWatch('userVersionId', form);
  const selectedModel = Form.useWatch('model', form);

  const requiredVariablesReady = variableMetas.every((item) => !item.required || variableValues[item.name]?.trim());

  const checks = [
    { label: '已选择系统提示词', pass: Boolean(selectedSystemTemplateId) },
    { label: '已选择系统版本', pass: Boolean(selectedSystemVersionId) },
    { label: '已选择用户提示词', pass: Boolean(selectedUserTemplateId) },
    { label: '已选择用户版本', pass: Boolean(selectedUserVersionId) },
    { label: variableMetas.length ? '变量格式可渲染' : '暂无变量', pass: true },
    { label: variableMetas.some((item) => item.required) ? '必填变量已填写' : '暂无必填变量', pass: requiredVariablesReady },
    { label: '已选择测试模型', pass: Boolean(selectedModel) },
    { label: completed ? '模型输出生成成功' : '等待模型输出', pass: completed },
  ];

  const loadOptions = async () => {
    const [systems, users] = await Promise.all([
      promptTemplateApi.options('SYSTEM'),
      promptTemplateApi.options('USER'),
    ]);
    setSystemTemplates(systems);
    setUserTemplates(users);
  };

  useEffect(() => {
    form.setFieldsValue({ model: 'qwen3.7-plus' });
    void loadOptions();
    return () => abortRef.current?.abort();
  }, []);

  const changeSystemTemplate = async (templateId: number) => {
    form.setFieldsValue({ systemVersionId: undefined });
    setSystemVersions([]);
    setSelectedSystemVersion(undefined);
    const versions = await promptTemplateVersionApi.list(templateId);
    setSystemVersions(versions);
  };

  const changeUserTemplate = async (templateId: number) => {
    form.setFieldsValue({ userVersionId: undefined });
    setUserVersions([]);
    setSelectedUserVersion(undefined);
    setVariableValues({});
    const versions = await promptTemplateVersionApi.list(templateId);
    setUserVersions(versions);
  };

  const changeSystemVersion = async (versionId: number) => {
    const templateId = form.getFieldValue('systemTemplateId');
    if (!templateId) {
      return;
    }
    const detail = await promptTemplateVersionApi.detail(templateId, versionId);
    setSelectedSystemVersion(detail);
  };

  const changeUserVersion = async (versionId: number) => {
    const templateId = form.getFieldValue('userTemplateId');
    if (!templateId) {
      return;
    }
    const detail = await promptTemplateVersionApi.detail(templateId, versionId);
    setSelectedUserVersion(detail);
    const nextValues = parseVariables(detail.variables).reduce<Record<string, string>>((result, item) => {
      result[item.name] = '';
      return result;
    }, {});
    setVariableValues(nextValues);
  };

  const stop = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  const run = async () => {
    const values = await form.validateFields();
    if (!requiredVariablesReady) {
      message.warning('请填写必填变量');
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setOutput('');
    setCompleted(false);
    setErrorText('');
    setRunning(true);
    const payload: PromptTestValues = {
      systemTemplateId: values.systemTemplateId!,
      systemVersionId: values.systemVersionId!,
      userTemplateId: values.userTemplateId!,
      userVersionId: values.userVersionId!,
      variables: variableValues,
      model: values.model!,
    };
    try {
      await promptTestApi.stream(
        payload,
        {
          onEvent: ({ event, data }) => {
            if (event === 'delta') {
              setOutput((previous) => `${previous}${String(data.content || '')}`);
            } else if (event === 'done') {
              setCompleted(true);
              setRunning(false);
            } else if (event === 'error') {
              setErrorText(String(data.message || '提示词测试失败'));
              setRunning(false);
            }
          },
          onError: (error) => {
            setErrorText(error.message || '提示词测试失败');
            setRunning(false);
          },
        },
        controller.signal,
      );
    } catch {
      // 错误提示已经在 SSE error 或 onError 中处理。
    } finally {
      if (abortRef.current === controller) {
        setRunning(false);
      }
    }
  };

  return (
    <div className="prompt-test-page">
      <div className="prompt-test-toolbar">
        <div>
          <h2>提示词测试</h2>
          <p>选择系统提示词和用户提示词版本，填写变量后运行模型测试。</p>
        </div>
        <Space>
          {running ? <Button onClick={stop}>停止</Button> : null}
          <Button type="primary" loading={running} onClick={run}>
            运行测试
          </Button>
        </Space>
      </div>

      <div className="prompt-test-layout">
        <section className="prompt-test-panel prompt-test-input-panel">
          <h3>测试输入</h3>
          <Form form={form} layout="vertical">
            <Form.Item
              name="systemTemplateId"
              label="系统提示词模板"
              rules={[{ required: true, message: '请选择系统提示词模板' }]}
            >
              <Select
                placeholder="请选择 SYSTEM 模板"
                options={systemTemplates.map((item) => ({
                  label: `${item.name}（${item.code}）`,
                  value: item.id,
                }))}
                onChange={changeSystemTemplate}
              />
            </Form.Item>
            <Form.Item
              name="systemVersionId"
              label="系统提示词版本"
              rules={[{ required: true, message: '请选择系统提示词版本' }]}
            >
              <Select
                placeholder="请选择版本"
                disabled={!selectedSystemTemplateId}
                options={systemVersions.map((item) => ({
                  label: buildVersionLabel(item),
                  value: item.id,
                }))}
                onChange={changeSystemVersion}
                optionRender={(option) => {
                  const item = systemVersions.find((version) => version.id === option.value);
                  return item ? (
                    <Space>
                      <span>{`v${item.versionNo}`}</span>
                      <Tag color={versionStatusColor[item.status]}>{item.statusText || item.status}</Tag>
                    </Space>
                  ) : (
                    option.label
                  );
                }}
              />
            </Form.Item>
            <Form.Item
              name="userTemplateId"
              label="用户提示词模板"
              rules={[{ required: true, message: '请选择用户提示词模板' }]}
            >
              <Select
                placeholder="请选择 USER 模板"
                options={userTemplates.map((item) => ({
                  label: `${item.name}（${item.code}）`,
                  value: item.id,
                }))}
                onChange={changeUserTemplate}
              />
            </Form.Item>
            <Form.Item
              name="userVersionId"
              label="用户提示词版本"
              rules={[{ required: true, message: '请选择用户提示词版本' }]}
            >
              <Select
                placeholder="请选择版本"
                disabled={!selectedUserTemplateId}
                options={userVersions.map((item) => ({
                  label: buildVersionLabel(item),
                  value: item.id,
                }))}
                onChange={changeUserVersion}
                optionRender={(option) => {
                  const item = userVersions.find((version) => version.id === option.value);
                  return item ? (
                    <Space>
                      <span>{`v${item.versionNo}`}</span>
                      <Tag color={versionStatusColor[item.status]}>{item.statusText || item.status}</Tag>
                    </Space>
                  ) : (
                    option.label
                  );
                }}
              />
            </Form.Item>
            <Form.Item name="model" label="测试模型" rules={[{ required: true, message: '请选择测试模型' }]}>
              <Select options={modelOptions} />
            </Form.Item>
          </Form>

          <div className="prompt-test-variable-head">
            <span>变量输入</span>
            <strong>{variableMetas.length ? `${variableMetas.length} 个变量` : '暂无变量'}</strong>
          </div>
          {variableMetas.length === 0 ? (
            <div className="prompt-test-empty">暂无变量</div>
          ) : (
            <div className="prompt-test-variable-list">
              {variableMetas.map((item) => (
                <label className="prompt-test-variable-row" key={item.name}>
                  <div>
                    <code>{item.name}</code>
                    {item.required ? <Tag color="red">必填</Tag> : <Tag>选填</Tag>}
                    <span>{item.description}</span>
                  </div>
                  <Input.TextArea
                    rows={item.name.includes('context') ? 4 : 2}
                    value={variableValues[item.name] || ''}
                    onChange={(event) =>
                      setVariableValues((previous) => ({ ...previous, [item.name]: event.target.value }))
                    }
                  />
                </label>
              ))}
            </div>
          )}

          <div className="prompt-test-preview-group">
            <div className="prompt-test-variable-head">
              <span>提示词预览</span>
              <strong>{selectedUserVersion ? '已按变量渲染' : '等待选择版本'}</strong>
            </div>
            <div className="prompt-test-preview-card">
              <div className="prompt-test-preview-title">
                <Tag color="blue">SYSTEM</Tag>
                <span>{selectedSystemVersion ? `v${selectedSystemVersion.versionNo}` : '-'}</span>
              </div>
              {selectedSystemVersion?.content ? (
                <pre>{selectedSystemVersion.content}</pre>
              ) : (
                <Empty description="选择系统提示词版本后展示内容" />
              )}
            </div>
            <div className="prompt-test-preview-card is-dark">
              <div className="prompt-test-preview-title">
                <Tag color="purple">USER</Tag>
                <span>{selectedUserVersion ? `v${selectedUserVersion.versionNo}` : '-'}</span>
              </div>
              {renderedUserPrompt ? (
                <pre>{renderedUserPrompt}</pre>
              ) : (
                <div className="prompt-test-dark-empty">选择用户提示词版本后展示渲染结果</div>
              )}
            </div>
          </div>
        </section>

        <div className="prompt-test-side">
          <section className="prompt-test-panel">
            <div className="prompt-test-output-head">
              <h3>模型输出</h3>
              <Tag color={running ? 'processing' : completed ? 'success' : errorText ? 'error' : 'default'}>
                {running ? '生成中' : completed ? '已完成' : errorText ? '失败' : '等待测试'}
              </Tag>
            </div>
            <div className="prompt-test-output-box">
              <Spin spinning={running && !output}>
                {output ? <pre>{output}</pre> : <Empty description="运行后显示模型流式输出" />}
              </Spin>
            </div>
            {errorText ? <div className="prompt-test-error">{errorText}</div> : null}
          </section>

          <section className="prompt-test-panel">
            <h3>基础检查</h3>
            <div className="prompt-test-check-list">
              {checks.map((item) => (
                <div className={item.pass ? 'prompt-test-check is-pass' : 'prompt-test-check'} key={item.label}>
                  <span>{item.pass ? '通过' : '待完成'}</span>
                  <strong>{item.label}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
