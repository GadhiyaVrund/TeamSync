import { Calendar, AlertCircle } from "lucide-react";
import { getInitials, getAvatarColor } from "../../utils/avatar";


function Avatar({ user }) {
  if (!user) return null;
  const initials = getInitials(user.username);
  const color = getAvatarColor(user.username);
  return (
    <div
      className={`h-6 w-6 rounded-full ${color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
      title={user.username}
    >
      {initials}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const priorityConfig = {
    low: { bg: "bg-blue-100", text: "text-blue-700", label: "Low" },
    medium: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Medium" },
    high: { bg: "bg-red-100", text: "text-red-700", label: "High" }
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function getDueDateInfo(dueDate) {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const daysUntil = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  const dateStr = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (daysUntil < 0) {
    return { text: `${dateStr} (Overdue)`, color: "text-red-600", bgColor: "bg-red-50", icon: "alert", isOverdue: true };
  } else if (daysUntil <= 3) {
    return { text: `${dateStr} (Due soon)`, color: "text-orange-600", bgColor: "bg-orange-50", icon: "alert", isDueSoon: true };
  } else {
    return { text: dateStr, color: "text-gray-600", bgColor: "bg-white", icon: "calendar", isUpcoming: true };
  }
}

export default function TaskCard({ task, onDragStart, canDrag = true, isSaving = false }) {
  const createdDate = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const dueDateInfo = getDueDateInfo(task.dueDate);

  return (
    <div
      draggable={canDrag && !isSaving}
      onDragStart={(e) => {
        if (!canDrag || isSaving) return;
        onDragStart(e, task._id);
      }}
      className={`relative bg-white rounded-lg border ${dueDateInfo?.isOverdue ? 'border-red-300 bg-red-50' : dueDateInfo?.isDueSoon ? 'border-orange-300' : 'border-gray-200'} p-3 shadow-sm hover:shadow-md transition-all group ${
        isSaving
          ? "opacity-50 cursor-wait"
          : canDrag
            ? "cursor-grab active:cursor-grabbing active:opacity-70 active:scale-[0.98]"
            : "cursor-not-allowed"
      }`}
      title={!canDrag ? "Only the assigned member, admin, or manager can move this task" : undefined}
    >
      {/* Priority Badge - Top Right */}
      {task.priority && (
        <div className="absolute top-2 right-2">
          <PriorityBadge priority={task.priority} />
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-gray-800 leading-snug mb-2 group-hover:text-gray-900 pr-12">
        {task.name}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-400 leading-relaxed mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Due Date */}
      {dueDateInfo && task.status !== 'completed' && (
        <div className={`mb-3 flex items-center gap-1 text-[11px] font-medium ${dueDateInfo.color}`}>
          {dueDateInfo.icon === 'alert' ? (
            <AlertCircle className="h-3 w-3" />
          ) : (
            <Calendar className="h-3 w-3" />
          )}
          {dueDateInfo.text}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        {createdDate && (
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Calendar className="h-3 w-3" />
            {createdDate}
          </span>
        )}
        <Avatar user={task.assignedTo} />
      </div>
    </div>
  );
}
