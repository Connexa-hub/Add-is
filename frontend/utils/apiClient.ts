import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants/api';
import { tokenService } from './tokenService';

/**
 * Centralized axios client. New screens/hooks should import `apiClient`
 * from here instead of calling `axios` directly, so:
 *   1. the access token is attached automatically (no more manually reading
 *      tokenService/AsyncStorage in every screen), and
 *   2. a 401 with code TOKEN_EXPIRED triggers a silent refresh + retry
 *      instead of bouncing the user back to the login screen.
 *
 * MIGRATION STATUS (complete as of 2026-07-20): every authenticated call
 * site in frontend/screens, frontend/hooks, frontend/src, App.tsx, and
 * NotificationsScreen/etc. now goes through this client. The only
 * remaining raw-`axios` calls are LoginScreen.tsx's own `/login` and
 * `/biometric-login` requests, which are unauthenticated bootstrap calls
 * that don't need refresh handling. Because of this, the backend's access
 * token TTL is the target 15 minutes (backend/utils/authSession.js) rather
 * than a longer bridge value. If a new screen is added with its own direct
 * `axios` call to an authenticated endpoint, it will start failing after
 * 15 minutes with no retry — route it through `apiClient` instead.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenService.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Coalesce concurrent refresh attempts (e.g. three screens all get a 401
  // at once) into a single in-flight request instead of racing the backend
  // with several refresh calls that would each try to rotate the same token.
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await tokenService.getRefreshToken();
      if (!refreshToken) return null;

      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data?.data || {};
      if (!accessToken || !newRefreshToken) return null;

      await tokenService.setTokens(accessToken, newRefreshToken);
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const code = (error.response?.data as any)?.code;

    const isExpired = status === 401 && (code === 'TOKEN_EXPIRED' || code === undefined);
    if (isExpired && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      }
      // Refresh failed — the session is genuinely over. Clear local tokens
      // so the app's existing "no token found" navigation logic sends the
      // user back to login, rather than looping on 401s.
      await tokenService.clearToken();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
