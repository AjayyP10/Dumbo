import { useState, useEffect } from "react";
import { api } from "../api";

type Translation = {
  id: number;
  input_text: string;
  output_text: string;
  level: string;
  created_at: string;
};

export default function Translate() {
  const [text, setText] = useState("");
  const [level, setLevel] = useState("A1");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Translation[]>([]);

  const fetchHistory = async () => {
    const res = await api.get<Translation[]>("history/");
    setHistory(res.data);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const translate = async () => {
    if (!text.trim()) return;
    if (text.length > 500) {
      alert("Text too long (max 500 chars)");
      return;
    }
    setLoading(true);
    try {
      await api.post("translate/", { input_text: text, level });
      setText("");
      fetchHistory();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-xl font-bold mb-4">Translate</h1>
      <textarea
        className="w-full p-2 border mb-2"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter English text (max 500 chars)"
      />
      <select
        className="border p-2 mb-2"
        value={level}
        onChange={(e) => setLevel(e.target.value)}
      >
        {["A1", "A2", "B1", "B2"].map((lvl) => (
          <option key={lvl}>{lvl}</option>
        ))}
      </select>
      <button
        onClick={translate}
        className="bg-blue-600 text-white px-4 py-2 ml-2"
        disabled={loading}
      >
        {loading ? "Translating..." : "Translate"}
      </button>

      <h2 className="text-lg font-semibold mt-8">History</h2>
      <ul className="space-y-4 mt-2">
        {history.map((item) => (
          <li key={item.id} className="border p-3 bg-white">
            <p className="text-sm text-gray-600">{item.level}</p>
            <p className="font-semibold">EN: {item.input_text}</p>
            <p className="text-green-700">DE: {item.output_text}</p>
            <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </>
  );
}