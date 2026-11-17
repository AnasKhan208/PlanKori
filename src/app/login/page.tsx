"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "./actions";
import { Lock, Mail, AlertCircle, LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick Demo Account Auto-Fill Helper
  function fillDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("Demo@12345");
    setErrors({});
    setGeneralError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }
    if (!password) {
      setErrors({ password: "Password is required" });
      return;
    }

    setLoading(true);

    try {
      const result = await loginAction({ email: email.trim(), password });

      if (!result.success) {
        setGeneralError(result.error || "Invalid credentials.");
        setLoading(false);
        return;
      }

      router.refresh();

      if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
        router.push(redirectTo);
        return;
      }

      if (result.role === "admin") {
        router.push("/admin");
      } else if (result.role === "vendor") {
        router.push("/vendor/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during login.";
      setGeneralError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="bg-white py-8 px-6 shadow-xl shadow-zinc-200/50 rounded-2xl border border-zinc-100 sm:px-10">
      {generalError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div>{generalError}</div>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            Email address
          </label>
          <div className="mt-1 relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border ${
                errors.email ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-zinc-200 focus:ring-amber-500 focus:border-amber-500"
              } outline-none transition`}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            Password
          </label>
          <div className="mt-1 relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border ${
                errors.password ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-zinc-200 focus:ring-amber-500 focus:border-amber-500"
              } outline-none transition`}
            />
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition cursor-pointer"
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Quick-Fill section */}
      <div className="mt-8 pt-6 border-t border-zinc-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Quick Demo Accounts (password: <code className="text-zinc-700">Demo@12345</code>)
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount("host1@plankori.test")}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium transition cursor-pointer"
          >
            Host: Rahim (host1)
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("vendor01@plankori.test")}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium transition cursor-pointer"
          >
            Vendor: Venue
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("admin@plankori.test")}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium transition cursor-pointer"
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            PK
          </div>
          <span className="text-2xl font-bold tracking-tight text-zinc-900">
            Plan<span className="text-amber-600">Kori</span>
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-zinc-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Or{" "}
          <Link href="/signup" className="font-semibold text-amber-600 hover:text-amber-500 underline underline-offset-4">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense fallback={<div className="bg-white p-8 rounded-2xl shadow text-center text-sm text-zinc-500">Loading sign in form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
