import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from 'virtual:pwa-register';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Translate from "./pages/Translate";
import History from "./pages/History";
import LoginLogs from "./pages/LoginLogs";
import { isLoggedIn } from "./auth";

// Register PWA service worker (only in production)
if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/translate" />} />
          <Route path="translate" element={<Translate />} />
          <Route path="history" element={<History />} />
          <Route path="login-logs" element={<LoginLogs />} />
        </Route>
        <Route
          path="/login"
          element={isLoggedIn() ? <Navigate to="/translate" /> : <Login />}
        />
        <Route
          path="/register"
          element={isLoggedIn() ? <Navigate to="/translate" /> : <Register />}
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);