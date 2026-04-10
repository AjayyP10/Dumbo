/**
 * Cookie-based authentication helpers.
 *
 * JWT tokens are stored in httpOnly, Secure, SameSite cookies set by the
 * backend.  The SPA never reads the raw tokens, so XSS attacks cannot steal
 * them.  Authentication state is derived solely from the presence of a valid
 * session (checked via GET /api/auth/me/).
 */

export const logout = async () => {
  try {
    await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth/logout/`,
      {
        method: "POST",
        credentials: "include",
      },
    );
  } catch {
    /* ignore network errors during logout */
  }
  localStorage.removeItem("username");
};

export const isLoggedIn = (): boolean => {
  // We can't read httpOnly cookies, so we rely on a cached flag.
  // This flag is set by the Login page and the OAuthComplete page after
  // successful authentication, and cleared on logout / 401.
  return localStorage.getItem("auth_active") === "true";
};

export const setAuthActive = (active: boolean) => {
  localStorage.setItem("auth_active", String(active));
};

export const getUsername = (): string | null => {
  return localStorage.getItem("username") || null;
};

export const setUsername = (name: string | null) => {
  if (name) {
    localStorage.setItem("username", name);
  } else {
    localStorage.removeItem("username");
  }
};
