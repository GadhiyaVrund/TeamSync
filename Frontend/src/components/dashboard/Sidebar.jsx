import { useState } from "react";
import { Link } from "wouter";
import { getInitials, getAvatarColor } from "../../utils/avatar";
import { TeamListSkeleton } from "./DashboardSkeletons";
import {
  Home,
  CheckSquare,
  Zap,
  CalendarDays,
  Users,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home",     label: "Home",           icon: Home         },
  { id: "my-tasks", label: "My Tasks",        icon: CheckSquare  },
  { id: "sprint",   label: "Current Sprint",  icon: Zap          },
];




/** Nicely capitalize a lowercase username for display: alexjohnson → Alexjohnson */
function displayName(username = "") {
  if (!username) return "";
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function NavItem({ icon: Icon, label, active, onClick, indent = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors text-left ${
        indent ? "pl-7" : ""
      } ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function Sidebar({
  activeNav, setActiveNav, collapsed, setCollapsed,
  teams = [], selectedTeamId, onSelectTeam, onCreateTeam, currentUser, teamsLoading = false,
}) {
  const [teamspacesOpen, setTeamspacesOpen] = useState(true);
  

  const username = currentUser?.username || "";
  const initials = getInitials(username);
  const avatarColor = username ? getAvatarColor(username) : "bg-gray-300";

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-gray-200 transition-all duration-300 shrink-0 ${
        collapsed ? "w-14" : "w-60"
      }`}
    >
      {/* Logo & toggle */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-gray-200 shrink-0">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="bg-primary/10 p-1.5 rounded-md shrink-0">
              <CheckSquare className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-base tracking-tight text-gray-900 truncate">TeamSync</span>
          </Link>
        )}
        {collapsed && (
          <div className="flex items-center justify-center w-full">
            <div className="bg-primary/10 p-1.5 rounded-md">
              <CheckSquare className="h-4 w-4 text-primary" />
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 ${
            collapsed ? "hidden" : ""
          }`}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-16 z-10 bg-white border border-gray-200 rounded-full p-0.5 shadow-sm text-gray-400 hover:text-gray-700"
        >
          <PanelLeftOpen className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {/* Main nav */}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          if (collapsed) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                title={item.label}
                className={`w-full flex items-center justify-center p-2 rounded-md transition-colors ${
                  activeNav === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          }
          return (
            <NavItem
              key={item.id}
              icon={Icon}
              label={item.label}
              active={activeNav === item.id}
              onClick={() => setActiveNav(item.id)}
            />
          );
        })}

        {/* Teamspaces */}
        {!collapsed && (
          <div className="pt-4">
            <button
              onClick={() => setTeamspacesOpen(!teamspacesOpen)}
              className="w-full flex items-center gap-1 px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
            >
              {teamspacesOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Teamspaces
              <button
                onClick={(e) => { e.stopPropagation(); onCreateTeam(); }}
                className="ml-auto p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700"
                title="Create team"
              >
                <Plus className="h-3 w-3" />
              </button>
            </button>
            {teamspacesOpen && (
              teamsLoading ? (
                <TeamListSkeleton />
              ) : (
                <div className="mt-1 space-y-0.5">
                  {teams.length === 0 ? (
                    <p className="pl-7 py-1 text-xs text-gray-400">No teams yet</p>
                  ) : (
                    teams.map((team) => (
                      <NavItem
                        key={team._id}
                        icon={Users}
                        label={team.name}
                        active={selectedTeamId === team._id}
                        onClick={() => onSelectTeam(team._id)}
                        indent
                      />
                    ))
                  )}
                </div>
              )
            )}
          </div>
        )}

       
      </div>

      {/* User footer */}
      <div className="border-t border-gray-200 p-2 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer group">
            <div
              className={`h-7 w-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 transition-colors`}
            >
              {initials || (
                <span className="h-3 w-3 rounded-full bg-white/40 animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser ? displayName(username) : (
                  <span className="inline-block h-3 w-24 bg-gray-200 rounded animate-pulse" />
                )}
              </p>
              <p className="text-xs text-gray-400 truncate">{currentUser?.email || ""}</p>
            </div>
            <Link
              href="/"
              title="Sign out"
              className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className={`h-7 w-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-colors`}
              title={currentUser?.username}
            >
              {initials || <span className="h-2.5 w-2.5 rounded-full bg-white/40" />}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
