import { AlertTriangle, CalendarClock, CircleCheck, Users } from "lucide-react";

const PRIORITY_THEME = {
  high: {
    badge: "bg-red-100 text-red-700 border-red-200",
    card: "border-red-200 bg-red-50/50",
  },
  medium: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    card: "border-amber-200 bg-amber-50/40",
  },
  low: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    card: "border-gray-200 bg-white",
  },
};

function formatPriority(priority = "medium") {
  const key = String(priority).toLowerCase();
  const label = key.charAt(0).toUpperCase() + key.slice(1);
  return { key, label };
}

function formatStatus(status = "to-do") {
  return status
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDueText(dueDate) {
  if (!dueDate) {
    return "No due date";
  }

  const due = new Date(dueDate);
  const today = new Date();

  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "Overdue";
  }

  if (diffDays === 0) {
    return "Due Today";
  }

  if (diffDays === 1) {
    return "Due Tomorrow";
  }

  return `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function TaskCard({ task }) {
  const { key: priorityKey, label: priorityLabel } = formatPriority(task.priority);
  const theme = PRIORITY_THEME[priorityKey] || PRIORITY_THEME.medium;
  const dueText = getDueText(task.dueDate);
  const isHighPriority = priorityKey === "high";

  return (
    <article
      className={`rounded-xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${theme.card}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900">{task.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{task.description || "No description provided."}</p>
        </div>

        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${theme.badge}`}>
          {priorityLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
        <p className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" />
          {dueText}
        </p>
        <p className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {task.team?.name || "Unknown Team"}
        </p>
        <p className="inline-flex items-center gap-1.5">
          <CircleCheck className="h-3.5 w-3.5" />
          {formatStatus(task.status)}
        </p>
      </div>

      {isHighPriority && (
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
          <AlertTriangle className="h-3 w-3" />
          Needs attention
        </div>
      )}
    </article>
  );
}
