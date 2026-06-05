import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, UserPlus } from "lucide-react";
import KanbanColumn from "./KanbanColumn";
import { KanbanBoardSkeleton } from "./DashboardSkeletons";
import MyTasksByTeam from "./MyTasksByTeam";
import { moveTodo } from "../../apis/todo.api";
import InviteUserModal from "./InviteUserModal";
import TeamAdminMenu from "./teamAdmin/TeamAdminMenu";
import TeamMembersModal from "./teamAdmin/TeamMembersModal";
import TeamActivityLogsModal from "./teamAdmin/TeamActivityLogsModal";

const COLUMN_CONFIG = {
  todo:       { id: "todo",       title: "To Do",      color: "bg-slate-400"    },
  inprogress: { id: "inprogress", title: "In Progress", color: "bg-blue-500"    },
  inreview:   { id: "inreview",   title: "In Review",   color: "bg-violet-500"  },
  completed:  { id: "completed",  title: "Completed",   color: "bg-emerald-500" },
};

const COLUMN_ORDER = ["todo", "inprogress", "inreview", "completed"];

const STATUS_TO_COLUMN = {
  "to-do":       "todo",
  "pending":     "todo",
  "in-progress": "inprogress",
  "in-review":   "inreview",
  "completed":   "completed",
};

const COLUMN_TO_STATUS = {
  "todo":       "to-do",
  "inprogress": "in-progress",
  "inreview":   "in-review",
  "completed":  "completed",
};

function buildColumns(tasks = []) {
  const cols = Object.fromEntries(
    COLUMN_ORDER.map((id) => [id, { ...COLUMN_CONFIG[id], tasks: [] }])
  );
  for (const task of tasks) {
    const colId = STATUS_TO_COLUMN[task.status] ?? "todo";
    cols[colId].tasks.push(task);
  }
  
  // Sort tasks within each column by due date (overdue/due soon first, then by priority)
  Object.keys(cols).forEach((colId) => {
    cols[colId].tasks.sort((a, b) => {
      // First, sort by overdue/due soon status
      const getUrgency = (task) => {
        if (!task.dueDate) return 2; // No due date - lowest priority
        const due = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        if (daysUntil < 0) return 0; // Overdue - highest priority
        if (daysUntil <= 3) return 1; // Due soon
        return 2; // Upcoming
      };
      
      const urgencyA = getUrgency(a);
      const urgencyB = getUrgency(b);
      
      if (urgencyA !== urgencyB) return urgencyA - urgencyB;
      
      // If same urgency, sort by priority (high > medium > low)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorA = priorityOrder[a.priority] ?? 1;
      const priorB = priorityOrder[b.priority] ?? 1;
      
      if (priorA !== priorB) return priorA - priorB;
      
      // Finally, sort by due date ascending
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      
      return 0;
    });
  });
  
  return cols;
}

