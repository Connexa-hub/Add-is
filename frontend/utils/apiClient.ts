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
 * MIGRATION STATUS: as of this change, only the login and biometric-login
 * flows use this client. ~57 other call sites across frontend/screens still
 * call `axios` directly with a manually-attached bearer token and won't get
 * auto-refresh. That's why the backend's access token TTL is currently 24h
 * instead of the target 15m (see backend/utils/authSession.js) — until
 * those screens are migrated to `apiClient`, a short-lived token would log
 * users out mid-session on any unmigrated screen. Migrating them is
 * mechanical (replace `axios.post(`${API_BASE_URL}/api/...`, body, {headers:
 * {Authorization: ...}})` with `apiClient.post('/api/...', body)`) but
 * touches a lot of files, so it's tracked as a follow-up rather than done
 * blind in this pass.
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
