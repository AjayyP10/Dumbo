import { ButtonHTMLAttributes, PropsWithChildren } from "react";
import SpinnerIcon from "./SpinnerIcon";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function TranslateButton({
  loading,
  children,
  className = "",
  ...rest
}: PropsWithChildren<Props>) {
  return (
    <button
      {...rest}
      disabled={rest.disabled}
      className={`px-4 py-2 rounded-lg font-medium text-white flex items-center justify-center space-x-2 transition transform-gpu active:scale-95 shadow-card focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
        rest.disabled
          ? "bg-primary-light cursor-not-allowed"
          : "bg-primary hover:bg-primary-dark"
      } ${className}`}
    >
      {loading && <SpinnerIcon />}
      {children}
    </button>
  );
}
