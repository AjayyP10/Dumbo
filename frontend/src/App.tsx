import { Outlet, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";

// Lazy‑load heavy pages
const Login = lazy(() => import("./pages/Login"));
const Translate = lazy(() => import("./pages/Translate"));

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Navbar />
      <main className="max-w-4xl mx-auto p-4">
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/translate" element={<Translate />} />
            {/* fallback route */}
            <Route path="*" element={<Outlet />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}
