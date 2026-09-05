import { Button, Empty, Input, List, Space, Typography, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiChatApi } from '../api/aiChat';
import type { AiChatMessage, AiChatSession, StudentInfo } from '../types/student';

/**
 * 学生端 AI 问答页。
 *
 * 页面职责：
 * 1. 管理左侧会话列表。
 * 2. 展示当前会话消息。
 * 3. 发送问题后，把后端 SSE delta 逐段追加到最后一条 assistant 消息里。
 */
export default function StudentAiChatPage() {
  const navigate = useNavigate();
  const student = JSON.parse(localStorage.getItem('yanque_student_info') || '{}') as StudentInfo;

  // 会话列表、当前会话、当前会话消息分别维护，切换会话时只刷新消息区。
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number>();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);

  // 每次消息变化后滚动到底部，让学生看到最新回答。
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** 加载当前学生的会话列表；第一次进入页面时默认打开最近会话。 */
  const loadSessions = async () => {
    const data = await aiChatApi.sessions();
    setSessions(data);
    if (!activeSessionId && data.length > 0) {
      setActiveSessionId(data[0].id);
      loadMessages(data[0].id);
    }
  };

  /** 切换会话并加载该会话历史消息。 */
  const loadMessages = async (sessionId: number) => {
    setActiveSessionId(sessionId);
    setMessages(await aiChatApi.messages(sessionId));
  };

  /** 手动新建空会话。学生直接提问时也可以由后端自动创建。 */
  const createSession = async () => {
    const data = await aiChatApi.createSession();
    setActiveSessionId(data.sessionId);
    setMessages([]);
    loadSessions();
  };

  /** 删除会话后，如果删的是当前会话，就清空右侧消息区。 */
  const deleteSession = async (sessionId: number) => {
    await aiChatApi.deleteSession(sessionId);
    if (activeSessionId === sessionId) {
      setActiveSessionId(undefined);
      setMessages([]);
    }
    loadSessions();
  };

  /** 发送问题，并把 AI 流式回答追加到临时 assistant 消息里。 */
  const send = async () => {
    const text = question.trim();
    if (!text || sending) {
      return;
    }

    setQuestion('');
    setSending(true);

    // 先把学生问题和一个空的 AI 气泡放到页面上，后续 delta 会不断填充这个气泡。
    setMessages((items) => [...items, { role: 'user', content: text }, { role: 'assistant', content: '' }]);

    try {
      await aiChatApi.streamMessage(activeSessionId, text, {
        onDelta(content) {
          // 每个 delta 都追加到最后一条 assistant 消息，形成打字机式展示。
          setMessages((items) => {
            const next = [...items];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content: `${last.content}${content}` };
            return next;
          });
        },
        onDone(data) {
          // 如果这次发送前没有会话，后端会自动创建，并在 done 里返回 sessionId。
          if (data.sessionId && !activeSessionId) {
            setActiveSessionId(data.sessionId);
          }
          setSending(false);
          loadSessions();
        },
        onError(errorMessage) {
          setSending(false);
          message.error(errorMessage);
        },
      });
    } catch (error) {
      setSending(false);
      message.error(error instanceof Error ? error.message : 'AI服务暂时不可用，请稍后重试');
    }
  };

  /** 学生退出登录，清掉本地保存的 token 和签名密钥。 */
  const logout = () => {
    localStorage.removeItem('yanque_student_token');
    localStorage.removeItem('yanque_student_sign_secret');
    localStorage.removeItem('yanque_student_info');
    navigate('/login', { replace: true });
  };

  return (
    <main className="ai-chat-page">
      <header className="home-topbar">
        <div className="home-topbar-left">
          <div className="brand-lockup home-brand">
            <span className="brand-mark">YQ</span>
            <span>YanQue Student</span>
          </div>
          <Button type="text" className="home-nav-link" onClick={() => navigate('/')}>
            首页
          </Button>
          <Button type="text" className="home-nav-link" onClick={() => navigate('/homeworks')}>
            我的作业
          </Button>
          <Button type="text" className="home-nav-link" onClick={() => navigate('/exams')}>
            我的考试
          </Button>
        </div>
        <Space size={12}>
          <Typography.Text type="secondary">{student.phone || '已登录'}</Typography.Text>
          <Button onClick={logout}>退出登录</Button>
        </Space>
      </header>

      <section className="ai-chat-shell">
        <aside className="ai-session-panel">
          <Button type="primary" block onClick={createSession}>
            新建对话
          </Button>
          <List
            className="ai-session-list"
            dataSource={sessions}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无对话" /> }}
            renderItem={(item) => (
              <List.Item
                className={item.id === activeSessionId ? 'ai-session-item active' : 'ai-session-item'}
                onClick={() => loadMessages(item.id)}
                actions={[
                  <Button
                    key="delete"
                    type="text"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteSession(item.id);
                    }}
                  >
                    删除
                  </Button>,
                ]}
              >
                <span className="ai-session-dot" />
                <span>{item.title || '新的对话'}</span>
              </List.Item>
            )}
          />
        </aside>

        <section className="ai-chat-main">
          <div className="ai-chat-header">
            <div>
              <Typography.Title level={3}>AI 学习助教</Typography.Title>
              <Typography.Text type="secondary">围绕编程学习提问，回答会自动保存到当前会话。</Typography.Text>
            </div>
          </div>

          <div className="ai-message-list">
            {messages.length === 0 ? (
              <div className="ai-empty">
                <Typography.Title level={4}>问一个学习问题</Typography.Title>
                <Typography.Text type="secondary">例如：Java 里的接口和抽象类有什么区别？</Typography.Text>
              </div>
            ) : (
              messages.map((item, index) => (
                <div key={`${item.id || index}-${item.role}`} className={`ai-message ${item.role}`}>
                  <div className="ai-message-bubble">{item.content || (item.role === 'assistant' ? '思考中...' : '')}</div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div className="ai-chat-input">
            <Input.TextArea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onPressEnter={(event) => {
                if (!event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="输入你的问题，按 Enter 发送，Shift + Enter 换行"
              autoSize={{ minRows: 2, maxRows: 5 }}
              disabled={sending}
            />
            <Button type="primary" loading={sending} onClick={send}>
              发送
            </Button>
          </div>
        </section>
      </section>
    </main>
  );
}
