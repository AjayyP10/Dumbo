import { useEffect, useState, useRef, useCallback } from "react";
import type { AxiosError } from "axios";
import { Link, NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteAccount } from "../api";
import { logout, getUsername, isLoggedIn } from "../auth";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

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
    <>
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg"
      >
        <div className="max-w-4xl mx-auto flex justify-between items-center p-4">
          <Link
            to="/translate"
            className="font-bold text-xl dark:text-gray-100 flex items-center space-x-2 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 transition-all duration-200"
            aria-label="Dumbo Translator home"
          >
            <img
              src="/icons/dumbo_logo.svg"
              alt="Dumbo logo"
              className="w-7 h-7 flex-shrink-0"
            />
            Dumbo
          </Link>
          <div className="flex items-center md:space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => setDark((d) => !d)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 transition-all duration-200 dark:text-yellow-300"
                title="Toggle dark mode"
                aria-label="Toggle dark mode"
              >
                {dark ? (
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
                      d="M12 3v1.5m0 15V21m8.364-8.364h-1.5M4.136 12.636H2.636m15.728 6.364l-1.06-1.06M6.696 6.696L5.636 5.636m12.728 12.728l-1.06 1.06M6.696 17.304l-1.06 1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                    />
                  </svg>
                ) : (
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
                      d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                    />
                  </svg>
                )}
              </button>
              {isLoggedIn() && (
                <div ref={dropdownRef} className="relative">
                  <button
                    id="user-menu"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 transition-all duration-200"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                    aria-label="User menu"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm shadow-lg">
                      {getUsername()?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-xl rounded-lg border border-gray-200/50 dark:border-gray-700/50 py-1 z-50"
                      role="menu"
                      aria-labelledby="user-menu"
                    >
                      <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                          `flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${isActive ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`
                        }
                        onClick={() => setDropdownOpen(false)}
                        role="menuitem"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 mr-3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm0 0H9"
                          />
                        </svg>
                        Profile
                      </NavLink>
                      <div className="border-t border-gray-100 dark:border-gray-600"></div>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded"
                        role="menuitem"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 mr-3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                          />
                        </svg>
                        {t("logout")}
                      </button>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleDelete();
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded"
                        role="menuitem"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 mr-3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                        Delete Account
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-menu"
            className={`fixed top-0 right-0 w-64 h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-l border-gray-200/50 dark:border-gray-700/50 shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <Link
                  to="/translate"
                  className="font-bold text-xl dark:text-gray-100 flex items-center space-x-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"
                    />
                  </svg>
                  Dumbo
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <nav className="space-y-4">
                <button
                  onClick={() => {
                    setDark((d) => !d);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 flex-shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                    />
                  </svg>
                  Toggle Dark Mode
                </button>
                {isLoggedIn() && (
                  <div className="space-y-2">
                    <span className="block px-3 py-2 text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                      Account
                    </span>
                    <div
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={handleLogout}
                    >
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium">
                        {getUsername()?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {getUsername() || "User"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Logout
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={handleDelete}
                    >
                      <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-medium">
                        D
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Delete Account
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Permanently delete
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
