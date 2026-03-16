"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signupAction, verifyOtpAction } from "@/actions/auth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INDUSTRIES = [
  "Financial Services",
  "Healthcare",
  "Professional Services",
  "Technology",
  "Retail/E-commerce",
  "Government/Non-profit",
  "Other",
];

// ---------------------------------------------------------------------------
// Password validation
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

// ---------------------------------------------------------------------------
// CheckIcon / XIcon for inline validation
// ---------------------------------------------------------------------------

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SignupPage() {
  const router = useRouter();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [roleTitle, setRoleTitle] = useState("");

  // UI state
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = validatePassword(password);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isPasswordValid(passwordChecks)) {
      setError("Please fix the password requirements below.");
      return;
    }

    setLoading(true);
    try {
      const result = await signupAction({
        email,
        password,
        fullName,
        companyName,
        industry,
        roleTitle,
      });

      if (!result.success) {
        setError(result.error ?? "Signup failed. Please try again.");
      } else {
        setStep("verify");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await verifyOtpAction(email, verificationCode, {
        fullName,
        companyName,
        industry,
        roleTitle,
      });

      if (!result.success) {
        setError(result.error ?? "Verification failed. Please try again.");
      } else {
        router.push("/onboarding");
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
        {step === "signup" ? (
          <>
            <h1 className="font-heading text-h1 text-navy text-center mb-sm">
              Create Your Account
            </h1>
            <p className="text-body text-charcoal/70 text-center mb-lg">
              Start your continuous improvement journey today
            </p>

            {error && (
              <div className="bg-error/10 border border-error/30 text-error text-body rounded-md px-md py-sm mb-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-md">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-body font-medium text-charcoal mb-xs">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-md py-sm border border-paleGray rounded-md text-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue"
                  placeholder="Your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-body font-medium text-charcoal mb-xs">
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
                <label htmlFor="password" className="block text-body font-medium text-charcoal mb-xs">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-md py-sm border border-paleGray rounded-md text-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue"
                  placeholder="Create a strong password"
                />
                {/* Inline validation */}
                {password.length > 0 && (
                  <div className="mt-sm space-y-xs">
                    <div className="flex items-center gap-xs text-caption">
                      {passwordChecks.minLength ? <CheckIcon /> : <XIcon />}
                      <span className={passwordChecks.minLength ? "text-success" : "text-error"}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-xs text-caption">
                      {passwordChecks.hasUppercase ? <CheckIcon /> : <XIcon />}
                      <span className={passwordChecks.hasUppercase ? "text-success" : "text-error"}>
                        At least 1 uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-xs text-caption">
                      {passwordChecks.hasNumber ? <CheckIcon /> : <XIcon />}
                      <span className={passwordChecks.hasNumber ? "text-success" : "text-error"}>
                        At least 1 number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Company Name */}
              <div>
                <label htmlFor="companyName" className="block text-body font-medium text-charcoal mb-xs">
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-md py-sm border border-paleGray rounded-md text-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue"
                  placeholder="Your company"
                />
              </div>

              {/* Industry */}
              <div>
                <label htmlFor="industry" className="block text-body font-medium text-charcoal mb-xs">
                  Industry
                </label>
                <select
                  id="industry"
                  required
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-md py-sm border border-paleGray rounded-md text-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue"
                >
                  <option value="" disabled>
                    Select your industry
                  </option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role / Title */}
              <div>
                <label htmlFor="roleTitle" className="block text-body font-medium text-charcoal mb-xs">
                  Current Role / Title
                </label>
                <input
                  id="roleTitle"
                  type="text"
                  required
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full px-md py-sm border border-paleGray rounded-md text-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue"
                  placeholder="e.g. Operations Manager"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-white font-medium text-body py-sm px-md rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-body text-charcoal/60 mt-lg">
              Already have an account?{" "}
              <Link href="/login" className="text-skyBlue hover:text-teal font-medium">
                Log in
              </Link>
            </p>
          </>
        ) : (
          /* Verification step */
          <>
            <h1 className="font-heading text-h1 text-navy text-center mb-sm">
              Verify Your Email
            </h1>
            <p className="text-body text-charcoal/70 text-center mb-lg">
              We sent a verification code to{" "}
              <span className="font-medium text-charcoal">{email}</span>.
              Check your inbox and enter the code below.
            </p>

            {error && (
              <div className="bg-error/10 border border-error/30 text-error text-body rounded-md px-md py-sm mb-md">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-md">
              <div>
                <label htmlFor="verificationCode" className="block text-body font-medium text-charcoal mb-xs">
                  Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-md py-sm border border-paleGray rounded-md text-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue text-center tracking-widest text-h2"
                  placeholder="Enter code"
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !verificationCode}
                className="w-full bg-navy text-white font-medium text-body py-sm px-md rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>
            </form>

            <button
              onClick={() => {
                setStep("signup");
                setError("");
                setVerificationCode("");
              }}
              className="w-full text-center text-body text-charcoal/60 hover:text-charcoal mt-md"
            >
              Back to signup
            </button>
          </>
        )}
      </div>
    </div>
  );
}
