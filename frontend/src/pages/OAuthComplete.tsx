import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveTokens } from "../auth";
import { api } from "../api";

// This page is loaded after the backend redirects the user back to the SPA with
// JWT tokens in the URL hash. It extracts the tokens, stores them, and then
// seamlessly redirects the user to the main translation view.
export default function OAuthComplete() {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get<{ display_name: string | null }>("profile/");
        return res.data.display_name;
      } catch {
        return null;
      }
    };
    const handle = async () => {
      // Example hash: #access=AAA&refresh=BBB
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const access = params.get("access");
      const refresh = params.get("refresh");

      if (access && refresh) {
        // Clear any previously stored username in case a different user logs in
        localStorage.removeItem("username");
        saveTokens(access, refresh);
        const display = await fetchProfile();
        if (display) {
          localStorage.setItem("username", display);
          navigate("/translate", { replace: true });
        } else {
          navigate("/welcome", { replace: true });
        }
      } else {
        // Missing tokens – redirect to login
        navigate("/login", { replace: true });
      }
    };

    handle();
  }, [navigate]);

  return null; // Nothing to render – immediate redirect handled above
}