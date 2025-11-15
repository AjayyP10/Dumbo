import axios from "axios";
import { getAccessToken, getRefreshToken, saveTokens, logout } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/`,
});

// Convenience helper to delete the authenticated user's account
export const deleteAccount = () => api.delete("delete-account/");

// Attach access token before each request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = {
      ...(config.headers as Record<string, unknown>),
      Authorization: `Bearer ${token}`,
    } as typeof config.headers;
  }
  return config;
});

// Attempt automatic token refresh on 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refresh = getRefreshToken();
      if (!refresh) {
        logout();
        return Promise.reject(error);
      }
      try {
        const res = await axios.post(`${API_URL}/api/token/refresh/`, { refresh });
        const newAccess = res.data.access;
        const newRefresh = res.data.refresh || refresh; // use rotated token if provided
        saveTokens(newAccess, newRefresh);
        originalRequest._retry = true;
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newAccess}`,
        };
        return api(originalRequest);
      } catch (refreshErr) {
        logout();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);