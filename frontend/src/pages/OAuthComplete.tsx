import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthActive, setUsername as storeUsername } from "../auth";
import { api } from "../api";

/**
 * Landing page after Google OAuth redirect.
 *
 * The backend has already set httpOnly JWT cookies during the OAuth
 * handshake, so we don't need to read any tokens from the URL.  We simply
 * verify that we are authenticated (GET /api/profile/) and navigate.
 */
export default function OAuthComplete() {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
      try {
        const res = await api.get<{ display_name: string | null }>("profile/");
        const displayName = res.data.display_name;
        setAuthActive(true);
        if (displayName) {
          storeUsername(displayName);
          navigate("/translate", { replace: true });
        } else {
          navigate("/welcome", { replace: true });
        }
      } catch {
        // Not authenticated — something went wrong with OAuth
        navigate("/login", { replace: true });
      }
    };

    handle();
  }, [navigate]);

  return null;
}
