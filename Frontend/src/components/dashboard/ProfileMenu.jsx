import { useEffect, useRef, useState } from "react";
import { LogOut, UserCircle2 } from "lucide-react";
import { getAvatarColor, getInitials } from "../../utils/avatar";

export default function ProfileMenu({ currentUser, onOpenProfile, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const username = currentUser?.username || "";
  const initials = getInitials(username) || "?";
  const avatarColor = username ? getAvatarColor(username) : "bg-gray-400";

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleOpenProfile = () => {
    setOpen(false);
    onOpenProfile?.();
  };

  const handleLogout = () => {
    setOpen(false);
    onLogout?.();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="h-10 w-10 rounded-full border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30 flex items-center justify-center"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
      >
        <div className={`h-8 w-8 rounded-full ${avatarColor} flex items-center justify-center text-xs font-semibold text-white`}>
          {initials}
        </div>
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute right-0 top-full z-50 mt-3 w-64 origin-top-right rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl ring-1 ring-black/5 transition-all duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        }`}
      >
        <button
          type="button"
          role="menuitem"
          onClick={handleOpenProfile}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-950"
        >
          <UserCircle2 className="h-4 w-4 text-gray-500" />
          Manager Profile
        </button>

        <div className="my-2 h-px bg-gray-100" />

        <button
          type="button"
          role="menuitem"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
