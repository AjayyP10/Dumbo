import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

import { Toaster } from "react-hot-toast";

export default function App() {
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
