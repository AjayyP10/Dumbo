import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isLoggedIn } from "./auth";

interface GuardProps {
  /** Children can be a single element or nothing; if omitted, <Outlet /> will render nested routes */
  children?: JSX.Element;
}

/**
 * PrivateRoute:
 * Ensures the user is authenticated before rendering its children (or an <Outlet />).
 * If not authenticated, redirects to /login, preserving the intended destination in state.
 */
export function PrivateRoute({ children }: GuardProps) {
  const location = useLocation();

  if (!isLoggedIn()) {
    // Redirect to login; preserve where user was trying to go.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if provided, otherwise fall back to nested routes.
  return children ?? <Outlet />;
}

/**
 * PublicOnly:
 * Blocks access to its children when the user *is* authenticated.
 * Ideal for pages like Login or Register that shouldn’t show if already logged in.
 */
export function PublicOnly({ children }: GuardProps) {
  if (isLoggedIn()) {
    return <Navigate to="/translate" replace />;
  }
  return children ?? <Outlet />;
}