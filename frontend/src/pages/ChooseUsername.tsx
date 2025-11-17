import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { getUsername } from "../auth";

export default function ChooseUsername() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await api.get<{ display_name: string | null }>("profile/");
        if (res.data.display_name) {
          localStorage.setItem("username", res.data.display_name);
          navigate("/translate", { replace: true });
          return;
        }
      } catch (e) {
        // If request fails, redirect to login (token probably invalid)
        navigate("/login", { replace: true });
        return;
      } finally {
        setLoading(false);
      }
    };
    // If username already in localStorage, skip
    if (getUsername()) {
      navigate("/translate", { replace: true });
    } else {
      checkProfile();
    }
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    try {
      await api.patch("profile/", { display_name: username.trim() });
      localStorage.setItem("username", username.trim());
      navigate("/translate", { replace: true });
    } catch (err: unknown) {
      let msg = "Failed to set username";
      if (typeof err === "object" && err) {
        const axErr = err as AxiosError<{
          display_name?: string[];
          error?: string;
        }>;
        msg =
          axErr.response?.data?.display_name?.[0] ??
          axErr.response?.data?.error ??
          msg;
      }
      setError(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="animate-pulse text-gray-500">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-lg rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
          Welcome to Dumbo! Please enter a Username
        </h1>
        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-800 placeholder-gray-500"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setError(null);
              setUsername(e.target.value);
            }}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 w-full rounded">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
