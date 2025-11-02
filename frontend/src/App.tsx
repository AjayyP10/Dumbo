import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useEffect } from "react";
import { isLoggedIn } from "./auth";

export default function App() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, [navigate]);

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4">
        <Outlet />
      </main>
    </>
  );
}