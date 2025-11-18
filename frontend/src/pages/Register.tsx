import { useState } from "react";
import { api } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [data, setData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("register/", data); // implement later if desired
      navigate("/login");
    } catch {
      setError("Registration failed");
    }
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
            Join the community of <br /> language learners.
          </h2>

          <p
            className="text-xl text-indigo-100/80 max-w-lg leading-relaxed animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Create your account to save your progress, access history across
            devices, and unlock personalized features.
          </p>

          <div className="grid gap-6 mt-8">
            {[
              {
                title: "Save History",
                desc: "Keep track of all your translations",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ),
                color: "bg-blue-500",
              },
              {
                title: "Cross-Device",
                desc: "Access your account anywhere",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                ),
                color: "bg-purple-500",
              },
              {
                title: "Personalized",
                desc: "Adaptive learning experience",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
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

        {/* Right: Register Form */}
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
              <p className="text-indigo-200 text-center mt-2">Join us today</p>
            </div>

            <div className="hidden lg:block mb-8">
              <h2 className="text-3xl font-bold text-white">Create Account</h2>
              <p className="text-indigo-200 mt-2">
                Start your language learning journey
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label
                  className="block text-sm font-medium text-indigo-100 mb-2"
                  htmlFor="username"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-indigo-200/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  placeholder="Choose a username"
                  value={data.username}
                  onChange={(e) =>
                    setData({ ...data, username: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-indigo-100 mb-2"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-indigo-200/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
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
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold shadow-lg shadow-indigo-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex justify-center items-center mt-2"
              >
                Create Account
              </button>
            </form>

            <p className="mt-8 text-center text-indigo-200 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-white hover:text-indigo-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
