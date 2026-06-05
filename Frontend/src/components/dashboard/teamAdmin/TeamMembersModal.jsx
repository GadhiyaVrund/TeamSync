import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { getAvatarColor, getInitials } from "../../../utils/avatar";
import {
  formatRoleLabel,
  getMemberDisplayName,
  getMemberEmail,
} from "../../../utils/teamAdministration";
import {
  changeTeamMemberRole,
  deleteTeamMember,
  fetchTeamMembers,
} from "../../../services/teamAdministration.service";

const ROLE_OPTIONS = ["admin", "manager", "member"];

export default function TeamMembersModal({ isOpen, teamId, teamName, onClose, onTeamUpdated, onToast, currentUser }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [members, setMembers] = useState([]);
  const [updatingMemberId, setUpdatingMemberId] = useState("");
  const [removingMemberId, setRemovingMemberId] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const closeTimerRef = useRef(null);
  const onTeamUpdatedRef = useRef(onTeamUpdated);
  const onToastRef = useRef(onToast);

  const confirmName = useMemo(() => getMemberDisplayName(confirmTarget), [confirmTarget]);

  useEffect(() => {
    onTeamUpdatedRef.current = onTeamUpdated;
  }, [onTeamUpdated]);

  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

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

    const loadMembers = async () => {
      setLoading(true);
      setError("");

      try {
        const team = await fetchTeamMembers(teamId);
        if (!active) {
          return;
        }

        setMembers(Array.isArray(team?.members) ? team.members : []);
        onTeamUpdatedRef.current?.(team);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError?.response?.data?.message || "Failed to load team members.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMembers();

    return () => {
      active = false;
    };
  }, [isOpen, teamId]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        if (confirmTarget) {
          setConfirmTarget(null);
          return;
        }
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
  }, [confirmTarget, isOpen, onClose]);

  const handleRoleChange = async (member, nextRole) => {
    if (!teamId || !member?.user?._id || nextRole === member.role) {
      return;
    }

    setUpdatingMemberId(member.user._id);
    setError("");

    try {
      await changeTeamMemberRole(teamId, member.user._id, nextRole);
      const refreshedTeam = await fetchTeamMembers(teamId);
      const updatedMembers = Array.isArray(refreshedTeam?.members) ? refreshedTeam.members : [];
      setMembers(updatedMembers);
      onTeamUpdatedRef.current?.(refreshedTeam);
      onToastRef.current?.(`Updated ${getMemberDisplayName(member)} to ${formatRoleLabel(nextRole)}.`, "success");
    } catch (roleError) {
      const message = roleError?.response?.data?.message || "Failed to update member role.";
      setError(message);
      onToastRef.current?.(message, "error");
    } finally {
      setUpdatingMemberId("");
    }
  };

  const handleRemoveMember = async () => {
    if (!teamId || !confirmTarget?.user?._id) {
      return;
    }

    const memberId = confirmTarget.user._id;
    setRemovingMemberId(memberId);
    setError("");

    try {
      await deleteTeamMember(teamId, memberId);
      const refreshedTeam = await fetchTeamMembers(teamId);
      const updatedMembers = Array.isArray(refreshedTeam?.members) ? refreshedTeam.members : [];
      setMembers(updatedMembers);
      onTeamUpdatedRef.current?.(refreshedTeam);
      onToastRef.current?.(`Removed ${getMemberDisplayName(confirmTarget)}.`, "success");
      setConfirmTarget(null);
    } catch (removeError) {
      const message = removeError?.response?.data?.message || "Failed to remove member.";
      setError(message);
      onToastRef.current?.(message, "error");
    } finally {
      setRemovingMemberId("");
    }
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          if (confirmTarget) {
            setConfirmTarget(null);
            return;
          }
          onClose?.();
        }
      }}
    >
      <div className={`relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 ${visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"}`} role="dialog" aria-modal="true" aria-labelledby="team-members-title">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Team administration</p>
            <h2 id="team-members-title" className="mt-1 text-xl font-semibold text-gray-950">Manage Members</h2>
            <p className="mt-1 text-sm text-gray-500">Update roles and remove members for {teamName || "this team"}.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close member management modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading team members...
              </div>
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
              <p className="text-sm font-medium text-gray-900">No members found</p>
              <p className="mt-1 text-sm text-gray-500">This team does not have any members available for management.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Member</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Current Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {members.map((member) => {
                      const memberId = member?.user?._id;
                      const isBusy = updatingMemberId === memberId || removingMemberId === memberId;
                      const isSelf = memberId?.toString?.() === currentUser?._id?.toString?.();
                      const displayName = getMemberDisplayName(member);
                      const email = getMemberEmail(member);
                      const initials = getInitials(displayName) || "?";
                      const avatarColor = getAvatarColor(displayName);

                      return (
                        <tr key={memberId} className="align-top">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-full ${avatarColor} flex items-center justify-center text-xs font-semibold text-white`}>
                                {initials}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                                <p className="text-xs text-gray-500">{isSelf ? "You" : "Team member"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{email || "—"}</td>
                          <td className="px-4 py-4">
                            <select
                              value={member.role}
                              onChange={(event) => handleRoleChange(member, event.target.value)}
                              disabled={isBusy || !teamId}
                              className="min-w-36 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                              aria-label={`Change role for ${displayName}`}
                            >
                              {ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>
                                  {formatRoleLabel(role)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => setConfirmTarget(member)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {removingMemberId === memberId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="remove-member-title">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 id="remove-member-title" className="text-lg font-semibold text-gray-950">Remove member?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Remove <span className="font-semibold text-gray-900">{confirmName}</span> from {teamName || "this team"}? This action can be reversed only by re-inviting them.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveMember}
                disabled={Boolean(removingMemberId)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {removingMemberId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}