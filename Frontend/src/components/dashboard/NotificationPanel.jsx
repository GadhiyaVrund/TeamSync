import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getNotifications,
  acceptInvite,
  rejectInvite,
  acceptRequest,
  rejectRequest,
} from "../../apis/notifications.api";
import { Button } from "../ui/button";

const POLL_INTERVAL_MS = 15000;

export default function NotificationPanel({
  isOpen,
  onClose,
  onCountChange,
}) {
  const [notifications, setNotifications] = useState({
    invites: [],
    requests: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getNotifications();
      const data = res?.data?.data || {};
      const invites = Array.isArray(data.invites)
        ? data.invites
        : Array.isArray(data.teamInvites)
          ? data.teamInvites
          : [];
      const requests = Array.isArray(data.requests)
        ? data.requests
        : Array.isArray(data.joinRequests)
          ? data.joinRequests
          : [];
      if (isMountedRef.current) {
        setNotifications({ invites, requests });
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      if (isMountedRef.current) {
        setError("Failed to load notifications.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const totalCount = useMemo(
    () => notifications.invites.length + notifications.requests.length,
    [notifications.invites.length, notifications.requests.length]
  );

  useEffect(() => {
    if (typeof onCountChange === "function") {
      onCountChange(totalCount);
    }
  }, [onCountChange, totalCount]);

  const handleInviteAction = async (inviteId, action) => {
    try {
      if (action === "accept") {
        await acceptInvite(inviteId);
      } else {
        await rejectInvite(inviteId);
      }

      setNotifications((prev) => ({
        ...prev,
        invites: prev.invites.filter((invite) => invite._id !== inviteId),
      }));
    } catch (err) {
      console.error("Failed to update invite:", err);
      setError("Failed to update invite.");
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      if (action === "accept") {
        await acceptRequest(requestId);
      } else {
        await rejectRequest(requestId);
      }

      setNotifications((prev) => ({
        ...prev,
        requests: prev.requests.filter((request) => request._id !== requestId),
      }));
    } catch (err) {
      console.error("Failed to update request:", err);
      setError("Failed to update request.");
    }
  };

  const renderEmptyState = (label) => (
    <div className="text-xs text-gray-400 px-2 py-3">
      No pending {label.toLowerCase()}.
    </div>
  );

  return (
    <div
      className={`absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg z-50 ${
        isOpen ? "block" : "hidden"
      }`}
      role="dialog"
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-900">Notifications</p>
          <p className="text-xs text-gray-400">{totalCount} pending</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500"
          onClick={onClose}
        >
          Close
        </Button>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-red-500 border-b border-gray-100">
          {error}
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        <section className="px-4 py-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Invites
          </h4>
          <div className="mt-2 space-y-3">
            {notifications.invites.length === 0 && !loading && renderEmptyState("Invites")}
            {notifications.invites.map((invite) => {
              const teamName =
                invite.teamId?.name || invite.team?.name || "Team";
              const inviterName =
                invite.createdBy?.username ||
                invite.createdBy?.email ||
                "An admin";

              return (
                <div
                  key={invite._id}
                  className="rounded-lg border border-gray-100 p-3 bg-gray-50"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {teamName} invite
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Invited by {inviterName}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleInviteAction(invite._id, "accept")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInviteAction(invite._id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="px-4 py-3 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Join Requests
          </h4>
          <div className="mt-2 space-y-3">
            {notifications.requests.length === 0 && !loading && renderEmptyState("Requests")}
            {notifications.requests.map((request) => {
              const teamName =
                request.teamId?.name || request.team?.name || "Team";
              const requesterName =
                request.createdBy?.username ||
                request.createdBy?.email ||
                "User";

              return (
                <div
                  key={request._id}
                  className="rounded-lg border border-gray-100 p-3 bg-gray-50"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {requesterName} requested to join {teamName}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRequestAction(request._id, "accept")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestAction(request._id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
