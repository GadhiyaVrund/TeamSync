import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { deleteTodo, updateTodo } from "../../apis/todo.api";

const STATUS_OPTIONS = [
  { value: "to-do", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "in-review", label: "In Review" },
  { value: "completed", label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function UpdateTaskModal({ task, onClose, onTaskUpdated, onTaskDeleted, team }) {
  const [form, setForm] = useState({
    name: task?.name || "",
    description: task?.description || "",
    status: task?.status || "to-do",
    priority: task?.priority || "medium",
    dueDate: task?.dueDate ? task.dueDate.split("T")[0] : "",
    assignedTo: task?.assignedTo?._id || "",
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task?._id) return;

    setLoading(true);
    setError("");

    try {
      const payload = {};

      if (form.name.trim() !== task.name) payload.name = form.name.trim();
      if (form.description !== task.description)
        payload.description = form.description.trim() || null;
      if (form.status !== task.status) payload.status = form.status;
      if (form.priority !== task.priority) payload.priority = form.priority;
      if (form.dueDate !== (task.dueDate ? task.dueDate.split("T")[0] : ""))
        payload.dueDate = form.dueDate || null;

      // Assigned user changed
      const currentAssignedId = task.assignedTo ? task.assignedTo._id : "";
      if (form.assignedTo !== currentAssignedId) {
        payload.assignedTo = form.assignedTo || null;
      }

      if (Object.keys(payload).length === 0) {
        setError("No changes made");
        setLoading(false);
        return;
      }

      const res = await updateTodo(task._id, payload);
      onTaskUpdated(res.data.data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to update task"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task?._id) return;
    const confirmed = window.confirm("Delete this task? This cannot be undone.");
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      await deleteTodo(task._id);
      if (onTaskDeleted) {
        onTaskDeleted(task._id);
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to delete task"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Update Task</h2>
            <p className="text-xs text-gray-400 mt-0.5">Edit task details</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Task Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Task name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Task description..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee (team members only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</label>
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {team?.members?.map((member) => (
                <option key={member.user._id} value={member.user._id}>
                  {member.user.fullName || member.user.username}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              min={getMinDate()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || deleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
            >
              {loading ? "Updating..." : "Update Task"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || deleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-60 rounded-lg transition-colors"
            >
              {deleting ? "Deleting..." : "Delete Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
