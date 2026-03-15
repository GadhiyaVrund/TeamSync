import { Calendar } from "lucide-react";
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

export default function TaskCard({ task, onDragStart, isSaving = false }) {
  const createdDate = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div
      draggable={!isSaving}
      onDragStart={(e) => onDragStart(e, task._id)}
      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group ${
        isSaving
          ? "opacity-50 cursor-wait"
          : "cursor-grab active:cursor-grabbing active:opacity-70 active:scale-[0.98]"
      }`}
    >
      {/* Title */}
      <p className="text-sm font-medium text-gray-800 leading-snug mb-2 group-hover:text-gray-900">
        {task.name}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        {createdDate && (
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <Calendar className="h-3 w-3" />
            {createdDate}
          </span>
        )}
        <Avatar user={task.assignedTo} />
      </div>
    </div>
  );
}
