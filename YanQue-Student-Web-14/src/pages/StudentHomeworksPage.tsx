import { Button, Empty, Form, Modal, Pagination, Space, Tag, Typography, Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../api/student';
import type { StudentHomeworkItem, StudentInfo } from '../types/student';

interface SubmitFormValues {
  submissionFile: UploadFile[];
}

const renderMarkdownPreview = (content: string) => {
  const lines = content.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inCodeBlock = false;

  const flushList = (key: string) => {
    if (listItems.length === 0) {
      return;
    }
    nodes.push(
      <ul key={key}>
        {listItems.map((item, index) => (
          <li key={`${key}-${index}`}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  const flushCode = (key: string) => {
    nodes.push(
      <pre key={key}>
        <code>{codeLines.join('\n')}</code>
      </pre>,
    );
    codeLines = [];
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCode(`code-${index}`);
        inCodeBlock = false;
      } else {
        flushList(`list-before-code-${index}`);
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList(`list-before-heading-${index}`);
      const level = heading[1].length;
      const text = heading[2];
      nodes.push(level === 1 ? <h1 key={index}>{text}</h1> : level === 2 ? <h2 key={index}>{text}</h2> : <h3 key={index}>{text}</h3>);
      return;
    }
    const listItem = line.match(/^\s*[-*]\s+(.+)$/);
    if (listItem) {
      listItems.push(listItem[1]);
      return;
    }
    flushList(`list-before-p-${index}`);
    nodes.push(line.trim() ? <p key={index}>{line}</p> : <div key={index} className="markdown-preview-spacer" />);
  });

  flushList('list-end');
  if (inCodeBlock) {
    flushCode('code-end');
  }
  return nodes;
};

export default function StudentHomeworksPage() {
  const navigate = useNavigate();
  const student = JSON.parse(localStorage.getItem('yanque_student_info') || '{}') as StudentInfo;
  const [submitForm] = Form.useForm<SubmitFormValues>();
  const [rows, setRows] = useState<StudentHomeworkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentHomework, setCurrentHomework] = useState<StudentHomeworkItem>();

  const load = async (nextPage = pageNum, nextSize = pageSize) => {
    setLoading(true);
    try {
      const data = await studentApi.homeworks(nextPage, nextSize);
      setRows(Array.isArray(data.records) ? data.records : []);
      setPageNum(data.pageNum || nextPage);
      setPageSize(data.pageSize || nextSize);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, 10);
  }, []);

  const previewHomework = async (item: StudentHomeworkItem, type: 'CONTENT' | 'ANSWER' | 'SUBMISSION') => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewTitle(type === 'CONTENT' ? item.contentFileName : type === 'ANSWER' ? item.answerFileName || '答案.md' : item.submissionFileName || '我的提交.md');
    setPreviewContent('');
    try {
      const data = type === 'SUBMISSION'
        ? await studentApi.homeworkSubmissionDownloadUrl(item.id)
        : await studentApi.homeworkDownloadUrl(item.id, type);
      setPreviewTitle(data.fileName);
      const response = await fetch(data.downloadUrl);
      if (!response.ok) {
        throw new Error('文件预览失败');
      }
      setPreviewContent(await response.text());
    } finally {
      setPreviewLoading(false);
    }
  };

  const getStudentId = () => {
    if (student.id) {
      return student.id;
    }
    // 兼容旧登录态：后端新增student.id后，新登录会写入localStorage，老token先从JWT里兜底解析。
    const token = localStorage.getItem('yanque_student_token');
    if (!token) {
      return undefined;
    }
    try {
      const tokenPayload = (token.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(tokenPayload));
      return Number(payload.studentId || payload.id || payload.sub);
    } catch {
      return undefined;
    }
  };

  const createSubmissionObjectKey = (homeworkId: number, studentId: number) => {
    const uuid = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const date = new Date();
    const dateText = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    // 后端会校验homeworkId/studentId目录归属，前端生成路径时必须和这个安全约束保持一致。
    return `homework/submission/${homeworkId}/${studentId}/${dateText}/${uuid}.md`;
  };

  const openSubmit = (item: StudentHomeworkItem) => {
    setCurrentHomework(item);
    submitForm.resetFields();
    setSubmitOpen(true);
  };

  const submitHomework = async () => {
    if (!currentHomework) {
      return;
    }
    const studentId = getStudentId();
    if (!studentId) {
      message.error('学生信息已失效，请重新登录后提交');
      return;
    }
    const values = await submitForm.validateFields();
    const file = values.submissionFile?.[0]?.originFileObj;
    if (!file) {
      message.error('请选择提交文件');
      return;
    }
    setSubmitLoading(true);
    try {
      const objectKey = createSubmissionObjectKey(currentHomework.id, studentId);
      const sign = await studentApi.presignUpload(objectKey);
      const response = await fetch(sign.uploadUrl, {
        method: 'PUT',
        headers: sign.headers || {},
        body: file,
      });
      if (!response.ok) {
        throw new Error('提交文件上传失败');
      }
      await studentApi.homeworkSubmit(currentHomework.id, {
        objectKey: sign.objectKey,
        fileName: file.name,
      });
      message.success(currentHomework.submitted ? '作业已重新提交' : '作业提交成功');
      setSubmitOpen(false);
      setCurrentHomework(undefined);
      await load(pageNum, pageSize);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <main className="student-homework-page">
      <header className="homework-topbar">
        <div>
          <Typography.Text className="home-kicker">我的作业</Typography.Text>
          <Typography.Title level={2}>{student.name || '同学'}，这是你的班级作业</Typography.Title>
          <Typography.Paragraph>按发布时间展示当前班级作业，答案公布后可在线查看。</Typography.Paragraph>
        </div>
        <Button className="homework-back-btn" onClick={() => navigate('/')}>返回首页</Button>
      </header>

      <section className="homework-list-panel">
        <div className="homework-list-summary">
          <div>
            <span>当前作业</span>
            <strong>{total}</strong>
          </div>
          <div>
            <span>答案已公布</span>
            <strong>{rows.filter((item) => item.answerVisible).length}</strong>
          </div>
          <div>
            <span>已提交</span>
            <strong>{rows.filter((item) => item.submitted).length}</strong>
          </div>
        </div>

        {rows.length === 0 && !loading ? (
          <Empty description="暂无作业" />
        ) : (
          <div className="student-homework-list">
            {rows.map((item) => (
              <article className="student-homework-card" key={item.id}>
                <div className="homework-card-main">
                  <div>
                    <div className="homework-card-eyebrow">{item.homeworkDate}</div>
                    <Typography.Title level={4}>{item.title}</Typography.Title>
                    <Typography.Text type="secondary">课程内容：{item.classContent}</Typography.Text>
                  </div>
                  <Space wrap>
                    <Tag color={item.submitted ? 'blue' : 'orange'}>{item.submitted ? '已提交' : '未提交'}</Tag>
                    <Tag color={item.answerVisible ? 'green' : 'default'}>{item.answerVisible ? '答案已公布' : '答案未公布'}</Tag>
                  </Space>
                </div>
                <div className="homework-card-meta">
                  <span>作业日期：{item.homeworkDate}</span>
                  <span>截止时间：{item.deadline?.replace('T', ' ')}</span>
                  {item.submitted && <span>提交时间：{item.submitTime?.replace('T', ' ')}</span>}
                  {item.lateSubmitted && <span>逾期提交</span>}
                </div>
                {item.submitted && (
                  <div className={`homework-grade-result ${item.score === undefined || item.score === null ? 'is-pending' : ''}`}>
                    <div>
                      <span>老师批改</span>
                      <strong>{item.score === undefined || item.score === null ? '待批改' : `${item.score} 分`}</strong>
                    </div>
                    <p>{item.teacherRemark || (item.score === undefined || item.score === null ? '老师批改后会在这里展示分数和评语。' : '老师暂未填写评语。')}</p>
                  </div>
                )}
                <div className="homework-card-actions">
                  <div className="homework-action-item">
                    <div className="homework-action-copy">
                      <span>作业文件</span>
                      <strong>{item.contentFileName || '作业内容.md'}</strong>
                    </div>
                    <Button type="primary" onClick={() => previewHomework(item, 'CONTENT')}>查看</Button>
                  </div>
                  <div className="homework-action-item">
                    <div className="homework-action-copy">
                      <span>我的提交</span>
                      <strong>{item.submitted ? item.submissionFileName || '已提交文件.md' : '还未提交'}</strong>
                    </div>
                    <Space size={8}>
                      {item.submitted && <Button onClick={() => previewHomework(item, 'SUBMISSION')}>查看</Button>}
                      <Button onClick={() => openSubmit(item)}>{item.submitted ? '重交' : '提交'}</Button>
                    </Space>
                  </div>
                  <div className={`homework-action-item ${item.answerVisible ? '' : 'is-disabled'}`}>
                    <div className="homework-action-copy">
                      <span>参考答案</span>
                      <strong>{item.answerVisible ? item.answerFileName || '答案.md' : '老师暂未公布'}</strong>
                    </div>
                    <Button disabled={!item.answerVisible} onClick={() => previewHomework(item, 'ANSWER')}>查看</Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Pagination
          current={pageNum}
          pageSize={pageSize}
          total={total}
          onChange={(nextPage, nextSize) => load(nextPage, nextSize)}
          hideOnSinglePage
        />
      </section>

      <Modal title={previewTitle} open={previewOpen} footer={null} onCancel={() => setPreviewOpen(false)} width={900}>
        <div className="student-markdown-preview">
          {previewLoading ? '加载中...' : renderMarkdownPreview(previewContent)}
        </div>
      </Modal>

      <Modal
        title={currentHomework?.submitted ? '重新提交作业' : '提交作业'}
        open={submitOpen}
        confirmLoading={submitLoading}
        onOk={submitHomework}
        onCancel={() => setSubmitOpen(false)}
        destroyOnClose
      >
        <Form form={submitForm} layout="vertical">
          <Typography.Paragraph type="secondary">
            {currentHomework?.title}
          </Typography.Paragraph>
          <Form.Item
            name="submissionFile"
            label="提交文件"
            valuePropName="fileList"
            getValueFromEvent={(event) => event?.fileList || []}
            rules={[
              { required: true, message: '请选择提交文件' },
              {
                validator: (_, fileList?: UploadFile[]) => {
                  const file = fileList?.[0];
                  if (!file) {
                    return Promise.reject(new Error('请选择提交文件'));
                  }
                  if (!file.name.toLowerCase().endsWith('.md')) {
                    return Promise.reject(new Error('提交文件只支持md格式'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Upload
              accept=".md,text/markdown,text/plain"
              maxCount={1}
              beforeUpload={(file) => {
                if (!file.name.toLowerCase().endsWith('.md')) {
                  message.error('提交文件只支持md格式');
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
            >
              <Button>选择 Markdown 文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </main>
  );
}
