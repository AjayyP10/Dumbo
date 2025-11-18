import { useState } from "react";
import { api } from "../api";
import { saveTokens } from "../auth";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Login() {
  const navigate = useNavigate();
  const [data, setData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    // Clear any client-side cached username and server-side session to avoid
    // leaking the previous Google account's profile when switching users.
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        ></div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center lg:items-start relative z-10">
        {/* Left: Landing Intro & Features */}
        <div className="flex-1 lg:w-1/2 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight animate-fade-in">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Dumbo
            </span>
          </h1>
          <p
            className="text-xl md:text-2xl text-white/90 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Master German, Spanish, and French at your pace with precise
            CEFR-level translations. Offline-first PWA for seamless learning
            anywhere.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:scale-105 hover:shadow-2xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="white"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                CEFR Levels
              </h3>
              <p className="text-white/80">
                A1 basic to B2 fluent—tailored styles & complexity.
              </p>
            </div>
            <div
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:scale-105 hover:shadow-2xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="white"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Offline PWA
              </h3>
              <p className="text-white/80">
                Installable app, works without internet.
              </p>
            </div>
            <div
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:scale-105 hover:shadow-2xl transition-all duration-300 md:col-span-2 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="white"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                </svg>
              </div>
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
        <div
          className="w-full lg:w-1/3 max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/50 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Sign In
          </h2>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="relative">
              <input
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 font-semibold text-lg text-gray-800 placeholder-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
                placeholder="Username or Email"
                value={data.username}
                onChange={(e) => setData({ ...data, username: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <input
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 font-semibold text-lg text-gray-800 placeholder-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
                placeholder="Password"
                type="password"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 animate-slide-in">
                <p className="text-red-700 font-medium flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                  {error}
                </p>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  Or continue with
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-3 group"
            >
              <svg
                className="w-6 h-6 group-hover:scale-110 transition-transform"
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
              <span>Continue with Google</span>
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-gray-600">
            No account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
