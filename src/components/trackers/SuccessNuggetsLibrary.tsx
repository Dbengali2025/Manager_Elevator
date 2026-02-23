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
  getSuccessNuggets,
  createSuccessNugget,
  updateSuccessNugget,
  deleteSuccessNugget,
  generateSuccessNuggets,
  saveGeneratedNuggets,
} from "@/actions/trackers";
import type { GeneratedNugget } from "@/actions/trackers";
import type { SuccessNugget } from "@/db/types";

// ---------------------------------------------------------------------------
// Source badge
// ---------------------------------------------------------------------------

function SourceBadge({ source }: { source: SuccessNugget["source"] }) {
  const isManual = source === "manual";
  return (
    <span
      className={`inline-flex items-center gap-[4px] rounded-full px-sm py-[2px] text-caption font-medium ${
        isManual
          ? "bg-teal/10 text-teal"
          : "bg-skyBlue/10 text-skyBlue"
      }`}
    >
      {isManual ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 14v4" />
        </svg>
      )}
      {isManual ? "Manual" : "AI Generated"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Modal
// ---------------------------------------------------------------------------

interface NuggetFormData {
  achievement_statement: string;
  supporting_metrics: string;
  talking_points: string;
}

const EMPTY_FORM: NuggetFormData = {
  achievement_statement: "",
  supporting_metrics: "",
  talking_points: "",
};

function NuggetFormModal({
  open,
  onClose,
  onSaved,
  editNugget,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editNugget?: SuccessNugget | null;
}) {
  const [form, setForm] = useState<NuggetFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!editNugget;

  // Populate form when opening
  useEffect(() => {
    if (open) {
      if (editNugget) {
        setForm({
          achievement_statement: editNugget.achievement_statement,
          supporting_metrics: editNugget.supporting_metrics,
          talking_points: editNugget.talking_points,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError("");
    }
  }, [open, editNugget]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.achievement_statement.trim()) {
      setError("Achievement statement is required");
      return;
    }
    setSaving(true);
    setError("");

    const result = isEditing
      ? await updateSuccessNugget(editNugget!.id, form)
      : await createSuccessNugget(form);

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
                {isEditing ? "Edit Nugget" : "Add Nugget"}
              </DialogTitle>

              <form onSubmit={handleSubmit} className="mt-lg space-y-md">
                {/* Achievement Statement */}
                <div>
                  <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                    Achievement Statement
                  </label>
                  <textarea
                    value={form.achievement_statement}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        achievement_statement: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="e.g., Led process improvement initiative that reduced report generation time by 40%"
                    className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none resize-none"
                  />
                </div>

                {/* Supporting Metrics */}
                <div>
                  <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                    Supporting Metrics
                  </label>
                  <textarea
                    value={form.supporting_metrics}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        supporting_metrics: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="e.g., Reduced from 8 hours/week to 4.8 hours/week, saving $12,000 annually"
                    className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none resize-none"
                  />
                </div>

                {/* Talking Points */}
                <div>
                  <label className="block text-caption font-medium text-charcoal/70 mb-xs">
                    Talking Points
                  </label>
                  <textarea
                    value={form.talking_points}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        talking_points: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="e.g., Identified root cause using CI Done Right methodology, engaged cross-functional team..."
                    className="w-full rounded-md border border-paleGray px-md py-sm text-body focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none resize-none"
                  />
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
                    {saving
                      ? "Saving..."
                      : isEditing
                      ? "Save Changes"
                      : "Add Nugget"}
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
                Delete Nugget
              </DialogTitle>
              <p className="mt-sm text-body text-charcoal/70">
                Are you sure you want to delete this success nugget? This action
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
// AI Review Modal — edit generated nuggets before saving
// ---------------------------------------------------------------------------

function AIReviewModal({
  open,
  onClose,
  onSaved,
  generatedNuggets,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  generatedNuggets: GeneratedNugget[];
}) {
  const [nuggets, setNuggets] = useState<GeneratedNugget[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setNuggets(generatedNuggets.map((n) => ({ ...n })));
      setSelected(generatedNuggets.map(() => true));
      setError("");
    }
  }, [open, generatedNuggets]);

  function updateNugget(
    index: number,
    field: keyof GeneratedNugget,
    value: string
  ) {
    setNuggets((prev) =>
      prev.map((n, i) => (i === index ? { ...n, [field]: value } : n))
    );
  }

  function toggleSelect(index: number) {
    setSelected((prev) => prev.map((s, i) => (i === index ? !s : s)));
  }

  async function handleSave() {
    const toSave = nuggets.filter((_, i) => selected[i]);
    if (toSave.length === 0) {
      setError("Select at least one nugget to save");
      return;
    }
    setSaving(true);
    setError("");
    const result = await saveGeneratedNuggets(toSave);
    setSaving(false);
    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error ?? "Failed to save nuggets");
    }
  }

  const selectedCount = selected.filter(Boolean).length;

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
            <DialogPanel className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg bg-white p-xl shadow-xl">
              <DialogTitle className="font-heading text-h2 text-charcoal">
                Review Generated Nuggets
              </DialogTitle>
              <p className="mt-xs text-caption text-charcoal/60">
                Edit and select the nuggets you&apos;d like to save to your
                library.
              </p>

              <div className="mt-lg space-y-lg">
                {nuggets.map((nugget, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-md transition-colors ${
                      selected[i]
                        ? "border-skyBlue bg-skyBlue/5"
                        : "border-paleGray bg-paleGray/30 opacity-60"
                    }`}
                  >
                    {/* Select toggle */}
                    <label className="flex items-center gap-sm mb-md cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected[i]}
                        onChange={() => toggleSelect(i)}
                        className="h-[18px] w-[18px] rounded border-paleGray text-skyBlue focus:ring-skyBlue"
                      />
                      <span className="text-caption font-medium text-charcoal/70">
                        Nugget {i + 1}
                      </span>
                    </label>

                    {/* Achievement Statement */}
                    <div className="mb-sm">
                      <label className="block text-[11px] font-medium text-charcoal/50 mb-xs">
                        Achievement Statement
                      </label>
                      <textarea
                        value={nugget.achievement_statement}
                        onChange={(e) =>
                          updateNugget(i, "achievement_statement", e.target.value)
                        }
                        rows={2}
                        className="w-full rounded-md border border-paleGray px-sm py-xs text-caption focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none resize-none"
                      />
                    </div>

                    {/* Supporting Metrics */}
                    <div className="mb-sm">
                      <label className="block text-[11px] font-medium text-charcoal/50 mb-xs">
                        Supporting Metrics
                      </label>
                      <textarea
                        value={nugget.supporting_metrics}
                        onChange={(e) =>
                          updateNugget(i, "supporting_metrics", e.target.value)
                        }
                        rows={2}
                        className="w-full rounded-md border border-paleGray px-sm py-xs text-caption focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none resize-none"
                      />
                    </div>

                    {/* Talking Points */}
                    <div>
                      <label className="block text-[11px] font-medium text-charcoal/50 mb-xs">
                        Talking Points
                      </label>
                      <textarea
                        value={nugget.talking_points}
                        onChange={(e) =>
                          updateNugget(i, "talking_points", e.target.value)
                        }
                        rows={2}
                        className="w-full rounded-md border border-paleGray px-sm py-xs text-caption focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <p className="mt-md text-caption text-error">{error}</p>
              )}

              {/* Actions */}
              <div className="mt-lg flex items-center justify-between">
                <p className="text-caption text-charcoal/50">
                  {selectedCount} of {nuggets.length} selected
                </p>
                <div className="flex gap-sm">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md px-lg py-sm text-body text-charcoal/70 hover:text-charcoal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || selectedCount === 0}
                    className="rounded-md bg-navy px-lg py-sm text-body text-white hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving
                      ? "Saving..."
                      : `Save ${selectedCount} Nugget${selectedCount !== 1 ? "s" : ""}`}
                  </button>
                </div>
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

export default function SuccessNuggetsLibrary() {
  const [nuggets, setNuggets] = useState<SuccessNugget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<SuccessNugget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedNuggets, setGeneratedNuggets] = useState<GeneratedNugget[]>(
    []
  );
  const [showReview, setShowReview] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const fetchData = useCallback(async () => {
    const result = await getSuccessNuggets();
    if (result.success && result.data) {
      setNuggets(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleEdit(nugget: SuccessNugget) {
    setEditTarget(nugget);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteSuccessNugget(deleteTarget);
    setDeleting(false);
    if (result.success) {
      setNuggets((prev) => prev.filter((n) => n.id !== deleteTarget));
    }
    setDeleteTarget(null);
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError("");
    const result = await generateSuccessNuggets();
    setGenerating(false);
    if (result.success && result.data) {
      setGeneratedNuggets(result.data);
      setShowReview(true);
    } else {
      setGenerateError(result.error ?? "Generation failed. Please try again.");
    }
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
  if (nuggets.length === 0) {
    return (
      <>
        <div className="rounded-lg border border-paleGray bg-white p-2xl text-center">
          <div className="mx-auto mb-md flex h-[48px] w-[48px] items-center justify-center rounded-full bg-teal/10">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-teal"
            >
              <path d="M12 2l2.4 4.8L20 7.6l-4 3.9 1 5.5L12 14.5 6.9 17l1-5.5-4-3.9 5.6-.8z" />
            </svg>
          </div>
          <h3 className="font-heading text-h3 text-charcoal">
            No Success Nuggets Yet
          </h3>
          <p className="mt-sm text-body text-charcoal/60 max-w-md mx-auto">
            Build your success nuggets library for performance reviews and career
            conversations.
          </p>
          <div className="mt-lg flex items-center justify-center gap-sm">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-xs rounded-md bg-navy px-lg py-sm text-body text-white hover:bg-navy/90"
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
              Add Nugget
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-xs rounded-md bg-skyBlue px-lg py-sm text-body text-white hover:bg-skyBlue/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
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
                  <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 14v4" />
                </svg>
              )}
              {generating ? "Generating..." : "Generate Nuggets"}
            </button>
          </div>
          {generateError && (
            <p className="mt-md text-caption text-error">{generateError}</p>
          )}
        </div>

        <NuggetFormModal
          open={showForm}
          onClose={handleCloseForm}
          onSaved={fetchData}
          editNugget={editTarget}
        />

        <AIReviewModal
          open={showReview}
          onClose={() => setShowReview(false)}
          onSaved={fetchData}
          generatedNuggets={generatedNuggets}
        />
      </>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-sm">
        <p className="text-caption text-charcoal/50">
          {nuggets.length} nugget{nuggets.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-sm">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-xs rounded-md bg-skyBlue px-md py-[6px] min-h-[44px] text-caption text-white hover:bg-skyBlue/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <svg
                className="animate-spin h-[14px] w-[14px]"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-25"
                />
                <path
                  d="M4 12a8 8 0 018-8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
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
                <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
                <path d="M12 14v4" />
              </svg>
            )}
            {generating ? "Generating..." : "Generate Nuggets"}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-xs rounded-md bg-navy px-md py-[6px] min-h-[44px] text-caption text-white hover:bg-navy/90"
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
            Add Nugget
          </button>
        </div>
      </div>
      {generateError && (
        <p className="text-caption text-error">{generateError}</p>
      )}

      {/* Nugget cards */}
      <div className="grid gap-md sm:grid-cols-2">
        {nuggets.map((nugget) => (
          <div
            key={nugget.id}
            className="rounded-lg border border-paleGray bg-white p-lg"
          >
            {/* Header: source badge + actions */}
            <div className="flex items-start justify-between gap-sm mb-md">
              <SourceBadge source={nugget.source} />
              <div className="flex items-center gap-xs">
                <button
                  onClick={() => handleEdit(nugget)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-charcoal/30 hover:text-skyBlue transition-colors"
                  title="Edit nugget"
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
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteTarget(nugget.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-charcoal/30 hover:text-error transition-colors"
                  title="Delete nugget"
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
            </div>

            {/* Achievement statement */}
            <h4 className="text-body font-medium text-charcoal leading-snug">
              {nugget.achievement_statement}
            </h4>

            {/* Supporting metrics */}
            {nugget.supporting_metrics && (
              <div className="mt-md">
                <p className="text-caption font-medium text-charcoal/50 mb-xs">
                  Supporting Metrics
                </p>
                <p className="text-caption text-charcoal/70 whitespace-pre-line">
                  {nugget.supporting_metrics}
                </p>
              </div>
            )}

            {/* Talking points */}
            {nugget.talking_points && (
              <div className="mt-md">
                <p className="text-caption font-medium text-charcoal/50 mb-xs">
                  Talking Points
                </p>
                <p className="text-caption text-charcoal/70 whitespace-pre-line">
                  {nugget.talking_points}
                </p>
              </div>
            )}

            {/* Date */}
            <p className="mt-md text-[11px] text-charcoal/30">
              {new Date(nugget.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>

      {/* Modals */}
      <NuggetFormModal
        open={showForm}
        onClose={handleCloseForm}
        onSaved={fetchData}
        editNugget={editTarget}
      />

      <DeleteConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      <AIReviewModal
        open={showReview}
        onClose={() => setShowReview(false)}
        onSaved={fetchData}
        generatedNuggets={generatedNuggets}
      />
    </div>
  );
}
