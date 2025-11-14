import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const SupabaseAuthCallbackPage: React.FC = () => {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const base = import.meta.env.VITE_API_BASE_URL || "/api";

  useEffect(() => {
    const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
    const params = new URLSearchParams(fragment);
    const supabaseAccessToken = params.get("access_token");

    if (!supabaseAccessToken) {
      navigate("/signup", { replace: true });
      return;
    }

    const completeAuth = async () => {
      try {
        const response = await fetch(`${base}/auth/supabase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ accessToken: supabaseAccessToken }),
        });
        const payload = (await response
          .json()
          .catch(() => null)) as { accessToken?: string; message?: string } | null;

        if (!response.ok || !payload?.accessToken) {
          throw new Error(payload?.message ?? "Unable to complete authentication.");
        }

        const authedUser = await login(payload.accessToken);

        if (!authedUser) {
          navigate("/", { replace: true });
        } else if (!authedUser.profileComplete) {
          navigate("/completeProfile", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch {
        navigate("/signup", { replace: true });
      }
    };

    void completeAuth();
  }, [hash, base, login, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      Completing your sign in…
    </div>
  );
};

export default SupabaseAuthCallbackPage;
