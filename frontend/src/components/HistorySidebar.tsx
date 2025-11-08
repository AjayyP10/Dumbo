import { useEffect } from "react";

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

export default function HistorySidebar({
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
    <aside
      className={`fixed top-0 right-0 h-full w-72 bg-white shadow-lg border-l border-gray-200 transform transition-transform duration-300 z-40 flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      aria-label="Translation history sidebar"
    >
      <header className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">History</h2>
        <button
          onClick={toggle}
          aria-label="Close history sidebar"
          className="text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          ×
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No translations yet.</p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item);
                toggle();
              }}
              className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <p className="font-medium truncate" title={item.text}>
                {item.text}
              </p>
              <p className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>{item.level}</span>
                <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              </p>
            </button>
          ))
        )}
      </div>

      {items.length > 0 && (
        <button
          onClick={onClear}
          className="m-4 px-4 py-2 text-sm text-accent border border-accent rounded-lg hover:bg-accent-light hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
        >
          Clear history
        </button>
      )}
    </aside>
  );
}