import { useState } from "react";
import { api } from "../api";
import { saveTokens } from "../auth";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Login() {
  const navigate = useNavigate();
  const [data, setData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ access: string; refresh: string }>(
        "token/",
        data,
      );
      saveTokens(res.data.access, res.data.refresh);
      localStorage.setItem("username", data.username);
      navigate("/translate");
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-lg rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
          Welcome
        </h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-800 placeholder-gray-500"
            placeholder="Username"
            value={data.username}
            onChange={(e) => setData({ ...data, username: e.target.value })}
          />
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-800 placeholder-gray-500"
            placeholder="Password"
            type="password"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded"
            >
              Login
            </button>
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                // Clear any client-side cached username and server-side session to avoid
                // leaking the previous Google account’s profile when switching users.
                localStorage.removeItem("username");
                // Proactively clear any social-auth cookies that Django may have set
                document.cookie.split(";").forEach((c) => {
                  const [name] = c.trim().split("=");
                  if (name.startsWith("social-auth")) {
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                  }
                });
                try {
                  await fetch(`${API_URL}/api/logout/`, {
                    method: "POST",
                    credentials: "include",
                  });
                } catch (_) {
                  /* network errors can be ignored – we clear localStorage anyway */
                }
                // After ensuring server-side logout, redirect to Google OAuth login
                window.location.href = `${API_URL}/api/oauth/login/google-oauth2/?prompt=select_account`;
              }}
              className="px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-100 flex items-center justify-center"
            >
              {/* Google logo */}
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 533.5 544.3"
              >
                <path
                  fill="#4285F4"
                  d="M533.5 278.4c0-17.4-1.4-34-4-50.2H272.1v95.1h146.9c-6.3 34-25 62.9-53.5 82.2v68h86.5c50.8-46.8 81.5-115.7 81.5-195.1z"
                />
                <path
                  fill="#34A853"
                  d="M272.1 544.3c72.3 0 132.8-23.9 177-64.9l-86.5-68c-23.6 15.5-54 24.6-90.5 24.6-69.6 0-128.5-46.9-149.4-109.5H34.4v68.8c44 87.4 135.1 149 237.7 149z"
                />
                <path
                  fill="#FBBC05"
                  d="M122.7 326.6c-10.1-29.7-10.1-61.4 0-91.1V166.7H34.4c-36.8 73.3-36.8 160.8 0 234.1l88.3-69.5z"
                />
                <path
                  fill="#EA4335"
                  d="M272.1 107.5c39.3-.6 75.8 14 103.8 40.9l77.8-77.8C415.1 24 347.5 0 272.1 0 169.5 0 78.4 61.6 34.4 149l88.3 69.5c20.9-62.5 79.8-109.5 149.4-109.5z"
                />
              </svg>
            </button>
          </div>
        </form>
        {/* Google OAuth login */}
        <div className="mt-4 hidden">
          <a
            href={`${API_URL}/api/oauth/login/google-oauth2/`}
            className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-100"
          >
            {/* Google logo (simple G icon) */}
            <svg
              className="w-5 h-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 533.5 544.3"
            >
              <path
                fill="#4285F4"
                d="M533.5 278.4c0-17.4-1.4-34-4-50.2H272.1v95.1h146.9c-6.3 34-25 62.9-53.5 82.2v68h86.5c50.8-46.8 81.5-115.7 81.5-195.1z"
              />
              <path
                fill="#34A853"
                d="M272.1 544.3c72.3 0 132.8-23.9 177-64.9l-86.5-68c-23.6 15.5-54 24.6-90.5 24.6-69.6 0-128.5-46.9-149.4-109.5H34.4v68.8c44 87.4 135.1 149 237.7 149z"
              />
              <path
                fill="#FBBC05"
                d="M122.7 326.6c-10.1-29.7-10.1-61.4 0-91.1V166.7H34.4c-36.8 73.3-36.8 160.8 0 234.1l88.3-69.5z"
              />
              <path
                fill="#EA4335"
                d="M272.1 107.5c39.3-.6 75.8 14 103.8 40.9l77.8-77.8C415.1 24 347.5 0 272.1 0 169.5 0 78.4 61.6 34.4 149l88.3 69.5c20.9-62.5 79.8-109.5 149.4-109.5z"
              />
            </svg>
            Sign in with Google
          </a>
        </div>
        <p className="mt-6 text-center text-sm text-gray-700">
          No account?{" "}
          <Link
            to="/register"
            className="text-indigo-700 font-medium underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
