import { useEffect, useState } from "react";
import { api } from "../api";

interface LogItem {
  id: number;
  timestamp: string;
  successful: boolean;
  ip_address: string;
}

export default function LoginLogs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get<LogItem[]>("login-logs/");
        setLogs(res.data);
      } catch {
        setError("Failed to load login logs.");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-pulse text-gray-500">Loading…</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 mt-8 text-center">{error}</div>;
  }

  if (logs.length === 0) {
    return (
      <p className="text-gray-600 mt-8 text-center">
        No login attempts.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      {logs.map((l) => (
        <div
          key={l.id}
          className="border p-4 rounded bg-white shadow-sm flex justify-between"
        >
          <span>{new Date(l.timestamp).toLocaleString()}</span>
          <span className={l.successful ? "text-green-600" : "text-red-600"}>
            {l.successful ? "Success" : "Failed"}
          </span>
          <span className="text-gray-500">{l.ip_address}</span>
        </div>
      ))}
    </section>
  );
}