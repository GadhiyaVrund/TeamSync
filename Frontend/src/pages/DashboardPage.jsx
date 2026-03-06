import { Link } from "wouter";
import { CheckSquare, LayoutDashboard, CheckCircle2, Users, Settings, LogOut, Bell, Search, Plus } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary/10 p-1.5 rounded-md">
              <CheckSquare className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">TeamSync</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            <a href="#" className="bg-primary/10 text-primary flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </a>
            <a href="#" className="text-gray-700 hover:bg-gray-100 flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <CheckCircle2 className="mr-3 h-5 w-5 text-gray-400" />
              My Tasks
            </a>
            <a href="#" className="text-gray-700 hover:bg-gray-100 flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <Users className="mr-3 h-5 w-5 text-gray-400" />
              Team
            </a>
            <a href="#" className="text-gray-700 hover:bg-gray-100 flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <Settings className="mr-3 h-5 w-5 text-gray-400" />
              Settings
            </a>
          </nav>
        </div>
        <div className="p-4 border-t border-border">
          <Link href="/" className="flex items-center text-sm font-medium text-gray-700 hover:text-red-600 px-3 py-2 rounded-md hover:bg-red-50 transition-colors">
            <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-600" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center w-full max-w-md">
            <div className="relative w-full text-gray-400 focus-within:text-gray-600">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="search"
                placeholder="Search tasks, users, or projects..."
                className="block w-full rounded-full border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-gray-50"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-500">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              JD
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, John</h1>
                <p className="text-sm text-gray-500 mt-1">Here's what's happening with your projects today.</p>
              </div>
              <button className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium flex items-center shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: "Completed Tasks", value: "12", trend: "+2 from yesterday", color: "text-green-600" },
                { label: "Pending Tasks", value: "5", trend: "-1 from yesterday", color: "text-blue-600" },
                { label: "Overdue", value: "2", trend: "Needs attention", color: "text-red-600" }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-border p-6">
                  <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                  <p className={`text-sm ${stat.color}`}>{stat.trend}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-5 border-b border-border">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  { user: "Sarah Smith", action: "completed", task: "Design System Updates", time: "2 hours ago" },
                  { user: "Mike Johnson", action: "commented on", task: "API Integration", time: "4 hours ago" },
                  { user: "Emily Davis", action: "created", task: "Q3 Marketing Plan", time: "5 hours ago" }
                ].map((item, i) => (
                  <div key={i} className="px-6 py-4 flex items-center hover:bg-gray-50 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-4">
                      {item.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{item.user}</span> {item.action} <span className="font-medium">{item.task}</span>
                      </p>
                      <p className="text-xs text-gray-500">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
