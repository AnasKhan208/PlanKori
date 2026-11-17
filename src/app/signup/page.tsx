"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "@/lib/validators/auth";
import { UserCheck, Sparkles, Store, Lock, Mail, User, Phone, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<"host" | "vendor">("host");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);

    const validation = signupSchema.safeParse({
      role,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const fieldName = issue.path[0] as string;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          data: {
            full_name: validation.data.fullName,
            role: validation.data.role,
            phone: validation.data.phone || null,
          },
        },
      });

      if (error) {
        setGeneralError(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        // Logged in immediately (email confirmation disabled in Supabase)
        router.refresh();
        if (role === "vendor") {
          router.push("/vendor/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        setSuccessMessage(
          "Registration successful! If email confirmation is enabled on your Supabase project, please check your inbox to activate your account. Otherwise, you can now log in."
        );
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during signup.";
      setGeneralError(msg);
      setLoading(false);
    }
  }

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
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-500 underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-zinc-200/50 rounded-2xl border border-zinc-100 sm:px-10">
          {generalError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div>{generalError}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-medium mb-1">Registration Complete</p>
                <p className="text-emerald-700">{successMessage}</p>
                <div className="mt-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition"
                  >
                    Go to Sign In <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-2">
                I want to join as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("host")}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all ${
                    role === "host"
                      ? "border-amber-600 bg-amber-50/50 text-amber-900 font-semibold shadow-sm"
                      : "border-zinc-200 hover:border-zinc-300 bg-white text-zinc-600"
                  }`}
                >
                  <Sparkles className={`w-5 h-5 mb-1.5 ${role === "host" ? "text-amber-600" : "text-zinc-400"}`} />
                  <span className="text-sm">Event Host</span>
                  <span className="text-xs text-zinc-500 font-normal mt-0.5">Plan & book events</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("vendor")}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all ${
                    role === "vendor"
                      ? "border-amber-600 bg-amber-50/50 text-amber-900 font-semibold shadow-sm"
                      : "border-zinc-200 hover:border-zinc-300 bg-white text-zinc-600"
                  }`}
                >
                  <Store className={`w-5 h-5 mb-1.5 ${role === "vendor" ? "text-amber-600" : "text-zinc-400"}`} />
                  <span className="text-sm">Vendor</span>
                  <span className="text-xs text-zinc-500 font-normal mt-0.5">Offer event services</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700">
                Full Name
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahim Chowdhury"
                  className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border ${
                    errors.fullName ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-zinc-200 focus:ring-amber-500 focus:border-amber-500"
                  } outline-none transition`}
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
            </div>

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

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">
                Phone Number <span className="text-zinc-400 font-normal">(Optional)</span>
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border ${
                    errors.phone ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-zinc-200 focus:ring-amber-500 focus:border-amber-500"
                  } outline-none transition`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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
                <span>Creating account...</span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Register as {role === "host" ? "Host" : "Vendor"}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
