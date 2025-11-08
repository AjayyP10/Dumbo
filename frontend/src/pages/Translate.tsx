import { useState, useEffect, useRef } from "react";
import { api } from "../api";

function SpinnerIcon() {
  return (
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
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
      />
    </svg>
  );
}

export default function Translate() {
  const [text, setText] = useState("");
  const [level, setLevel] = useState("A1");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const outputTextRef = useRef<HTMLParagraphElement | null>(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);


  const translate = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Prevent spamming the exact same request repeatedly

    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ translation: string }>("translate/", {
        input_text: trimmed,
        level,
      });
      setOutput(res.data.translation);
      // focus back to textarea for quick edits
      setTimeout(() => textareaRef.current?.focus(), 0);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  // Reset "Copied" label after 2 seconds
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);


  return (
    <>
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-500 animate-pulse z-50" />
      )}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-5xl mx-auto pt-16 md:pt-10 px-4 pb-10">
        <h1 className="text-xl font-bold mb-6">Translate</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Input / controls */}
          <section>
            <textarea
              disabled={loading}
              className={`w-full p-3 border rounded mb-1 min-h-[15rem] max-h-[80vh] resize-none overflow-y-auto transition-opacity ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  translate();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setText("");
                  setOutput("");
                  setCopied(false);
                  setError(null);
                }
              }}
              placeholder="Enter English text"
              ref={textareaRef}
            />
            <p className="text-xs text-gray-500 mb-3">{text.length} characters</p>
            <div className="flex items-center space-x-2">
              <select
                className="border p-2 rounded"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                {["A1", "A2", "B1", "B2"].map((lvl) => (
                  <option key={lvl}>{lvl}</option>
                ))}
              </select>
              <button
                onClick={translate}
                disabled={loading || !text.trim()}
                className={`px-4 py-2 rounded text-white flex items-center justify-center space-x-2 ${loading || !text.trim() ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {loading && <SpinnerIcon />}
                <span>{loading ? "Translating..." : "Translate"}</span>
              </button>
              <button
                onClick={() => {
                  setText("");
                  setOutput("");
                  setCopied(false);
                  setError(null);
                  textareaRef.current?.focus();
                }}
                disabled={!text && !output}
                className={`px-4 py-2 rounded border border-gray-300 ${!text && !output ? "text-gray-400" : "text-gray-700 hover:bg-gray-100"}`}
              >
                Clear
              </button>
              {error && (
                <p
                  role="alert"
                  className="mt-2 text-sm text-red-600"
                  aria-live="assertive"
                >
                  {error}
                </p>
              )}
            </div>
          </section>

          {/* Output */}
          <section>
            <div className="border rounded p-4 bg-white shadow-sm hover:shadow-lg transition-shadow flex flex-col min-h-[15rem] max-h-[80vh]">
              <div className="flex-1 overflow-y-auto whitespace-pre-wrap mb-3">
                {output ? (
                  <p
                    className="text-black font-bold cursor-pointer select-text"
                    ref={outputTextRef}
                    onClick={() => {
                      if (outputTextRef.current) {
                        const range = document.createRange();
                        range.selectNodeContents(outputTextRef.current);
                        const sel = window.getSelection();
                        sel?.removeAllRanges();
                        sel?.addRange(range);
                      }
                    }}
                  >
                    {output}
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-10 h-10 mb-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4m-6 4h6m7 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p>Your translated text will appear here.</p>
                  </div>
                )}
              </div>
              {output && (
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(output);
                    setCopied(true);
                  }}
                  className="self-end text-sm text-blue-600 hover:underline"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  </>
  );
}