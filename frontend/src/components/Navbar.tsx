import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteAccount } from "../api";
import { logout, getUsername, isLoggedIn } from "../auth";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      return;
    }
    try {
      await deleteAccount();
      toast.success("Account deleted successfully");
      logout();
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      let msg: string | undefined;
      if (typeof err === "object" && err) {
        const axErr = err as AxiosError<{ detail?: string }>;
        msg =
          axErr.response?.data?.detail ??
          (axErr as { message?: string }).message;
      }
      toast.error(msg || "Failed to delete account");
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow p-4 flex justify-between">
      <Link to="/translate" className="font-bold dark:text-gray-100">
        Dumbo
      </Link>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setDark((d) => !d)}
          className="text-xl focus:outline-none dark:text-yellow-300"
          title="Toggle dark mode"
        >
          {dark ? "🌞" : "🌙"}
        </button>
        {isLoggedIn() && (
          <>
            {location.pathname !== "/history" && (
              <Link
                to="/history"
                className="mr-2 text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t("history")}
              </Link>
            )}
            <span className="mr-2 dark:text-gray-100">
              {t("hello", { name: getUsername() ?? "User" })}
            </span>
            <button
              onClick={handleLogout}
              className="text-blue-600 dark:text-blue-400"
            >
              {t("logout")}
            </button>
            <button
              onClick={handleDelete}
              className="text-red-600 dark:text-red-400"
            >
              Delete Account
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
