import {
  clearSession,
  getToken,
} from '@/features/auth/storage/session-storage';
import axios from 'axios';
import { ApiError } from './api-error';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: { indexes: null },
});

function isAuthRequest(url?: string): boolean {
  if (!url) return false;

  const path = url
    .replace(/^https?:\/\/[^/]+/i, '')
    .split(/[?#]/, 1)[0]
    .replace(/^\/?/, '/');

  return path === '/auth' || path.startsWith('/auth/');
}

// Injeta o JWT em toda requisição, quando houver sessão
httpClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !isAuthRequest(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    // 401 com token enviado = token expirado/inválido: limpa e volta ao login.
    // Sem token, o 401 é só "não autenticado" (o guard de rotas cuida disso).
    const hadToken = Boolean(error.config?.headers?.Authorization);
    if (
      error.response?.status === 401 &&
      hadToken &&
      !isAuthRequest(error.config?.url)
    ) {
      clearSession();
      if (window.location.pathname !== '/entrar') {
        window.location.assign('/entrar');
      }
    }
    return Promise.reject(ApiError.from(error));
  },
);
