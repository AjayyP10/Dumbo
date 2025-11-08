import { PropsWithChildren, ReactNode } from "react";

interface Props {
  loading: boolean;
  output: string;
  copied: boolean;
  onCopy: () => void;
}

export default function OutputCard({
  loading,
  output,
  copied,
  onCopy,
}: PropsWithChildren<Props>) {
  return (
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
            onClick={() => {
              const range = document.createRange();
              range.selectNodeContents(
                document.getSelection()?.anchorNode?.parentElement || document.body
              );
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
          onClick={onCopy}
          className="self-end text-sm text-blue-600 hover:underline"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      )}
    </div>
  );
}