export default function KanbanBoard({
  activeTab,
  selectedTeam,
  currentUser,
  onNewTask,
  onTeamUpdated,
  onToast,
  loading = false,
}) {
  const [columns, setColumns] = useState(() => buildColumns(selectedTeam?.tasks));
  const [movingTaskId, setMovingTaskId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastTone, setToastTone] = useState("error");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [teamMembersOpen, setTeamMembersOpen] = useState(false);
  const [teamLogsOpen, setTeamLogsOpen] = useState(false);
  const dragTaskId = useRef(null);
  const dragSourceColumnId = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, tone = "error") => {
    if (!message) return;
    setToastTone(tone);
    setToastMessage(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToastMessage("");
      toastTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    setColumns(buildColumns(selectedTeam?.tasks));
  }, [selectedTeam]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleDragStart = useCallback((e, taskId) => {
    const sourceColumn = Object.values(columns).find((col) =>
      col.tasks.some((t) => t._id === taskId)
    );
    dragTaskId.current = taskId;
    dragSourceColumnId.current = sourceColumn?.id ?? null;
    e.dataTransfer.effectAllowed = "move";
  }, [columns]);

  const handleDrop = useCallback(async (e, targetColumnId) => {
    e.preventDefault();
    const taskId = dragTaskId.current;
    const sourceColumnId = dragSourceColumnId.current;
    dragTaskId.current = null;
    dragSourceColumnId.current = null;

    if (!taskId || !sourceColumnId || sourceColumnId === targetColumnId) return;

    // Snapshot for revert
    const snapshot = columns;

    // Get the new status for the target column
    const newStatus = COLUMN_TO_STATUS[targetColumnId];

    // Optimistic update
    setColumns((prev) => {
      const sourceCol = { ...prev[sourceColumnId], tasks: [...prev[sourceColumnId].tasks] };
      const targetCol = { ...prev[targetColumnId], tasks: [...prev[targetColumnId].tasks] };
      const taskIndex = sourceCol.tasks.findIndex((t) => t._id === taskId);
      if (taskIndex === -1) return prev;
      const [movedTask] = sourceCol.tasks.splice(taskIndex, 1);
      // Update task status to match new column
      movedTask.status = newStatus;
      targetCol.tasks.push(movedTask);
      return { ...prev, [sourceColumnId]: sourceCol, [targetColumnId]: targetCol };
    });

    // Persist to backend
    if (newStatus) {
      setMovingTaskId(taskId);
      try {
        await moveTodo(taskId, newStatus);
      } catch (err) {
        console.error("Failed to update task status:", err);
        showToast(err?.response?.data?.message || "Failed to move task");
        // Revert on failure
        setColumns(snapshot);
      } finally {
        setMovingTaskId(null);
      }
    }
  }, [columns, showToast]);

  const totalTasks = Object.values(columns).reduce((acc, col) => acc + col.tasks.length, 0);
  const completedTasks = columns.completed?.tasks.length ?? 0;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const currentUserRole = selectedTeam?.members?.find(
    (member) => member.user?._id?.toString?.() === currentUser?._id?.toString?.()
  )?.role;

  const canMoveTask = useCallback((task) => {
    if (!currentUser?._id) {
      return false;
    }

    const isAssignedUser = task?.assignedTo?._id?.toString?.() === currentUser._id.toString();
    const canMoveAsLeader = ["admin", "manager"].includes(currentUserRole);

    return isAssignedUser || canMoveAsLeader;
  }, [currentUser?._id, currentUserRole]);

  const canInvite = selectedTeam && currentUserRole === "admin";
  const canCreateTask = selectedTeam && ["admin", "manager"].includes(currentUserRole);

  const handleInviteSuccess = (user) => {
    if (user?.username) {
      showToast(`Request sent to ${user.username}.`, "success");
    } else {
      showToast("Request sent.", "success");
    }
  };

  const handleTeamUpdated = (updatedTeam) => {
    if (updatedTeam) {
      onTeamUpdated?.(updatedTeam);
    }
  };

  const handleTaskUpdated = (updatedTask) => {
    // Refresh the task in columns
    setColumns((prev) => {
      const newColumns = JSON.parse(JSON.stringify(prev));
      const newStatus = STATUS_TO_COLUMN[updatedTask.status] ?? "todo";
      
      // Remove task from old columns
      Object.keys(newColumns).forEach((colId) => {
        newColumns[colId].tasks = newColumns[colId].tasks.filter(
          (t) => t._id !== updatedTask._id
        );
      });

      // Add updated task to correct column
      newColumns[newStatus].tasks.unshift(updatedTask);
      
      // Re-sort the column
      newColumns[newStatus].tasks.sort((a, b) => {
        const getUrgency = (task) => {
          if (!task.dueDate) return 2;
          const due = new Date(task.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          due.setHours(0, 0, 0, 0);
          const daysUntil = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
          if (daysUntil < 0) return 0;
          if (daysUntil <= 3) return 1;
          return 2;
        };
        
        const urgencyA = getUrgency(a);
        const urgencyB = getUrgency(b);
        if (urgencyA !== urgencyB) return urgencyA - urgencyB;
        
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorA = priorityOrder[a.priority] ?? 1;
        const priorB = priorityOrder[b.priority] ?? 1;
        if (priorA !== priorB) return priorA - priorB;
        
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return 0;
      });

      return newColumns;
    });

    showToast("Task updated successfully", "success");
  };

  const handleTaskDeleted = (taskId) => {
    setColumns((prev) => {
      const newColumns = JSON.parse(JSON.stringify(prev));
      Object.keys(newColumns).forEach((colId) => {
        newColumns[colId].tasks = newColumns[colId].tasks.filter(
          (t) => t._id !== taskId
        );
      });
      return newColumns;
    });

    showToast("Task deleted successfully", "success");
  };

  if (activeTab === "my-tasks") {
    return <MyTasksByTeam />;
  }

  if (loading) {
    return <KanbanBoardSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 max-w-sm rounded-lg border px-4 py-3 shadow-lg ${
          toastTone === "success"
            ? "border-emerald-200 bg-white"
            : "border-red-200 bg-white"
        }`}>
          <p className={`text-sm font-medium ${toastTone === "success" ? "text-emerald-600" : "text-red-600"}`}>
            {toastMessage}
          </p>
        </div>
      )}

      {/* Meta bar: team name + New Task button + progress */}
      <div className="flex items-center justify-between mb-5 px-1 shrink-0">
        {/* Left: name + subtitle */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {selectedTeam ? selectedTeam.name : "Select a team"}
            </h1>
            {selectedTeam && currentUserRole && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600 shrink-0">
                {currentUserRole}
              </span>
            )}
            {selectedTeam && (
              <TeamAdminMenu
                team={selectedTeam}
                currentUser={currentUser}
                onManageMembers={() => setTeamMembersOpen(true)}
                onViewLogs={() => setTeamLogsOpen(true)}
              />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalTasks === 0
              ? "No tasks yet"
              : `${completedTasks} of ${totalTasks} tasks completed`}
          </p>
        </div>

        {/* Right: progress bar + New Task */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Progress */}
          {totalTasks > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-gray-400 w-8">{progress}%</span>
            </div>
          )}

          {/* New Task */}
          {canInvite && (
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3.5 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-50 active:scale-95 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite User</span>
            </button>
          )}

          {selectedTeam && (
            <button
              onClick={() => {
                if (canCreateTask) onNewTask();
              }}
              disabled={!canCreateTask}
              title={!canCreateTask ? "Only admin or manager can create tasks" : "Create a new task"}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                canCreateTask
                  ? "bg-primary text-white hover:bg-primary/90 active:scale-95"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      {selectedTeam ? (
        <div className="flex gap-5 overflow-x-auto pb-6 flex-1 items-start">
          {COLUMN_ORDER.map((colId) => (
            <KanbanColumn
              key={colId}
              column={columns[colId]}
              movingTaskId={movingTaskId}
              canMoveTask={canMoveTask}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              team={selectedTeam}
              currentUser={currentUser}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Plus className="h-6 w-6 text-gray-300" />
          </div> 
          <div>
            <p className="text-sm font-medium text-gray-500">No team selected</p>
            <p className="text-xs text-gray-400 mt-0.5">Pick a team from the sidebar or create one.</p>
          </div>
        </div>
      )}

      {inviteOpen && selectedTeam && (
        <InviteUserModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          team={selectedTeam}
          onSuccess={handleInviteSuccess}
        />
      )}

      {teamMembersOpen && selectedTeam && (
        <TeamMembersModal
          isOpen={teamMembersOpen}
          teamId={selectedTeam._id}
          teamName={selectedTeam.name}
          currentUser={currentUser}
          onClose={() => setTeamMembersOpen(false)}
          onTeamUpdated={handleTeamUpdated}
          onToast={(message, tone) => {
            onToast?.(message, tone);
          }}
        />
      )}

      {teamLogsOpen && selectedTeam && (
        <TeamActivityLogsModal
          isOpen={teamLogsOpen}
          teamId={selectedTeam._id}
          teamName={selectedTeam.name}
          onClose={() => setTeamLogsOpen(false)}
          onToast={(message, tone) => {
            onToast?.(message, tone);
          }}
        />
      )}
    </div>
  );
}
