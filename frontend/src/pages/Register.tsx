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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-lg rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6">Create Account</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-800 placeholder-gray-500"
            placeholder="Username"
            value={data.username}
            onChange={(e) => setData({ ...data, username: e.target.value })}
          />
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-800 placeholder-gray-500"
            placeholder="Email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-800 placeholder-gray-500"
            placeholder="Password"
            type="password"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 w-full rounded">
            Register
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-700">
          Have an account?{" "}
          <Link to="/login" className="text-indigo-700 font-medium underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}