import { useState, useEffect, useRef } from "react";
import type { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { type HistoryItem } from "../components/HistorySidebar";

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
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [level, setLevel] = useState("A1");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("de");

  // Supported languages (code + i18n key)
  const LANGS = [
    { code: "en", key: "english" },
    { code: "de", key: "german" },
    { code: "es", key: "spanish" },
    { code: "fr", key: "french" },
  ] as const;

  // Ensure source and target languages are never identical
  const handleSourceChange = (code: string) => {
    if (code === targetLang) {
      setTargetLang(sourceLang); // swap to previous source language
    }
    setSourceLang(code);
  };

  const handleTargetChange = (code: string) => {
    if (code === sourceLang) {
      setSourceLang(targetLang); // swap to previous target language
    }
    setTargetLang(code);
  };

  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("translationHistory") || "[]");
    } catch {
      return [];
    }
  });

  const saveHistory = (item: HistoryItem) => {
    const updated = [item, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem("translationHistory", JSON.stringify(updated));
  };

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
        source_lang: sourceLang,
        target_lang: targetLang,
      });
      setOutput(res.data.translation);
      // store in history
      saveHistory({
        id: crypto.randomUUID(),
        text: trimmed,
        level,
        translation: res.data.translation,
        timestamp: Date.now(),
      });
      // focus back to textarea for quick edits
      setTimeout(() => textareaRef.current?.focus(), 0);
    } catch (err: unknown) {
      let message = "An unexpected error occurred. Please try again.";
      if (typeof err === "object" && err) {
        const axErr = err as AxiosError<{ detail?: string }>;
        message =
          axErr.response?.data?.detail ??
          (axErr as { message?: string }).message ??
          message;
      }
      setError(message);
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
      <div aria-live="polite" className="sr-only" role="status">
        {loading ? "Translating…" : ""}
      </div>
      {loading && (
        <div className="fixed top-0 left-0 w-0 h-1 bg-primary animate-progress z-50" />
      )}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
        <div className="max-w-5xl mx-auto pt-16 md:pt-10 px-4 pb-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Translate
            </h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Input / controls */}
            <section>
              <label htmlFor="sourceText" className="sr-only">
                English text to translate
              </label>
              <textarea
                id="sourceText"
                disabled={loading}
                aria-busy={loading}
                className={`w-full p-3 border rounded mb-1 min-h-[15rem] max-h-[80vh] resize-none overflow-y-auto transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
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
                placeholder="Enter text to translate"
                ref={textareaRef}
              />
              <p className="text-xs text-gray-500 mb-3">
                {text.length} characters
              </p>

              {/* Language selection row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex-1 min-w-[7rem]">
                  <label htmlFor="sourceLang" className="sr-only">
                    Source language
                  </label>
                  <select
                    id="sourceLang"
                    aria-label="Source language"
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    value={sourceLang}
                    onChange={(e) => handleSourceChange(e.target.value)}
                  >
                    {LANGS.map(({ code, key }) => (
                      <option
                        key={code}
                        value={code}
                        disabled={code === targetLang}
                      >
                        {t(key)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Swap button */}
                <button
                  type="button"
                  aria-label="Swap languages"
                  className="p-2 rounded-full border bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                  onClick={() => {
                    setSourceLang(targetLang);
                    setTargetLang(sourceLang);
                  }}
                >
                  ↔
                </button>

                <div className="flex-1 min-w-[7rem]">
                  <label htmlFor="targetLang" className="sr-only">
                    Target language
                  </label>
                  <select
                    id="targetLang"
                    aria-label="Target language"
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    value={targetLang}
                    onChange={(e) => handleTargetChange(e.target.value)}
                  >
                    {LANGS.map(({ code, key }) => (
                      <option
                        key={code}
                        value={code}
                        disabled={code === sourceLang}
                      >
                        {t(key)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Level + actions row */}
              <div className="flex flex-wrap items-center gap-2">
                {["de", "es", "fr"].includes(targetLang) && (
                  <div>
                    <label htmlFor="readingLevel" className="sr-only">
                      Reading level
                    </label>
                    <select
                      id="readingLevel"
                      aria-label="Select reading level"
                      className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 mr-2"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    >
                      {["A1", "A2", "B1", "B2"].map((lvl) => (
                        <option key={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Action buttons */}
                <button
                  onClick={translate}
                  aria-label="Translate text"
                  disabled={loading || !text.trim()}
                  className={`px-4 py-2 rounded-lg font-medium text-white flex items-center justify-center space-x-2 transition transform-gpu active:scale-95 shadow-card focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${loading || !text.trim() ? "bg-primary-light" : "bg-primary hover:bg-primary-dark"}`}
                >
                  {loading && <SpinnerIcon />}
                  <span>{loading ? t("translating") : t("translate")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setText("");
                    setOutput("");
                    setCopied(false);
                    setError(null);
                    textareaRef.current?.focus();
                  }}
                  aria-label="Clear input and output"
                  disabled={!text && !output}
                  className={`px-4 py-2 rounded-lg border font-medium transition shadow-card focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent ${!text && !output ? "text-gray-400 border-gray-200" : "text-accent border-accent hover:bg-accent-light hover:text-white"}`}
                >
                  {t("clear")}
                </button>
                {error && (
                  <p
                    role="alert"
                    className="text-sm text-red-600"
                    aria-live="assertive"
                  >
                    {error}
                  </p>
                )}
              </div>
            </section>

            {/* Output */}
            <section>
              <div className="border border-gray-100 dark:border-gray-700 rounded-card p-4 bg-white dark:bg-gray-800 shadow-card hover:shadow-lg transition-shadow flex flex-col min-h-[15rem] max-h-[80vh]">
                <div className="flex-1 overflow-y-auto whitespace-pre-wrap mb-3">
                  {loading && !output ? (
                    <div className="space-y-2 animate-pulse" aria-hidden="true">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
                    </div>
                  ) : output ? (
                    <p
                      className="text-black dark:text-gray-100 font-medium cursor-pointer select-text animate-fade-in"
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
