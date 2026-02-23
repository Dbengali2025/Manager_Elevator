"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  requestPasswordResetAction,
  confirmPasswordResetAction,
} from "@/actions/auth";

// ---------------------------------------------------------------------------
// Password validation (same as signup)
// ---------------------------------------------------------------------------

interface PasswordCheck {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
}

function validatePassword(password: string): PasswordCheck {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
  };
}

function isPasswordValid(checks: PasswordCheck): boolean {
  return checks.minLength && checks.hasUppercase && checks.hasNumber;
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-success"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="w-4 h-4 text-error"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Step = "request" | "verify" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // ---------------------------------------------------------------------------
  // Step 1: Request reset code
  // ---------------------------------------------------------------------------

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await requestPasswordResetAction(email);

      if (!result.success) {
        setError(result.error ?? "Failed to send reset code.");
      } else {
        setStep("verify");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 2: Verify code + set new password
  // ---------------------------------------------------------------------------

  async function handleConfirmReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isPasswordValid(passwordChecks)) {
      setError("Please fix the password requirements below.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await confirmPasswordResetAction(email, code, newPassword);

      if (!result.success) {
        setError(result.error ?? "Failed to reset password.");
      } else {
        setStep("success");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
        {step === "request" && (
          <>
            <h1 className="font-heading text-h1 text-navy text-center mb-sm">
              Reset Your Password
            </h1>
            <p className="text-body text-charcoal/70 text-center mb-lg">
              Enter your email address and we&apos;ll send you a verification
              code to reset your password.
            </p>

            {error && (
              <div className="bg-error/10 border border-error/30 text-error text-body rounded-md px-md py-sm mb-md">
                {error}
              </div>
            )}

            <form onSubmit={handleRequestReset} className="space-y-md">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-white font-medium text-body py-sm px-md rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>

            <p className="text-center text-body text-charcoal/60 mt-lg">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-skyBlue hover:text-teal font-medium"
              >
                Log in
              </Link>
            </p>
          </>
        )}

        {step === "verify" && (
          <>
            <h1 className="font-heading text-h1 text-navy text-center mb-sm">
              Enter Reset Code
            </h1>
            <p className="text-body text-charcoal/70 text-center mb-lg">
              We sent a verification code to{" "}
              <span className="font-medium text-charcoal">{email}</span>. Enter
              the code and your new password below.
            </p>

            {error && (
              <div className="bg-error/10 border border-error/30 text-error text-body rounded-md px-md py-sm mb-md">
                {error}
              </div>
            )}

            <form onSubmit={handleConfirmReset} className="space-y-md">
              {/* Verification Code */}
              <div>
                <label
                  htmlFor="code"
                  className="block text-body font-medium text-charcoal mb-xs"
                >
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-md py-sm border border-paleGray rounded-md text-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue text-center tracking-widest text-h2"
                  placeholder="Enter code"
                  autoComplete="one-time-code"
                />
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-body font-medium text-charcoal mb-xs"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-md py-sm border border-paleGray rounded-md text-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue"
                  placeholder="Create a strong password"
                />
                {newPassword.length > 0 && (
                  <div className="mt-sm space-y-xs">
                    <div className="flex items-center gap-xs text-caption">
                      {passwordChecks.minLength ? <CheckIcon /> : <XIcon />}
                      <span
                        className={
                          passwordChecks.minLength
                            ? "text-success"
                            : "text-error"
                        }
                      >
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-xs text-caption">
                      {passwordChecks.hasUppercase ? (
                        <CheckIcon />
                      ) : (
                        <XIcon />
                      )}
                      <span
                        className={
                          passwordChecks.hasUppercase
                            ? "text-success"
                            : "text-error"
                        }
                      >
                        At least 1 uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-xs text-caption">
                      {passwordChecks.hasNumber ? <CheckIcon /> : <XIcon />}
                      <span
                        className={
                          passwordChecks.hasNumber
                            ? "text-success"
                            : "text-error"
                        }
                      >
                        At least 1 number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-body font-medium text-charcoal mb-xs"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-md py-sm border border-paleGray rounded-md text-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue"
                  placeholder="Re-enter your new password"
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-xs text-caption text-error">
                    Passwords do not match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !code}
                className="w-full bg-navy text-white font-medium text-body py-sm px-md rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <button
              onClick={() => {
                setStep("request");
                setError("");
                setCode("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="w-full text-center text-body text-charcoal/60 hover:text-charcoal mt-md"
            >
              Back
            </button>
          </>
        )}

        {step === "success" && (
          <>
            {/* Success checkmark icon */}
            <div className="flex justify-center mb-lg">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h1 className="font-heading text-h1 text-navy text-center mb-sm">
              Password Reset!
            </h1>
            <p className="text-body text-charcoal/70 text-center mb-lg">
              Your password has been successfully updated. You can now log in
              with your new password.
            </p>

            <button
              onClick={() => router.push("/login")}
              className="w-full bg-navy text-white font-medium text-body py-sm px-md rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue transition-colors"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
