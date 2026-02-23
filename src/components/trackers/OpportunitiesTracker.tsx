"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  getOpportunities,
  createOpportunity,
  updateOpportunityStatus,
  deleteOpportunity,
} from "@/actions/trackers";
import type {
  ImprovementOpportunity,
  OpportunityPriority,
  OpportunityStatus,
} from "@/db/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITIES: OpportunityPriority[] = ["high", "medium", "low"];
const STATUSES: OpportunityStatus[] = ["active", "completed", "deferred"];

const PRIORITY_CONFIG: Record<
  OpportunityPriority,
  { label: string; bg: string; text: string }
> = {
  high: { label: "High", bg: "bg-error/10", text: "text-error" },
  medium: { label: "Medium", bg: "bg-warning/10", text: "text-warning" },
  low: { label: "Low", bg: "bg-skyBlue/10", text: "text-skyBlue" },
};

// ---------------------------------------------------------------------------
// Badge components
// ---------------------------------------------------------------------------

function PriorityBadge({ priority }: { priority: OpportunityPriority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className={`inline-flex items-center rounded-full px-sm py-[2px] text-caption font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Modal
// ---------------------------------------------------------------------------

interface FormData {
  title: string;
  description: string;
  priority: OpportunityPriority;
  category: string;
  status: OpportunityStatus;
}

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  priority: "medium",
  category: "",
  status: "active",
};

function AddOpportunityModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    const result = await createOpportunity(form);
    setSaving(false);
    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error ?? "Failed to save");
    }
  }

  return (
    <Transition show={open}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-charcoal/40" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-md">
          <TransitionChild
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-xl shadow-xl">
              <DialogTitle className="font-heading text-h2 text-charcoal">
                Add Opportunity
              </DialogTitle>

              <form onSubmit={handleSubmit} className="mt-lg space-y-md">
                {/* Title */}
                <div>
                  <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                    Opportunity Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="e.g., Reduce manual report generation time"
                    className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    rows={3}
                    placeholder="Describe the waste or improvement opportunity..."
                    className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none resize-none"
                  />
                </div>

                {/* Priority + Category row */}
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                      Priority
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          priority: e.target.value as OpportunityPriority,
                        }))
                      }
                      className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                      Category
                    </label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                      placeholder="e.g., Process, Quality"
                      className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        status: e.target.value as OpportunityStatus,
                      }))
                    }
                    className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="text-caption text-error">{error}</p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-sm pt-sm">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md px-lg py-sm text-body text-charcoal/70 hover:text-charcoal"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-navy px-lg py-sm text-body text-white hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Add Opportunity"}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  deleting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <Transition show={open}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-charcoal/40" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-md">
          <TransitionChild
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-sm rounded-lg bg-white p-xl shadow-xl">
              <DialogTitle className="font-heading text-h3 text-charcoal">
                Delete Opportunity
              </DialogTitle>
              <p className="mt-sm text-body text-charcoal/70">
                Are you sure you want to delete this opportunity? This action
                cannot be undone.
              </p>
              <div className="mt-lg flex justify-end gap-sm">
                <button
                  onClick={onClose}
                  className="rounded-md px-lg py-sm text-body text-charcoal/70 hover:text-charcoal"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={deleting}
                  className="rounded-md bg-error px-lg py-sm text-body text-white hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OpportunitiesTracker() {
  const [opportunities, setOpportunities] = useState<ImprovementOpportunity[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | "all">(
    "all"
  );
  const [priorityFilter, setPriorityFilter] = useState<
    OpportunityPriority | "all"
  >("all");

  const fetchData = useCallback(async () => {
    const result = await getOpportunities();
    if (result.success && result.data) {
      setOpportunities(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStatusChange(id: string, status: OpportunityStatus) {
    // Optimistic update
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    const result = await updateOpportunityStatus(id, status);
    if (!result.success) {
      // Revert on failure
      await fetchData();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteOpportunity(deleteTarget);
    setDeleting(false);
    if (result.success) {
      setOpportunities((prev) => prev.filter((o) => o.id !== deleteTarget));
    }
    setDeleteTarget(null);
  }

  // Filter
  const filtered = opportunities.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (priorityFilter !== "all" && o.priority !== priorityFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="rounded-lg border border-paleGray bg-white p-2xl text-center">
        <div className="animate-pulse space-y-md">
          <div className="h-4 bg-paleGray rounded w-1/3 mx-auto" />
          <div className="h-32 bg-paleGray/50 rounded" />
        </div>
      </div>
    );
  }

  // Empty state
  if (opportunities.length === 0) {
    return (
      <>
        <div className="rounded-lg border border-paleGray bg-white p-2xl text-center">
          <div className="mx-auto mb-md flex h-[48px] w-[48px] items-center justify-center rounded-full bg-warning/10">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-warning"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h3 className="font-heading text-h3 text-charcoal">
            No Opportunities Yet
          </h3>
          <p className="mt-sm text-body text-charcoal/60 max-w-md mx-auto">
            Start logging improvement opportunities you have identified in your
            workplace.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-lg inline-flex items-center gap-xs rounded-md bg-navy px-lg py-sm text-body text-white hover:bg-navy/90"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Opportunity
          </button>
        </div>

        <AddOpportunityModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSaved={fetchData}
        />
      </>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Toolbar: filters + add button */}
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex flex-wrap items-center gap-sm">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as OpportunityStatus | "all")
            }
            className="rounded-md border border-paleGray px-md py-[6px] text-caption focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(
                e.target.value as OpportunityPriority | "all"
              )
            }
            className="rounded-md border border-paleGray px-md py-[6px] text-caption focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          {filtered.length !== opportunities.length && (
            <span className="text-caption text-charcoal/50">
              Showing {filtered.length} of {opportunities.length}
            </span>
          )}
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-xs rounded-md bg-navy px-md py-[6px] text-caption text-white hover:bg-navy/90"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Opportunity
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-paleGray bg-white">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-paleGray bg-offWhite">
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/70 sticky left-0 bg-offWhite z-10">
                Title
              </th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/70 w-[100px]">
                Priority
              </th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/70 w-[120px]">
                Category
              </th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/70 w-[140px]">
                Status
              </th>
              <th className="px-md py-sm text-right text-caption font-semibold text-charcoal/70 w-[60px]">
                {/* delete */}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((opp, i) => (
              <tr
                key={opp.id}
                className={`border-b border-paleGray last:border-0 ${
                  i % 2 === 0 ? "bg-white" : "bg-offWhite/50"
                }`}
              >
                <td className={`px-md py-sm sticky left-0 z-10 ${
                  i % 2 === 0 ? "bg-white" : "bg-offWhite/50"
                }`}>
                  <div>
                    <p className="text-body text-charcoal font-medium truncate max-w-[300px]">
                      {opp.title}
                    </p>
                    {opp.description && (
                      <p className="text-caption text-charcoal/50 truncate max-w-[300px]">
                        {opp.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-md py-sm">
                  <PriorityBadge priority={opp.priority} />
                </td>
                <td className="px-md py-sm text-caption text-charcoal/70">
                  {opp.category || "\u2014"}
                </td>
                <td className="px-md py-sm">
                  <select
                    value={opp.status}
                    onChange={(e) =>
                      handleStatusChange(
                        opp.id,
                        e.target.value as OpportunityStatus
                      )
                    }
                    className="rounded-md border border-paleGray px-sm py-[2px] text-caption focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-md py-sm text-right">
                  <button
                    onClick={() => setDeleteTarget(opp.id)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-charcoal/30 hover:text-error transition-colors"
                    title="Delete opportunity"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-md py-xl text-center text-body text-charcoal/50"
                >
                  No opportunities match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddOpportunityModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={fetchData}
      />

      <DeleteConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
