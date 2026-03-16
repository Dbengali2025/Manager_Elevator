"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-md">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 mb-lg">
        <svg
          className="h-8 w-8 text-error"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <h2 className="font-heading text-h2 text-charcoal mb-sm">
        Something went wrong
      </h2>
      <p className="text-body text-charcoal/60 max-w-md mb-xl">
        An unexpected error occurred. This won&apos;t affect your saved data.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-navy px-xl py-sm text-body font-medium text-white hover:bg-navy/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
