import axios from "axios";
import { logout, setAuthActive } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/`,
  withCredentials: true, // send httpOnly cookies with every request
});

// Convenience helper to delete the authenticated user's account
export const deleteAccount = () => api.delete("delete-account/");

// Attempt automatic cookie-based token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(`${API_URL}/api/auth/refresh/`, null, {
          withCredentials: true,
        });
        // Retry the original request — the new access cookie is now set
        return api(originalRequest);
      } catch {
        setAuthActive(false);
        logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
