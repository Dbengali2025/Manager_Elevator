"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getProfileData,
  updateProfile,
  changePassword,
} from "@/actions/settings";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

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
// Input styling constant
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  "w-full px-md py-sm border border-paleGray rounded-md text-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue";

const LABEL_CLASS = "block text-body font-medium text-charcoal mb-xs";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  // Profile state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [miestroLinked, setMiestroLinked] = useState(false);

  // Notification toggles
  const [notifyMilestones, setNotifyMilestones] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(true);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Password modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const newPasswordChecks = validatePassword(newPassword);

  // ---------------------------------------------------------------------------
  // Fetch profile data
  // ---------------------------------------------------------------------------

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProfileData();
      if (result.success && result.data) {
        setFullName(result.data.fullName);
        setEmail(result.data.email);
        setCompanyName(result.data.companyName);
        setIndustry(result.data.industry);
        setRoleTitle(result.data.roleTitle);
        setMiestroLinked(result.data.miestroLinked);
        setNotifyMilestones(result.data.notifyMilestones);
        setNotifyWeeklyDigest(result.data.notifyWeeklyDigest);
      } else {
        setError(result.error ?? "Failed to load profile");
      }
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ---------------------------------------------------------------------------
  // Save profile
  // ---------------------------------------------------------------------------

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setSaving(true);

    try {
      const result = await updateProfile({
        fullName,
        companyName,
        industry,
        roleTitle,
      });

      if (result.success) {
        setSuccessMessage("Changes saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(result.error ?? "Failed to save changes");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Change password
  // ---------------------------------------------------------------------------

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!isPasswordValid(newPasswordChecks)) {
      setPasswordError("Please fix the password requirements below.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.success) {
        setPasswordSuccess("Password updated successfully!");
        setTimeout(() => {
          setPasswordModalOpen(false);
          setPasswordSuccess("");
        }, 2000);
      } else {
        setPasswordError(result.error ?? "Failed to change password");
      }
    } catch {
      setPasswordError("An unexpected error occurred");
    } finally {
      setPasswordSaving(false);
    }
  }

  // Reset password modal state when opening
  useEffect(() => {
    if (passwordModalOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setPasswordSuccess("");
    }
  }, [passwordModalOpen]);

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-lg">
        <div className="h-8 w-48 bg-paleGray rounded-md animate-pulse" />
        <div className="bg-white rounded-lg shadow-sm p-xl space-y-md">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-xs">
              <div className="h-4 w-24 bg-paleGray rounded animate-pulse" />
              <div className="h-10 bg-paleGray rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-2xl mx-auto space-y-lg">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-h1 text-navy">Settings</h1>
        <p className="text-body text-charcoal/60 mt-xs">
          Manage your profile and preferences
        </p>
      </div>

      {/* Success toast */}
      {successMessage && (
        <div className="bg-success/10 border border-success/30 text-success text-body rounded-md px-md py-sm flex items-center gap-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-body rounded-md px-md py-sm">
          {error}
        </div>
      )}

      {/* Profile section */}
      <div className="bg-white rounded-lg shadow-sm p-xl">
        <h2 className="font-heading text-h2 text-navy mb-lg">Profile Information</h2>
        <form onSubmit={handleSaveProfile} className="space-y-md">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className={LABEL_CLASS}>
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className={LABEL_CLASS}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className={`${INPUT_CLASS} bg-offWhite cursor-not-allowed text-charcoal/60`}
            />
            <p className="text-caption text-charcoal/50 mt-xs">
              Email cannot be changed
            </p>
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className={LABEL_CLASS}>
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          {/* Industry */}
          <div>
            <label htmlFor="industry" className={LABEL_CLASS}>
              Industry
            </label>
            <select
              id="industry"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={INPUT_CLASS}
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
            <label htmlFor="roleTitle" className={LABEL_CLASS}>
              Current Role / Title
            </label>
            <input
              id="roleTitle"
              type="text"
              required
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          {/* Save button */}
          <div className="pt-sm">
            <button
              type="submit"
              disabled={saving}
              className="bg-navy text-white font-medium text-body py-sm px-lg min-h-[44px] rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Notification preferences */}
      <div className="bg-white rounded-lg shadow-sm p-xl">
        <h2 className="font-heading text-h2 text-navy mb-lg">Notification Preferences</h2>
        <div className="space-y-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-medium text-charcoal">Milestone Notifications</p>
              <p className="text-caption text-charcoal/60">
                Receive email when you unlock milestones
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifyMilestones}
              onClick={() => setNotifyMilestones(!notifyMilestones)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                notifyMilestones ? "bg-skyBlue" : "bg-paleGray"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  notifyMilestones ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="border-t border-paleGray" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-medium text-charcoal">Weekly Progress Digest</p>
              <p className="text-caption text-charcoal/60">
                Receive a weekly summary of your progress
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifyWeeklyDigest}
              onClick={() => setNotifyWeeklyDigest(!notifyWeeklyDigest)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                notifyWeeklyDigest ? "bg-skyBlue" : "bg-paleGray"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  notifyWeeklyDigest ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Miestro account connection */}
      <div className="bg-white rounded-lg shadow-sm p-xl">
        <h2 className="font-heading text-h2 text-navy mb-lg">Miestro Account</h2>
        <div className="flex items-start gap-md">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              miestroLinked ? "bg-success/10" : "bg-warning/10"
            }`}
          >
            {miestroLinked ? (
              <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-body font-medium text-charcoal">
              {miestroLinked ? "Account Linked" : "Not Linked"}
            </p>
            <p className="text-caption text-charcoal/60 mt-xs">
              {miestroLinked
                ? "Your Miestro account is connected. You can access the masterclass content."
                : "Link your Miestro account to access the Leading Bulletproof Continuous Improvement Masterclass."}
            </p>
            {!miestroLinked && (
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-xs mt-sm text-body font-medium text-skyBlue hover:text-teal transition-colors"
              >
                Link Account
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Security section */}
      <div className="bg-white rounded-lg shadow-sm p-xl">
        <h2 className="font-heading text-h2 text-navy mb-lg">Security</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body font-medium text-charcoal">Password</p>
            <p className="text-caption text-charcoal/60">
              Update your password to keep your account secure
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="bg-white text-navy font-medium text-body py-sm px-md min-h-[44px] rounded-md border border-navy hover:bg-navy/5 focus:outline-none focus:ring-2 focus:ring-skyBlue transition-colors"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      <Transition appear show={passwordModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setPasswordModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-charcoal/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-md">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md bg-white rounded-lg shadow-xl p-xl">
                  <Dialog.Title className="font-heading text-h2 text-navy mb-lg">
                    Change Password
                  </Dialog.Title>

                  {passwordError && (
                    <div className="bg-error/10 border border-error/30 text-error text-body rounded-md px-md py-sm mb-md">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="bg-success/10 border border-success/30 text-success text-body rounded-md px-md py-sm mb-md flex items-center gap-sm">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {passwordSuccess}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-md">
                    {/* Current Password */}
                    <div>
                      <label htmlFor="currentPassword" className={LABEL_CLASS}>
                        Current Password
                      </label>
                      <input
                        id="currentPassword"
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="Enter current password"
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <label htmlFor="newPassword" className={LABEL_CLASS}>
                        New Password
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="Enter new password"
                      />
                      {newPassword.length > 0 && (
                        <div className="mt-sm space-y-xs">
                          <div className="flex items-center gap-xs text-caption">
                            {newPasswordChecks.minLength ? <CheckIcon /> : <XIcon />}
                            <span className={newPasswordChecks.minLength ? "text-success" : "text-error"}>
                              At least 8 characters
                            </span>
                          </div>
                          <div className="flex items-center gap-xs text-caption">
                            {newPasswordChecks.hasUppercase ? <CheckIcon /> : <XIcon />}
                            <span className={newPasswordChecks.hasUppercase ? "text-success" : "text-error"}>
                              At least 1 uppercase letter
                            </span>
                          </div>
                          <div className="flex items-center gap-xs text-caption">
                            {newPasswordChecks.hasNumber ? <CheckIcon /> : <XIcon />}
                            <span className={newPasswordChecks.hasNumber ? "text-success" : "text-error"}>
                              At least 1 number
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className={LABEL_CLASS}>
                        Confirm New Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="Confirm new password"
                      />
                      {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                        <p className="text-caption text-error mt-xs">
                          Passwords do not match
                        </p>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-sm pt-sm">
                      <button
                        type="button"
                        onClick={() => setPasswordModalOpen(false)}
                        className="flex-1 bg-white text-charcoal font-medium text-body py-sm px-md rounded-md border border-paleGray hover:bg-offWhite focus:outline-none focus:ring-2 focus:ring-skyBlue transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={passwordSaving}
                        className="flex-1 bg-navy text-white font-medium text-body py-sm px-md rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {passwordSaving ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
