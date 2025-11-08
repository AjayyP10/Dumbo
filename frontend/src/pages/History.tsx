import { useEffect, useState } from "react";
import { api } from "../api";

interface HistoryItem {
  id: number;
  input_text: string;
  output_text: string;
  level: string;
  created_at: string;
}

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get<HistoryItem[]>("history/");
        setItems(res.data);
      } catch (err) {
        setError("Failed to load history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-pulse text-gray-500">Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center mt-8">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-600 mt-8">
        No translations yet.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {items.map((h) => (
        <div
          key={h.id}
          className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white"
        >
          <div className="flex justify-between mb-2 text-sm text-gray-500">
            <span>Level: {h.level}</span>
            <span>{new Date(h.created_at).toLocaleString()}</span>
          </div>
          <p className="font-medium text-gray-800">{h.input_text}</p>
          <p className="mt-2 text-indigo-700">{h.output_text}</p>
        </div>
      ))}
    </section>
  );
}