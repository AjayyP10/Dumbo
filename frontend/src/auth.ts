import jwt from "jsonwebtoken";

export const saveToken = (token: string) => localStorage.setItem("token", token);
export const logout = () => localStorage.removeItem("token");
export const isLoggedIn = () => Boolean(localStorage.getItem("token"));
export const getUser = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const decoded = jwt.decode(token) as { username?: string };
  return decoded?.username || "User";
};