import { useEffect, useRef, useState } from "react";
import { LockKeyhole, ShieldAlert, Trash2, X } from "lucide-react";
import { deleteUserAccount, updateUserProfile } from "../../apis/auth.api";
import { getAvatarColor, getInitials } from "../../utils/avatar";

const EMPTY_FORM = {
  username: "",
  email: "",
  currentPassword: "",
  password: "",
  confirmPassword: "",
};

export default function ManagerProfileModal({
  isOpen,
  currentUser,
  onClose,
  onProfileUpdated,
  onLogout,
  onToast,
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);
  const [form, setForm] = useState(EMPTY_FORM);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [notice, setNotice] = useState({ message: "", tone: "error" });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const closeTimerRef = useRef(null);
  const noticeTimerRef = useRef(null);

  const username = currentUser?.username || "";
  const initials = getInitials(username) || "?";
  const avatarColor = username ? getAvatarColor(username) : "bg-gray-400";

  const pushNotice = (message, tone = "error") => {
    setNotice({ message, tone });
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = setTimeout(() => {
      setNotice({ message: "", tone: "error" });
      noticeTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => setVisible(true));
      setForm({
        username: currentUser?.username || "",
        email: currentUser?.email || "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
      setChangingPassword(false);
      setDeleteConfirmOpen(false);
      setDeleteConfirmText("");
      setSubmitError("");
      setNotice({ message: "", tone: "error" });
      return;
    }

    setVisible(false);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => setShouldRender(false), 180);
  }, [currentUser, isOpen]);

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
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, [isOpen, onClose]);

  if (!shouldRender) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?._id) {
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
      };

      if (changingPassword) {
        payload.password = form.password;
        payload.currentPassword = form.currentPassword;
        payload.confirmPassword = form.confirmPassword;
      }

      const response = await updateUserProfile(currentUser._id, payload);
      const updatedUser = response?.data?.data;

      onProfileUpdated?.(updatedUser);
      onToast?.(changingPassword ? "Password updated successfully." : "Profile updated successfully.", "success");
      onClose?.();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to update profile";
      setSubmitError(message);
      pushNotice(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser?._id || deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      return;
    }

    setDeleteLoading(true);
    setSubmitError("");

    try {
      await deleteUserAccount(currentUser._id);
      onToast?.("Account deleted successfully.", "success");
      onClose?.();
      onLogout?.({ skipRequest: true, redirectTo: "/login", flashMessage: "Account deleted successfully." });
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to delete account";
      setSubmitError(message);
      pushNotice(message, "error");
    } finally {
      setDeleteLoading(false);
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
      <div
        className={`relative flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 ${visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-profile-title"
      >
        {notice.message && (
          <div className="absolute right-4 top-4 z-20 w-full max-w-xs rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-lg">
            {notice.message}
          </div>
        )}

        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Account</p>
            <h2 id="manager-profile-title" className="mt-1 text-xl font-semibold text-gray-950">
              Manager Profile
            </h2>
            <p className="mt-1 text-sm text-gray-500">Update your account details and security settings.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close profile modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className={`h-12 w-12 rounded-full ${avatarColor} flex items-center justify-center text-sm font-semibold text-white`}>
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Profile</p>
                <p className="text-xs text-gray-500">Edit your account details below.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(event) => setForm((previous) => ({ ...previous, username: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setChangingPassword((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <LockKeyhole className="h-4 w-4" />
                {changingPassword ? "Hide Password Fields" : "Change Password"}
              </button>
            </div>

            {changingPassword && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-gray-900">Change password</p>
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Current password
                    </label>
                    <input
                      type="password"
                      required
                      value={form.currentPassword}
                      onChange={(event) => setForm((previous) => ({ ...previous, currentPassword: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Current password"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        New password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={form.password}
                        onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="New password"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Confirm password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={form.confirmPassword}
                        onChange={(event) => setForm((previous) => ({ ...previous, confirmPassword: event.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Re-enter password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {submitError && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-600">
                {submitError}
              </p>
            )}

            <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-950">Danger zone</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Deleting your account permanently removes your profile and signs you out.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen((value) => !value)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
              </div>

              {deleteConfirmOpen && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-900">
                    Type <span className="font-semibold text-red-600">DELETE</span> to confirm.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(event) => setDeleteConfirmText(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-red-400 focus:ring-2 focus:ring-red-200"
                      placeholder="DELETE"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmOpen(false);
                          setDeleteConfirmText("");
                        }}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading || deleteConfirmText.trim().toUpperCase() !== "DELETE"}
                        className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deleteLoading ? "Deleting…" : "Confirm Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
