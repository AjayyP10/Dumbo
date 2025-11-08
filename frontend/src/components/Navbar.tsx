import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout, getUsername, isLoggedIn } from "../auth";

export default function Navbar() {
  const navigate = useNavigate();
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
            <Link to="/history" className="mr-2 text-blue-600 dark:text-blue-400 hover:underline">
              History
            </Link>
            <span className="mr-2 dark:text-gray-100">Hello {getUsername() ?? "User"}</span>
            <button onClick={handleLogout} className="text-blue-600 dark:text-blue-400">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}