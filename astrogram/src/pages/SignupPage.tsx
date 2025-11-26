import React, { useEffect, useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "../lib/supabaseClient";
import { fireAccountCreationConversion } from "../lib/googleAds";
import FormMessage from "../components/FormMessage";

const SignupPage: React.FC = () => {
  const base = import.meta.env.VITE_API_BASE_URL || "/api";
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginRoute = location.pathname === "/login";
  const headingText = isLoginRoute ? "Log in" : "Sign Up";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<
    | null
    | {
        tone: "error" | "info";
        text: string;
      }
  >(null);

  useEffect(() => {
    setMessage(null);
  }, [isLoginRoute]);

  const handleGoogleSignIn = () => {
    window.location.href = `${base}/auth/google`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('[SignupPage] Form submitted', {
      isLoginRoute,
      emailProvided: Boolean(email.trim()),
      supabaseConfigured: isSupabaseConfigured(),
    });
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setMessage({ tone: "error", text: "Email and password are required." });
      return;
    }

    const hasAtSymbol = trimmedEmail.includes("@");
    const hasDomainTld = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail);
    if (!hasAtSymbol || !hasDomainTld) {
      setMessage({
        tone: "error",
        text: "Please enter a valid email address with an @ and a domain (e.g., name@example.com).",
      });
      return;
    }

    if (!isSupabaseConfigured()) {
      setMessage({
        tone: "error",
        text: "Email/password authentication is not available. Please configure Supabase credentials and try again.",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const supabase = getSupabaseClient();
      console.log('[SignupPage] Obtained Supabase client. Starting auth flow.', { mode: isLoginRoute ? 'login' : 'signup' });
      const callbackPath = "/auth/supabase";
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}${callbackPath}`
          : callbackPath;
      console.log('[SignupPage] Using email redirect', { emailRedirectTo });

      const result = isLoginRoute
        ? await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: trimmedPassword,
          })
        : await supabase.auth.signUp({
            email: trimmedEmail,
            password: trimmedPassword,
            options: { emailRedirectTo },
          });
      console.log('[SignupPage] Supabase response received', {
        error: result.error?.message,
        hasSession: Boolean(result.data.session?.access_token),
      });

      if (result.error) {
        throw result.error;
      }

      if (!isLoginRoute) {
        fireAccountCreationConversion();
      }

      const session = result.data.session;
      if (!session?.access_token) {
        setMessage({
          tone: "info",
          text: isLoginRoute
            ? "Unable to retrieve a Supabase session. Please try again."
            : "Check your inbox to confirm your email before signing in.",
        });
        return;
      }

      const response = await fetch(`${base}/auth/supabase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accessToken: session.access_token }),
      });
      console.log('[SignupPage] Backend /auth/supabase response', {
        status: response.status,
        ok: response.ok,
      });
      const payload = (await response
        .json()
        .catch(() => null)) as { accessToken?: string; message?: string } | null;
      console.log('[SignupPage] Backend payload parsed', {
        hasAccessToken: Boolean(payload?.accessToken),
        message: payload?.message,
      });

      if (!response.ok || !payload?.accessToken) {
        throw new Error(payload?.message ?? "Unable to complete authentication.");
      }

      const authedUser = await login(payload.accessToken);
      setEmail("");
      setPassword("");

      if (!authedUser?.profileComplete) {
        navigate("/completeProfile", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error('[SignupPage] Error during Supabase flow', err);
      setMessage({
        tone: "error",
        text:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 lg:items-start lg:pt-16 px-4">
      <div className="max-w-sm w-full p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <h1 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100">
          {headingText}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Enter a secure password"
              autoComplete={isLoginRoute ? "current-password" : "new-password"}
              disabled={submitting}
              minLength={6}
            />
          </div>

          {message && <FormMessage tone={message.tone} text={message.text} />}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-sky-500 to-fuchsia-500 px-4 py-2 text-white font-semibold shadow hover:brightness-110 transition disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isLoginRoute ? "Signing you in…" : "Creating your account…"}
              </>
            ) : (
              <span>{isLoginRoute ? "Log in" : "Create account"}</span>
            )}
          </button>
        </form>

        <button
          onClick={handleGoogleSignIn}
          className="relative w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <FaGoogle className="absolute left-6 w-5 h-5" />
          <span className="w-full text-center text-gray-800 dark:text-gray-100 font-medium">
            Continue with Google
          </span>
        </button>

        <div className="text-center text-sm text-gray-600 dark:text-gray-300">
          {isLoginRoute ? (
            <>
              Not a user?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="text-sky-500 hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already a user?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sky-500 hover:underline"
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
