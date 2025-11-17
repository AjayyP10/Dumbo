import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import "./i18n";
import App from "./App";
import Login from "./pages/Login";
import OAuthComplete from "./pages/OAuthComplete";
import ChooseUsername from "./pages/ChooseUsername";
import Register from "./pages/Register";
import Translate from "./pages/Translate";
import History from "./pages/History";
import LoginLogs from "./pages/LoginLogs";
import { PrivateRoute, PublicOnly } from "./RouteGuards";

// Register PWA service worker (only in production)
if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <App />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/translate" />} />
          <Route path="translate" element={<Translate />} />
          <Route path="history" element={<History />} />
          <Route path="login-logs" element={<LoginLogs />} />
        </Route>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <Register />
            </PublicOnly>
          }
        />
        <Route path="/oauth-complete" element={<OAuthComplete />} />
        <Route
          path="/welcome"
          element={
            <PrivateRoute>
              <ChooseUsername />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
