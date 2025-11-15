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
  // Decode the email claim that the backend now embeds in the JWT access token.
  const access = getAccessToken();
  if (!access) return null;
  try {
    const decoded: any = jwtDecode(access);
    return decoded?.email || null;
  } catch {
    return null;
  }
};