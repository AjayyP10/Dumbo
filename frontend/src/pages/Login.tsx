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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "1s" }}
        ></div>
        <div
          className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] bg-pink-600/20 rounded-full blur-[80px] animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left: Brand & Features */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 pr-12">
          <div className="flex items-center space-x-4 mb-4 animate-fade-in">
            <img
              src="/icons/dumbo_logo.svg"
              alt="Dumbo Logo"
              className="w-16 h-16 drop-shadow-lg"
            />
            <h1 className="text-6xl font-black text-white tracking-tight">
              Dumbo
            </h1>
          </div>

          <h2
            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200 leading-tight animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Master languages with <br /> precise CEFR-level translations.
          </h2>

          <p
            className="text-xl text-indigo-100/80 max-w-lg leading-relaxed animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Your personal AI-powered translator that adapts to your proficiency
            level. Learn faster with context-aware translations.
          </p>

          <div className="grid gap-6 mt-8">
            {[
              {
                title: "CEFR Levels",
                desc: "A1 to B2 tailored complexity",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                  />
                ),
                color: "bg-blue-500",
              },
              {
                title: "Offline Ready",
                desc: "Works seamlessly without internet",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                  />
                ),
                color: "bg-purple-500",
              },
              {
                title: "Instant Results",
                desc: "Smart caching & async processing",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                ),
                color: "bg-pink-500",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors animate-fade-in"
                style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
              >
                <div
                  className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center shadow-lg shrink-0`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="white"
                    className="w-6 h-6"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-indigo-200 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="w-full max-w-md mx-auto">
          <div
            className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            {/* Mobile Logo View */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <img
                src="/icons/dumbo_logo.svg"
                alt="Dumbo Logo"
                className="w-16 h-16 mb-4 drop-shadow-lg"
              />
              <h1 className="text-3xl font-black text-white">Dumbo</h1>
              <p className="text-indigo-200 text-center mt-2">
                Sign in to continue your journey
              </p>
            </div>

            <div className="hidden lg:block mb-8">
              <h2 className="text-3xl font-bold text-white">Welcome back</h2>
              <p className="text-indigo-200 mt-2">
                Enter your details to access your account
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium text-indigo-100 mb-2"
                  htmlFor="username"
                >
                  Username or Email
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-indigo-200/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  placeholder="Enter your username"
                  value={data.username}
                  onChange={(e) =>
                    setData({ ...data, username: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-indigo-100 mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-indigo-200/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  value={data.password}
                  onChange={(e) =>
                    setData({ ...data, password: e.target.value })
                  }
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-100 text-sm flex items-center gap-2 animate-shake">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5 shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold shadow-lg shadow-indigo-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
                    ></path>
                  </svg>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-indigo-200">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="mt-6 w-full py-3.5 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>
            </div>

            <p className="mt-8 text-center text-indigo-200 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-white hover:text-indigo-300 transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
