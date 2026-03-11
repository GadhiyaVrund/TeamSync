import { useState, useEffect } from "react";
import { X, Users } from "lucide-react";

const TEAM_COLORS = [
  { id: "violet", bg: "bg-violet-500", ring: "ring-violet-300", hex: "#8b5cf6" },
  { id: "sky",    bg: "bg-sky-500",    ring: "ring-sky-300",    hex: "#0ea5e9" },
  { id: "emerald",bg: "bg-emerald-500",ring: "ring-emerald-300",hex: "#10b981" },
  { id: "amber",  bg: "bg-amber-500",  ring: "ring-amber-300",  hex: "#f59e0b" },
  { id: "rose",   bg: "bg-rose-500",   ring: "ring-rose-300",   hex: "#f43f5e" },
  { id: "indigo", bg: "bg-indigo-500", ring: "ring-indigo-300", hex: "#6366f1" },
];

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CreateTeamModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onCreated({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create team");
      setLoading(false);
    }
  };

  const initials = getInitials(name) || <Users className="h-5 w-5 text-white/80" />;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

        {/* Colored top accent bar */}
        <div className={`h-1.5 w-full ${color.bg}`} />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Create a new team</h2>
            <p className="text-xs text-gray-400 mt-0.5">Teams help you organise tasks and collaborate.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-4 mt-0.5 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-5">

          {/* Live preview */}
          <div className={`flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100`}>
            <div className={`h-12 w-12 rounded-xl ${color.bg} flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-sm transition-all duration-200`}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className={`text-base font-semibold ${name ? "text-gray-900" : "text-gray-300"} truncate transition-colors`}>
                {name || "Team name"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {description || "No description yet"}
              </p>
            </div>
          </div>

          {/* Team name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Team Name <span className="text-red-400">*</span>
            </label>
            <input
              required
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering, Design, Marketing…"
              maxLength={60}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-600">Description</label>
              <span className={`text-xs tabular-nums ${description.length > 450 ? "text-amber-500" : "text-gray-300"}`}>
                {description.length}/500
              </span>
            </div>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this team work on?"
              maxLength={500}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Team Colour</label>
            <div className="flex items-center gap-2">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full ${c.bg} transition-all duration-150 ${
                    color.id === c.id
                      ? `ring-2 ring-offset-2 ${c.ring} scale-110`
                      : "hover:scale-105 opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-sm ${color.bg} hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {loading ? "Creating\u2026" : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
