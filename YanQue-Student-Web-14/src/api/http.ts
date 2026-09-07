import axios from 'axios';
import { message } from 'antd';
import CryptoJS from 'crypto-js';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

const http = axios.create({
  baseURL: '/yq-admin',
  timeout: 15000,
});

const createNonce = () => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const appendParams = (searchParams: URLSearchParams, params: unknown) => {
  if (!params || typeof params !== 'object') {
    return;
  }
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }
    searchParams.append(key, String(value));
  });
};

const buildSignTarget = (baseURL: string | undefined, requestUrl: string | undefined, params: unknown) => {
  const url = new URL(`${baseURL || ''}${requestUrl || ''}`, window.location.origin);
  appendParams(url.searchParams, params);
  return {
    uri: url.pathname,
    query: url.searchParams.toString(),
  };
};

const hmacSha256Hex = async (source: string, secret: string) => {
  // The public HTTP entrypoint is not a secure browser context, where
  // crypto.subtle is unavailable. Keep the backend signing contract intact.
  if (!window.crypto?.subtle) {
    return CryptoJS.HmacSHA256(source, secret).toString(CryptoJS.enc.Hex);
  }
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
};

const isPendingPaySignedUrl = (url?: string) => {
  if (!url) {
    return false;
  }
  const path = new URL(url, window.location.origin).pathname;
  return path.startsWith('/student/pending/');
};

const isStudentFrontSignedUrl = (url?: string) => {
  if (!url) {
    return false;
  }
  const path = new URL(url, window.location.origin).pathname;
  return path.startsWith('/student/') && path !== '/student/login' && !path.startsWith('/student/pending/');
};

http.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('yanque_student_token');
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  if (isPendingPaySignedUrl(config.url)) {
    const pendingPayToken = localStorage.getItem('yanque_pending_pay_token');
    const pendingPaySignSecret = localStorage.getItem('yanque_pending_pay_sign_secret');
    if (pendingPayToken && pendingPaySignSecret) {
      const timestamp = String(Date.now());
      const nonce = createNonce();
      const method = (config.method || 'GET').toUpperCase();
      const target = buildSignTarget(config.baseURL, config.url, config.params);
      const source = `${method}\n${target.uri}\n${target.query}\n${timestamp}\n${nonce}`;
      const sign = await hmacSha256Hex(source, pendingPaySignSecret);
      config.headers.set('X-Pending-Pay-Token', pendingPayToken);
      config.headers.set('X-Timestamp', timestamp);
      config.headers.set('X-Nonce', nonce);
      config.headers.set('X-Sign', sign);
    }
  } else if (isStudentFrontSignedUrl(config.url)) {
    const studentSignSecret = localStorage.getItem('yanque_student_sign_secret');
    if (token && studentSignSecret) {
      const timestamp = String(Date.now());
      const nonce = createNonce();
      const method = (config.method || 'GET').toUpperCase();
      const target = buildSignTarget(config.baseURL, config.url, config.params);
      const source = `${method}\n${target.uri}\n${target.query}\n${timestamp}\n${nonce}`;
      const sign = await hmacSha256Hex(source, studentSignSecret);
      config.headers.set('X-Timestamp', timestamp);
      config.headers.set('X-Nonce', nonce);
      config.headers.set('X-Sign', sign);
    }
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>;
    if (body && typeof body.code === 'number' && body.code !== 200) {
      message.error(body.message || '请求失败');
      return Promise.reject(new Error(body.message || '请求失败'));
    }
    // PageHelper uses `list`, while student pages use the shared `records` pagination shape.
    if (body?.data && typeof body.data === 'object' && 'list' in body.data && !('records' in body.data)) {
      (body.data as Record<string, unknown>).records = (body.data as Record<string, unknown>).list;
    }
    return body?.data ?? response.data;
  },
  (error) => {
    message.error(error?.response?.data?.message || error.message || '网络异常');
    return Promise.reject(error);
  },
);

export default http;
