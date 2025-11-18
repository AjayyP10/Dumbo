import React, { memo, useEffect } from "react";

export interface HistoryItem {
  id: string;
  text: string;
  level: string;
  translation: string;
  timestamp: number;
}

interface Props {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  isOpen: boolean;
  toggle: () => void;
}

// Memoized button for each history entry
const HistoryEntry = memo(
  ({
    item,
    onSelect,
    toggle,
  }: {
    item: HistoryItem;
    onSelect: (i: HistoryItem) => void;
    toggle: () => void;
  }) => (
    <button
      onClick={() => {
        onSelect(item);
        toggle();
      }}
      className="w-full text-left p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 group"
    >
      <p
        className="font-medium text-gray-900 dark:text-gray-100 truncate mb-1 text-base"
        title={item.text}
      >
        {item.text}
      </p>
      <p
        className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2"
        title={item.translation}
      >
        {item.translation}
      </p>
      <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500">
        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-medium">
          {item.level}
        </span>
        <span>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </button>
  ),
);
HistoryEntry.displayName = "HistoryEntry";

const HistorySidebar = memo(function HistorySidebar({
  items,
  onSelect,
  onClear,
  isOpen,
  toggle,
}: Props) {
  // Close sidebar with Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, toggle]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={toggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Translation history sidebar"
      >
        <header className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            History
          </h2>
          <button
            onClick={toggle}
            aria-label="Close history sidebar"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 dark:text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mb-4 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>No translation history yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item) => (
                <HistoryEntry
                  key={item.id}
                  item={item}
                  onSelect={onSelect}
                  toggle={toggle}
                />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <button
              onClick={onClear}
              className="w-full px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
            >
              Clear all history
            </button>
          </div>
        )}
      </aside>
    </>
  );
});

export default HistorySidebar;
