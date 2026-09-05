import http from './http';
import type { AiChatMessage, AiChatSession } from '../types/student';

/**
 * 流式问答回调。
 *
 * delta 会被调用很多次，每次只是一小段文本；
 * done 表示回答结束；error 表示后端或 AI 服务出错。
 */
interface StreamCallbacks {
  onDelta(content: string): void;
  onDone(data: { sessionId?: number; model?: string; usage?: { total_tokens?: number } }): void;
  onError(message: string): void;
}

export const aiChatApi = {
  sessions() {
    return http.get<never, AiChatSession[]>('/student/ai/sessions');
  },
  createSession() {
    return http.post<never, { sessionId: number }>('/student/ai/sessions');
  },
  messages(sessionId: number) {
    return http.get<never, AiChatMessage[]>(`/student/ai/sessions/${sessionId}/messages`);
  },
  deleteSession(sessionId: number) {
    return http.delete<never, void>(`/student/ai/sessions/${sessionId}`);
  },
  streamMessage(sessionId: number | undefined, question: string, callbacks: StreamCallbacks) {
    return streamMessage(sessionId, question, callbacks);
  },
};

/**
 * 发送问题并读取 SSE 流。
 *
 * 这里不用项目里的 http/axios 封装，因为普通 JSON 请求通常会等响应结束。
 * fetch + reader 可以边收到后端推送的字节，边更新页面上的 AI 回答。
 */
async function streamMessage(sessionId: number | undefined, question: string, callbacks: StreamCallbacks) {
  const path = '/student/ai/messages/stream';
  const response = await fetch(`/yq-admin${path}`, {
    method: 'POST',
    headers: await buildStudentHeaders(path),
    body: JSON.stringify({ sessionId, question }),
  });

  if (!response.ok || !response.body) {
    callbacks.onError('AI服务暂时不可用，请稍后重试');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    // 浏览器每次读到的不一定正好是一条完整 SSE，所以先放进 buffer。
    buffer += decoder.decode(value, { stream: true });

    // SSE 用空行分隔事件；最后一段可能还没收完整，留到下一轮继续拼。
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';
    blocks.forEach((block) => handleEvent(block, callbacks));
  }

  // 流结束时，如果 buffer 里还剩最后一条事件，也要处理掉。
  if (buffer.trim()) {
    handleEvent(buffer, callbacks);
  }
}

/** 解析一条 SSE 事件，并按 event 类型分发给页面。 */
function handleEvent(block: string, callbacks: StreamCallbacks) {
  let event = '';
  const dataLines: string[] = [];
  block.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim());
    }
  });

  const data = dataLines.join('\n') || '{}';
  const payload = JSON.parse(data);
  console.debug('[AI SSE]', new Date().toISOString(), event, payload);
  if (event === 'delta') {
    callbacks.onDelta(payload.content || '');
  } else if (event === 'done') {
    callbacks.onDone(payload);
  } else if (event === 'error') {
    callbacks.onError(payload.message || 'AI服务暂时不可用，请稍后重试');
  }
}

/**
 * 生成学生端签名请求头。
 *
 * 这条接口绕过了 axios，所以要手动带上 token、timestamp、nonce、sign。
 * 签名串格式需要和 Java 后端 SignInterceptor 保持一致。
 */
async function buildStudentHeaders(path: string) {
  const token = localStorage.getItem('yanque_student_token') || '';
  const secret = localStorage.getItem('yanque_student_sign_secret') || '';
  const timestamp = String(Date.now());
  const nonce = createNonce();
  const source = ['POST', `/yq-admin${path}`, '', timestamp, nonce].join('\n');
  const sign = await hmacSha256Hex(source, secret);

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Sign': sign,
  };
}

/** 生成一次性随机串，后端会用它防止请求重放。 */
function createNonce() {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** 用浏览器 Web Crypto 算 HMAC-SHA256，结果转成十六进制字符串。 */
async function hmacSha256Hex(source: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await window.crypto.subtle.sign('HMAC', key, encoder.encode(source));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
