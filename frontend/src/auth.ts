import jwtDecode from "jwt-decode";

export const saveTokens = (access: string, refresh: string) => {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
};

export const logout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("username");
};

export const getAccessToken = () => localStorage.getItem("access");
export const getRefreshToken = () => localStorage.getItem("refresh");
export const isLoggedIn = () => Boolean(getAccessToken());

export const getUsername = (): string | null => {
  const stored = localStorage.getItem("username");
  if (stored) return stored;
  // Fallback to decoding token if username not saved explicitly
  const token = getAccessToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<{ username?: string }>(token);
    return decoded?.username || null;
  } catch {
    return null;
  }
};