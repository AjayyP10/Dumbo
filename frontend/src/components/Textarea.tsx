import { forwardRef, TextareaHTMLAttributes } from "react";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  loading?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ loading, className = "", ...rest }, ref) => (
    <textarea
      ref={ref}
      aria-busy={loading}
      disabled={loading}
      className={`w-full p-3 border rounded mb-1 min-h-[15rem] max-h-[80vh] resize-none overflow-y-auto transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 ${
        loading ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      {...rest}
    />
  ),
);

Textarea.displayName = "Textarea";
export default Textarea;
