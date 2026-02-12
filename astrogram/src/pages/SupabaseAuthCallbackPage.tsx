import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PageContainer from "../components/Layout/PageContainer";

const SupabaseAuthCallbackPage: React.FC = () => {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const base = import.meta.env.VITE_API_BASE_URL || "/api";
  const [status, setStatus] = useState<{ state: "loading" | "error"; message?: string }>({
    state: "loading",
  });

  useEffect(() => {
    setStatus({ state: "loading" });
    const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
    const params = new URLSearchParams(fragment);
    const supabaseAccessToken = params.get("access_token");
    console.log('[SupabaseAuthCallback] Hash parsed', {
      hasToken: Boolean(supabaseAccessToken),
      tokenLength: supabaseAccessToken?.length ?? 0,
    });

    if (!supabaseAccessToken) {
      setStatus({
        state: "error",
        message: "This confirmation link is missing an access token. Please restart the sign-in flow.",
      });
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
        console.log('[SupabaseAuthCallback] Posted to backend', {
          status: response.status,
          ok: response.ok,
        });
        const payload = (await response
          .json()
          .catch(() => null)) as { accessToken?: string; message?: string } | null;
        console.log('[SupabaseAuthCallback] Backend payload parsed', {
          hasAccessToken: Boolean(payload?.accessToken),
          message: payload?.message,
        });

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
      } catch (err) {
        console.error('[SupabaseAuthCallback] Error completing auth', err);
        setStatus({
          state: "error",
          message:
            err instanceof Error
              ? err.message
              : "Unable to complete authentication. Please try again.",
        });
      }
    };

    void completeAuth();
  }, [hash, base, login, navigate]);

  return (
    <div className="relative isolate flex min-h-[calc(100vh-5rem)] w-full items-center justify-center py-12 text-white">
      {status.state === "loading" ? (
        <div className="text-lg font-medium tracking-wide">Completing your sign in…</div>
      ) : (
        <PageContainer size="form" className="rounded-3xl border border-white/10 bg-white/10 px-8 py-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl space-y-6">
          <div className="text-2xl font-semibold">We couldn’t finish signing you in</div>
          <p className="text-base text-white/80">{status.message}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate("/signup", { replace: true })}
              className="flex-1 rounded-full border border-white/30 px-4 py-3 text-white font-semibold transition hover:bg-white/10"
            >
              Back to sign up
            </button>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="flex-1 rounded-full bg-white text-gray-900 font-semibold px-4 py-3 transition hover:brightness-110"
            >
              Try logging in
            </button>
          </div>
        </PageContainer>
      )}
    </div>
  );
};

export default SupabaseAuthCallbackPage;
