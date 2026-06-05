import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList, Settings2, Users2 } from "lucide-react";
import { canManageTeam } from "../../../utils/teamAdministration";

const MENU_ITEMS = [
  {
    id: "members",
    label: "Manage Members",
    description: "Review roles and membership",
    icon: Users2,
  },
  {
    id: "logs",
    label: "View Activity Logs",
    description: "Inspect team audit history",
    icon: ClipboardList,
  },
];

export default function TeamAdminMenu({ team, currentUser, onManageMembers, onViewLogs }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);

  const canShowMenu = useMemo(
    () => canManageTeam(team, currentUser?._id),
    [currentUser?._id, team]
  );

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

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        itemRefs.current[0]?.focus?.();
      });
    }
  }, [open]);

  const handleToggle = () => {
    setOpen((value) => !value);
  };

  const handleAction = (action) => {
    setOpen(false);

    if (action === "members") {
      onManageMembers?.();
      return;
    }

    if (action === "logs") {
      onViewLogs?.();
    }
  };

  const handleKeyDown = (event, index, actionId) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      itemRefs.current[(index + 1) % MENU_ITEMS.length]?.focus?.();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      itemRefs.current[(index - 1 + MENU_ITEMS.length) % MENU_ITEMS.length]?.focus?.();
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      itemRefs.current[0]?.focus?.();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      itemRefs.current[MENU_ITEMS.length - 1]?.focus?.();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleAction(actionId);
    }
  };

  if (!canShowMenu) {
    return null;
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Team actions"
      >
        <Settings2 className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute left-0 top-full z-50 mt-2 w-72 origin-top-left rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl ring-1 ring-black/5 transition-all duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Team controls</p>
          <p className="mt-1 text-xs text-gray-500">Manage membership and view team history.</p>
        </div>

        <div className="my-1 h-px bg-gray-100" />

        {MENU_ITEMS.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              onClick={() => handleAction(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index, item.id)}
              className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900">{item.label}</span>
                <span className="block text-xs text-gray-500">{item.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}