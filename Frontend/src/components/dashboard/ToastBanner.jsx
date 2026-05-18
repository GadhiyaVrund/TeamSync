export default function ToastBanner({ message, tone = "success", className = "" }) {
  if (!message) {
    return null;
  }

  const toneStyles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700 shadow-red-950/10"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-950/10";

  return (
    <div className={`pointer-events-none fixed right-4 top-4 z-[70] ${className}`}>
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto max-w-sm rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur ${toneStyles}`}
      >
        {message}
      </div>
    </div>
  );
}
