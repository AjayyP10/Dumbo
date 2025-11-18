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

  const handleGoogleLogin = async (e: React.MouseEvent) => {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center lg:items-start">
        {/* Left: Landing Intro & Features */}
        <div className="flex-1 lg:w-1/2 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Dumbo
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Master German, Spanish, and French at your pace with precise
            CEFR-level translations. Offline-first PWA for seamless learning
            anywhere.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-3">
                CEFR Levels
              </h3>
              <p className="text-white/80">
                A1 basic to B2 fluent—tailored styles & complexity.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-3">
                Offline PWA
              </h3>
              <p className="text-white/80">
                Installable app, works without internet.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 md:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-3">
                Fast & Smart
              </h3>
              <p className="text-white/80">
                History, caching, async processing for instant results.
              </p>
            </div>
          </div>
        </div>
        {/* Right: Login Form */}
        <div className="w-full lg:w-1/3 max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/50">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Sign In
          </h2>
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <input
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-semibold text-lg text-gray-800 placeholder-gray-500 transition-all shadow-inner"
                placeholder="Username or Email"
                value={data.username}
                onChange={(e) => setData({ ...data, username: e.target.value })}
              />
            </div>
            <div>
              <input
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-semibold text-lg text-gray-800 placeholder-gray-500 transition-all shadow-inner"
                placeholder="Password"
                type="password"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
              />
            </div>
            {error && (
              <p className="text-red-600 text-center font-medium bg-red-100/50 rounded-xl p-3">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Sign In
            </button>
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-xl border border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
              >
                <svg
                  className="w-6 h-6"
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
                <span>Google</span>
              </button>
            </div>
          </form>
          <p className="mt-8 text-center text-sm text-gray-600">
            No account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
