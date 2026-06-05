import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { fetchTeamActivityLogs } from "../../../services/teamAdministration.service";
import { formatLogTimestamp, getLogActionMessage, getLogDisplayUser } from "../../../utils/teamAdministration";

const PAGE_SIZE = 10;

export default function TeamActivityLogsModal({ isOpen, teamId, teamName, onClose, onToast }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const closeTimerRef = useRef(null);
  const onToastRef = useRef(onToast);

  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  const canGoPrevious = page > 1 && !loading;
  const canGoNext = page < totalPages && !loading;

  const emptyState = useMemo(() => !loading && !error && logs.length === 0, [error, loading, logs.length]);

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = setTimeout(() => setShouldRender(false), 180);
      return;
    }

    setShouldRender(true);
    requestAnimationFrame(() => setVisible(true));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !teamId) {
      return;
    }

    let active = true;

    const loadLogs = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchTeamActivityLogs(teamId, page, PAGE_SIZE);
        if (!active) {
          return;
        }

        const payload = response || {};
        setLogs(Array.isArray(payload.logs) ? payload.logs : []);
        setTotalPages(Math.max(1, payload.totalPages || 1));
        setTotalLogs(payload.totalLogs || 0);
      } catch (logsError) {
        if (!active) {
          return;
        }

        const message = logsError?.response?.data?.message || "Failed to load activity logs.";
        setError(message);
        onToastRef.current?.(message, "error");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      active = false;
    };
  }, [isOpen, page, teamId]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [isOpen, onClose]);

  if (!shouldRender) {
    return null;
  }

  const handlePrev = () => {
    if (canGoPrevious) {
      setPage((value) => Math.max(1, value - 1));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setPage((value) => Math.min(totalPages, value + 1));
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className={`relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 ${visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"}`} role="dialog" aria-modal="true" aria-labelledby="team-logs-title">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Team administration</p>
            <h2 id="team-logs-title" className="mt-1 text-xl font-semibold text-gray-950">Activity Logs</h2>
            <p className="mt-1 text-sm text-gray-500">Audit trail for {teamName || "this team"}.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close activity logs modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-500">
              {loading ? "Loading logs..." : `${totalLogs} log${totalLogs === 1 ? "" : "s"}`}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!canGoPrevious}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading activity logs...
              </div>
            </div>
          ) : emptyState ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
              <p className="text-sm font-medium text-gray-900">No activity logs yet</p>
              <p className="mt-1 text-sm text-gray-500">Team activity will appear here once members start making changes.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {logs.map((log) => (
                      <tr key={log._id}>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{getLogDisplayUser(log)}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{getLogActionMessage(log)}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{formatLogTimestamp(log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
                <span>Page {page} of {totalPages}</span>
                <span>Showing up to {PAGE_SIZE} entries per page</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}