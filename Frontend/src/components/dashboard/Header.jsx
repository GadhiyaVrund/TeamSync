import { useState } from "react";
import { Search, Bell, SlidersHorizontal, X } from "lucide-react";

const HEADER_TABS = [
  { id: "company",  label: "Company Tasks"   },
  { id: "my-tasks", label: "My Tasks"         },
  { id: "sprint",   label: "Current Sprint"   },
  { id: "timeline", label: "Timeline"         },
];

const AVATAR_COLORS = [
  "bg-violet-500", "bg-sky-500", "bg-emerald-500",
  "bg-amber-500",  "bg-rose-500", "bg-indigo-500",
];

export default function Header({ activeTab, setActiveTab, currentUser }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifCount] = useState(3);

  const username = currentUser?.username || "";
  const initials = username.slice(0, 2).toUpperCase() || "?";
  const avatarColor = username
    ? AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length]
    : "bg-gray-400";

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0 gap-4">
      {/* Tabs */}
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {HEADER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <div className={`flex items-center transition-all duration-200 ${searchOpen ? "w-52" : "w-8"}`}>
          {searchOpen ? (
            <div className="flex items-center w-full bg-gray-100 rounded-lg px-2.5 py-1.5 gap-2">
              <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none flex-1 min-w-0"
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Filters"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filters</span>
        </button>

        {/* Notifications */}
        <button
          className="relative p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-1 ring-white" />
          )}
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200" />

        
        <div
          className={`h-7 w-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold cursor-pointer shrink-0`}
          title={username}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
