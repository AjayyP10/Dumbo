import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useEffect } from "react";
import { isLoggedIn } from "./auth";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function App() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, [navigate]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Navbar />
      <main className="max-w-4xl mx-auto p-4">
        <Outlet />
      </main>
    </>
  );
}