import { useEffect, useMemo, useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { searchUsers } from "../../apis/users.api";
import { requestUserToJoinTeam } from "../../apis/team.api";

export default function InviteUserModal({ isOpen, onClose, team, onSuccess }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setResults([]);
    setSelectedUser(null);
    setError("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSelectedUser(null);
      setError("");
      return;
    }

    let isActive = true;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchUsers(trimmed);
        if (!isActive) return;
        const users = Array.isArray(res?.data?.data) ? res.data.data : [];
        setResults(users);
      } catch (err) {
        if (!isActive) return;
        setResults([]);
        setError(err?.response?.data?.message || "Failed to search users.");
      } finally {
        if (isActive) setSearching(false);
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const canSend = useMemo(
    () => Boolean(team?._id && selectedUser?._id) && !sending,
    [team?._id, selectedUser?._id, sending]
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!team?._id || !selectedUser?._id) return;
    setSending(true);
    setError("");
    try {
      await requestUserToJoinTeam(team._id, { userId: selectedUser._id });
      if (typeof onSuccess === "function") {
        onSuccess(selectedUser, team);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send request.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Invite user</h2>
            <p className="text-xs text-gray-400 mt-0.5">Send a request to join {team?.name || "this team"}.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Username</label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedUser(null); setError(""); }}
                placeholder="Search by username"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder-gray-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              </div>
            </div>

            {results.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-100 rounded-lg bg-white shadow-sm">
                {results.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => { setSelectedUser(user); setQuery(user.username); setResults([]); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                      selectedUser?._id === user._id ? "bg-gray-50" : ""
                    }`}
                  >
                    <span className="text-gray-900 truncate">{user.username}</span>
                    {selectedUser?._id === user._id && (
                      <span className="text-[11px] text-gray-400">Selected</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!searching && query.trim() && results.length === 0 && (
              <p className="mt-2 text-xs text-gray-400">No users found.</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSend}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
