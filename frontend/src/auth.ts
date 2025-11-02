import jwtDecode from "jwt-decode";

export const saveTokens = (access: string, refresh: string) => {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
};

export const logout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

export const getAccessToken = () => localStorage.getItem("access");
export const getRefreshToken = () => localStorage.getItem("refresh");
export const isLoggedIn = () => Boolean(getAccessToken());

export const getUser = () => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<{ username?: string }>(token);
    return decoded?.username || "User";
  } catch {
    return "User";
  }
};