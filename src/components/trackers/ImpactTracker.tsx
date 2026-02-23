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
  getWinningSolutions,
  createWinningSolution,
  deleteWinningSolution,
} from "@/actions/trackers";
import type { WinningSolution, MetricType } from "@/db/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const METRIC_TYPES: { value: MetricType; label: string }[] = [
  { value: "time_saved", label: "Time Saved" },
  { value: "cost_reduced", label: "Cost Reduced" },
  { value: "quality_improved", label: "Quality Improved" },
  { value: "other", label: "Other" },
];

const METRIC_CONFIG: Record<MetricType, { label: string; color: string; bg: string }> = {
  time_saved: { label: "Time Saved", color: "text-skyBlue", bg: "bg-skyBlue/10" },
  cost_reduced: { label: "Cost Reduced", color: "text-success", bg: "bg-success/10" },
  quality_improved: { label: "Quality Improved", color: "text-teal", bg: "bg-teal/10" },
  other: { label: "Other", color: "text-charcoal/70", bg: "bg-paleGray" },
};

// ---------------------------------------------------------------------------
// ROI Calculation
// ---------------------------------------------------------------------------

function calculateImprovement(
  metricType: MetricType,
  before: number | null,
  after: number | null
): { absolute: number; percentage: number } | null {
  if (before === null || after === null || before === 0) return null;

  // For reductions (time_saved, cost_reduced): improvement = (before - after) / before * 100
  // For gains (quality_improved, other): improvement = (after - before) / before * 100
  const isReduction = metricType === "time_saved" || metricType === "cost_reduced";
  const absolute = isReduction ? before - after : after - before;
  const percentage = (absolute / before) * 100;

  return { absolute, percentage };
}

// ---------------------------------------------------------------------------
// Add Solution Modal
// ---------------------------------------------------------------------------

interface SolutionFormData {
  title: string;
  problem_addressed: string;
  description: string;
  metric_type: MetricType;
  before_value: string;
  after_value: string;
  unit: string;
  date_implemented: string;
  notes: string;
}

const EMPTY_FORM: SolutionFormData = {
  title: "",
  problem_addressed: "",
  description: "",
  metric_type: "time_saved",
  before_value: "",
  after_value: "",
  unit: "hours",
  date_implemented: "",
  notes: "",
};

function AddSolutionModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<SolutionFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError("");
    }
  }, [open]);

  // Live ROI preview
  const beforeNum = form.before_value ? parseFloat(form.before_value) : null;
  const afterNum = form.after_value ? parseFloat(form.after_value) : null;
  const preview = calculateImprovement(form.metric_type, beforeNum, afterNum);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Solution title is required");
      return;
    }
    setSaving(true);
    setError("");

    const result = await createWinningSolution({
      title: form.title.trim(),
      problem_addressed: form.problem_addressed.trim(),
      description: form.description.trim(),
      metric_type: form.metric_type,
      before_value: beforeNum,
      after_value: afterNum,
      unit: form.unit.trim(),
      date_implemented: form.date_implemented || null,
      notes: form.notes.trim(),
    });

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

        <div className="fixed inset-0 flex items-center justify-center p-md overflow-y-auto">
          <TransitionChild
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-xl shadow-xl my-md">
              <DialogTitle className="font-heading text-h2 text-charcoal">
                Add Winning Solution
              </DialogTitle>

              <form onSubmit={handleSubmit} className="mt-lg space-y-md">
                {/* Title */}
                <div>
                  <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                    Solution Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g., Automated weekly report generation"
                    className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
                  />
                </div>

                {/* Problem Addressed */}
                <div>
                  <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                    Problem Addressed
                  </label>
                  <input
                    type="text"
                    value={form.problem_addressed}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, problem_addressed: e.target.value }))
                    }
                    placeholder="e.g., Manual data collection taking 8 hours per week"
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
                    rows={2}
                    placeholder="Describe the solution and how it was implemented..."
                    className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none resize-none"
                  />
                </div>

                {/* Metric Type + Unit */}
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                      Metric Type
                    </label>
                    <select
                      value={form.metric_type}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          metric_type: e.target.value as MetricType,
                        }))
                      }
                      className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
                    >
                      {METRIC_TYPES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={form.unit}
                      onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                      placeholder="e.g., hours, dollars, %"
                      className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
                    />
                  </div>
                </div>

                {/* Before / After Values */}
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                      Before Value
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.before_value}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, before_value: e.target.value }))
                      }
                      placeholder="e.g., 40"
                      className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                      After Value
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.after_value}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, after_value: e.target.value }))
                      }
                      placeholder="e.g., 8"
                      className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
                    />
                  </div>
                </div>

                {/* Live ROI Preview */}
                {preview && (
                  <div className="rounded-md bg-success/5 border border-success/20 px-md py-sm">
                    <p className="text-caption font-medium text-success">
                      Improvement: {preview.absolute > 0 ? "+" : ""}
                      {preview.absolute.toFixed(1)} {form.unit} ({preview.percentage > 0 ? "+" : ""}
                      {preview.percentage.toFixed(1)}%)
                    </p>
                  </div>
                )}

                {/* Date Implemented */}
                <div>
                  <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                    Date Implemented
                  </label>
                  <input
                    type="date"
                    value={form.date_implemented}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date_implemented: e.target.value }))
                    }
                    className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Any additional notes or context..."
                    className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none resize-none"
                  />
                </div>

                {error && <p className="text-caption text-error">{error}</p>}

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
                    {saving ? "Saving..." : "Add Solution"}
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
                Delete Solution
              </DialogTitle>
              <p className="mt-sm text-body text-charcoal/70">
                Are you sure you want to delete this winning solution? This
                action cannot be undone.
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
// Summary Stats Bar
// ---------------------------------------------------------------------------

