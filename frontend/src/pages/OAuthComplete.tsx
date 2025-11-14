import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveTokens } from "../auth";

// This page is loaded after the backend redirects the user back to the SPA with
// JWT tokens in the URL hash. It extracts the tokens, stores them, and then
// seamlessly redirects the user to the main translation view.
export default function OAuthComplete() {
  const navigate = useNavigate();

  useEffect(() => {
    // Example hash: #access=AAA&refresh=BBB
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const access = params.get("access");
    const refresh = params.get("refresh");

    if (access && refresh) {
      saveTokens(access, refresh);
      // Optionally store username later via whoami call
      navigate("/translate", { replace: true });
    } else {
      // Missing tokens – redirect to login
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return null; // Nothing to render – immediate redirect handled above
}