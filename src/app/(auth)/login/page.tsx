"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { loginAction } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginAction(email, password);

      if (!result.success) {
        setError(result.error ?? "Login failed. Please try again.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex justify-center mb-xl">
        <Link href="/">
          <Image
            src="/manager-elevator_logo.png"
            alt="Manager Elevator"
            width={180}
            height={60}
            priority
          />
        </Link>
      </div>

      {/* Card */}
      <div className="bg-white rounded-lg shadow-md p-xl">
        <h1 className="font-heading text-h1 text-navy text-center mb-sm">
          Welcome Back
        </h1>
        <p className="text-body text-charcoal/70 text-center mb-lg">
          Log in to continue your CI journey
        </p>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error text-body rounded-md px-md py-sm mb-md">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-md">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-body font-medium text-charcoal mb-xs"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-md py-sm border border-paleGray rounded-md text-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue"
              placeholder="you@company.com"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-xs">
              <label
                htmlFor="password"
                className="block text-body font-medium text-charcoal"
              >
                Password
              </label>
              <Link
                href="/reset-password"
                className="text-caption text-skyBlue hover:text-teal font-medium"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-md py-sm border border-paleGray rounded-md text-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue"
              placeholder="Enter your password"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white font-medium text-body py-sm px-md rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Signup link */}
        <p className="text-center text-body text-charcoal/60 mt-lg">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-skyBlue hover:text-teal font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
