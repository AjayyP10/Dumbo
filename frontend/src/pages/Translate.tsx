import { useState, useEffect, useRef } from "react";
import { useTranslation as useI18n } from "react-i18next";
import { type HistoryItem } from "../components/HistorySidebar";
import HistorySidebar from "../components/HistorySidebar";
import { useTranslation } from "../hooks/useTranslation";

// Simple hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Translate() {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [level, setLevel] = useState("A1");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("de");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Debounce the text input for the query
  const debouncedText = useDebounce(text, 500);

  // Use the React Query hook
  const { data, isLoading, error, isFetching } = useTranslation(
    debouncedText,
    targetLang,
    level,
  );

  const output = data?.translation || "";

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

  // Save to history when we get a new valid translation
  useEffect(() => {
    if (data?.translation && debouncedText) {
      // Avoid saving if it's already the most recent item
      if (
        history.length > 0 &&
        history[0].text === debouncedText &&
        history[0].translation === data.translation
      ) {
        return;
      }

      saveHistory({
        id: crypto.randomUUID(),
        text: debouncedText,
        level,
        translation: data.translation,
        timestamp: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, debouncedText, level]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const outputTextRef = useRef<HTMLParagraphElement | null>(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <>
      <div aria-live="polite" className="sr-only" role="status">
        {isFetching ? "Translating…" : ""}
      </div>
      {isFetching && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 animate-pulse" />
      )}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
        <div className="max-w-5xl mx-auto pt-16 md:pt-10 px-4 pb-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Translate
            </h1>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              History
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Input / controls */}
            <section className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
                <label htmlFor="sourceText" className="sr-only">
                  Text to translate
                </label>
                <textarea
                  id="sourceText"
                  className={`w-full p-4 border-0 rounded-t-2xl min-h-[15rem] max-h-[80vh] resize-none overflow-y-auto transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 text-lg`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setText("");
                      setCopied(false);
                    }
                  }}
                  placeholder="Enter text to translate..."
                  ref={textareaRef}
                />
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    {text.length} characters
                  </p>
                </div>
              </div>

              {/* Language selection row */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[8rem]">
                  <label htmlFor="sourceLang" className="sr-only">
                    Source language
                  </label>
                  <select
                    id="sourceLang"
                    aria-label="Source language"
                    className="w-full border-2 border-gray-200 dark:border-gray-700 p-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:bg-gray-800 dark:text-gray-100 font-medium transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
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
                  className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 transform hover:scale-110 active:scale-95"
                  onClick={() => {
                    setSourceLang(targetLang);
                    setTargetLang(sourceLang);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                    />
                  </svg>
                </button>

                <div className="flex-1 min-w-[8rem]">
                  <label htmlFor="targetLang" className="sr-only">
                    Target language
                  </label>
                  <select
                    id="targetLang"
                    aria-label="Target language"
                    className="w-full border-2 border-gray-200 dark:border-gray-700 p-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:bg-gray-800 dark:text-gray-100 font-medium transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
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
              <div className="flex flex-wrap items-center gap-3">
                {["de", "es", "fr"].includes(targetLang) && (
                  <div>
                    <label htmlFor="readingLevel" className="sr-only">
                      Reading level
                    </label>
                    <select
                      id="readingLevel"
                      aria-label="Select reading level"
                      className="border-2 border-gray-200 dark:border-gray-700 p-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:bg-gray-800 dark:text-gray-100 font-medium transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
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
                  type="button"
                  onClick={() => {
                    setText("");
                    setCopied(false);
                    textareaRef.current?.focus();
                  }}
                  aria-label="Clear input and output"
                  disabled={!text && !output}
                  className={`px-6 py-3 rounded-xl border-2 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg ${!text && !output ? "text-gray-400 border-gray-200 cursor-not-allowed" : "text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 dark:border-red-700"}`}
                >
                  {t("clear")}
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4 animate-slide-in"
                  aria-live="assertive"
                >
                  <p className="text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
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
                    {error instanceof Error
                      ? error.message
                      : "An error occurred"}
                  </p>
                </div>
              )}
            </section>

            {/* Output */}
            <section>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700 p-6 flex flex-col min-h-[15rem] max-h-[80vh]">
                <div className="flex-1 overflow-y-auto whitespace-pre-wrap mb-4">
                  {isLoading && !output ? (
                    <div className="space-y-3 animate-pulse" aria-hidden="true">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-3/4 animate-shimmer" />
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-5/6 animate-shimmer" />
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-2/3 animate-shimmer" />
                    </div>
                  ) : output ? (
                    <p
                      className="text-gray-900 dark:text-gray-100 text-lg leading-relaxed cursor-pointer select-text animate-fade-in"
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
                      <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-10 h-10 text-indigo-500 dark:text-indigo-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"
                          />
                        </svg>
                      </div>
                      <p className="text-center font-medium">
                        Your translated text will appear here
                      </p>
                      <p className="text-sm text-center mt-2">
                        Type to translate automatically
                      </p>
                    </div>
                  )}
                </div>
                {output && (
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(output);
                      setCopied(true);
                    }}
                    className="self-end px-4 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 font-medium transition-all duration-200 flex items-center gap-2 transform hover:scale-105 active:scale-95"
                  >
                    {copied ? (
                      <>
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
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                          />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
      <HistorySidebar
        items={history}
        onSelect={(item) => {
          setText(item.text);
          setLevel(item.level);
          setIsHistoryOpen(false);
        }}
        onClear={() => {
          setHistory([]);
          localStorage.removeItem("translationHistory");
        }}
        isOpen={isHistoryOpen}
        toggle={() => setIsHistoryOpen(false)}
      />
    </>
  );
}