function SummaryStats({ solutions }: { solutions: WinningSolution[] }) {
  const totalSolutions = solutions.length;

  // Aggregate improvements per metric type
  const aggregates = solutions.reduce(
    (acc, s) => {
      const improvement = calculateImprovement(
        s.metric_type,
        s.before_value,
        s.after_value
      );
      if (improvement && improvement.absolute > 0) {
        if (!acc[s.metric_type]) {
          acc[s.metric_type] = { count: 0, totalAbsolute: 0, units: new Set<string>() };
        }
        acc[s.metric_type].count += 1;
        acc[s.metric_type].totalAbsolute += improvement.absolute;
        acc[s.metric_type].units.add(s.unit);
      }
      return acc;
    },
    {} as Record<MetricType, { count: number; totalAbsolute: number; units: Set<string> }>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
      <div className="rounded-lg bg-white border border-paleGray p-md text-center">
        <p className="text-h2 font-heading text-navy">{totalSolutions}</p>
        <p className="text-caption text-charcoal/60">Solutions Implemented</p>
      </div>
      {(Object.entries(aggregates) as [MetricType, { count: number; totalAbsolute: number; units: Set<string> }][]).map(
        ([type, agg]) => {
          const config = METRIC_CONFIG[type];
          const unitLabel = agg.units.size === 1 ? Array.from(agg.units)[0] : "";
          return (
            <div
              key={type}
              className={`rounded-lg border border-paleGray p-md text-center ${config.bg}`}
            >
              <p className={`text-h2 font-heading ${config.color}`}>
                {agg.totalAbsolute % 1 === 0
                  ? agg.totalAbsolute
                  : agg.totalAbsolute.toFixed(1)}
                {unitLabel ? ` ${unitLabel}` : ""}
              </p>
              <p className="text-caption text-charcoal/60">
                {config.label} ({agg.count})
              </p>
            </div>
          );
        }
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Solution Card
// ---------------------------------------------------------------------------

function SolutionCard({
  solution,
  onDelete,
}: {
  solution: WinningSolution;
  onDelete: (id: string) => void;
}) {
  const config = METRIC_CONFIG[solution.metric_type];
  const improvement = calculateImprovement(
    solution.metric_type,
    solution.before_value,
    solution.after_value
  );

  return (
    <div className="rounded-lg border border-paleGray bg-white p-lg">
      <div className="flex items-start justify-between gap-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-sm flex-wrap">
            <h4 className="text-body font-medium text-charcoal truncate">
              {solution.title}
            </h4>
            <span
              className={`inline-flex items-center rounded-full px-sm py-[2px] text-caption font-medium ${config.bg} ${config.color}`}
            >
              {config.label}
            </span>
          </div>
          {solution.problem_addressed && (
            <p className="mt-xs text-caption text-charcoal/60">
              Problem: {solution.problem_addressed}
            </p>
          )}
        </div>
        <button
          onClick={() => onDelete(solution.id)}
          className="text-charcoal/30 hover:text-error transition-colors flex-shrink-0"
          title="Delete solution"
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
      </div>

      {/* Metrics display */}
      {improvement && (
        <div className="mt-md flex items-center gap-lg">
          <div className="flex items-center gap-md text-caption">
            <span className="text-charcoal/50">Before:</span>
            <span className="font-medium text-charcoal">
              {solution.before_value} {solution.unit}
            </span>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-charcoal/30 flex-shrink-0"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
          <div className="flex items-center gap-md text-caption">
            <span className="text-charcoal/50">After:</span>
            <span className="font-medium text-charcoal">
              {solution.after_value} {solution.unit}
            </span>
          </div>
        </div>
      )}

      {/* Improvement percentage */}
      {improvement && (
        <div className="mt-sm">
          <div className="inline-flex items-center gap-xs rounded-full bg-success/10 px-md py-xs">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-success"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <span className="text-caption font-medium text-success">
              {improvement.percentage > 0 ? "+" : ""}
              {improvement.percentage.toFixed(1)}% improvement
            </span>
            <span className="text-caption text-success/70">
              ({improvement.absolute > 0 ? "+" : ""}
              {improvement.absolute % 1 === 0
                ? improvement.absolute
                : improvement.absolute.toFixed(1)}{" "}
              {solution.unit})
            </span>
          </div>
        </div>
      )}

      {/* Description + date */}
      <div className="mt-md flex items-center gap-lg text-caption text-charcoal/50">
        {solution.date_implemented && (
          <span>
            Implemented:{" "}
            {new Date(solution.date_implemented).toLocaleDateString()}
          </span>
        )}
        {solution.description && (
          <span className="truncate">{solution.description}</span>
        )}
      </div>

      {solution.notes && (
        <p className="mt-xs text-caption text-charcoal/40 italic truncate">
          {solution.notes}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ImpactTracker() {
  const [solutions, setSolutions] = useState<WinningSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    const result = await getWinningSolutions();
    if (result.success && result.data) {
      setSolutions(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteWinningSolution(deleteTarget);
    setDeleting(false);
    if (result.success) {
      setSolutions((prev) => prev.filter((s) => s.id !== deleteTarget));
    }
    setDeleteTarget(null);
  }

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
  if (solutions.length === 0) {
    return (
      <>
        <div className="rounded-lg border border-paleGray bg-white p-2xl text-center">
          <div className="mx-auto mb-md flex h-[48px] w-[48px] items-center justify-center rounded-full bg-success/10">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-success"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h3 className="font-heading text-h3 text-charcoal">
            No Winning Solutions Yet
          </h3>
          <p className="mt-sm text-body text-charcoal/60 max-w-md mx-auto">
            Document measurable results from your improvement solutions and see
            auto-calculated impact metrics.
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
            Add Solution
          </button>
        </div>

        <AddSolutionModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSaved={fetchData}
        />
      </>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Summary stats */}
      <SummaryStats solutions={solutions} />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-caption text-charcoal/50">
          {solutions.length} solution{solutions.length !== 1 ? "s" : ""} tracked
        </p>
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
          Add Solution
        </button>
      </div>

      {/* Solution cards */}
      <div className="space-y-md">
        {solutions.map((solution) => (
          <SolutionCard
            key={solution.id}
            solution={solution}
            onDelete={(id) => setDeleteTarget(id)}
          />
        ))}
      </div>

      {/* Modals */}
      <AddSolutionModal
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
