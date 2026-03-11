import { useState, useRef, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import KanbanColumn from "./KanbanColumn";
import { updateTodo } from "../../apis/todo.api";

const COLUMN_CONFIG = {
  todo:       { id: "todo",       title: "To Do",      color: "bg-slate-400"    },
  inprogress: { id: "inprogress", title: "In Progress", color: "bg-blue-500"    },
  inreview:   { id: "inreview",   title: "In Review",   color: "bg-violet-500"  },
  completed:  { id: "completed",  title: "Completed",   color: "bg-emerald-500" },
};

const COLUMN_ORDER = ["todo", "inprogress", "inreview", "completed"];

const STATUS_TO_COLUMN = {
  "pending":     "todo",
  "in-progress": "inprogress",
  "in-review":   "inreview",
  "completed":   "completed",
};

const COLUMN_TO_STATUS = {
  "todo":       "pending",
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
  return cols;
}

export default function KanbanBoard({ activeTab, selectedTeam, onNewTask }) {
  const [columns, setColumns] = useState(() => buildColumns(selectedTeam?.tasks));
  const [movingTaskId, setMovingTaskId] = useState(null);
  const dragTaskId = useRef(null);
  const dragSourceColumnId = useRef(null);

  useEffect(() => {
    setColumns(buildColumns(selectedTeam?.tasks));
  }, [selectedTeam]);

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

    // Optimistic update
    setColumns((prev) => {
      const sourceCol = { ...prev[sourceColumnId], tasks: [...prev[sourceColumnId].tasks] };
      const targetCol = { ...prev[targetColumnId], tasks: [...prev[targetColumnId].tasks] };
      const taskIndex = sourceCol.tasks.findIndex((t) => t._id === taskId);
      if (taskIndex === -1) return prev;
      const [movedTask] = sourceCol.tasks.splice(taskIndex, 1);
      targetCol.tasks.push(movedTask);
      return { ...prev, [sourceColumnId]: sourceCol, [targetColumnId]: targetCol };
    });

    // Persist to backend
    const newStatus = COLUMN_TO_STATUS[targetColumnId];
    if (newStatus) {
      setMovingTaskId(taskId);
      try {
        await updateTodo(taskId, { status: newStatus });
      } catch (err) {
        console.error("Failed to update task status:", err);
        // Revert on failure
        setColumns(snapshot);
      } finally {
        setMovingTaskId(null);
      }
    }
  }, [columns]);

  const totalTasks = Object.values(columns).reduce((acc, col) => acc + col.tasks.length, 0);
  const completedTasks = columns.completed?.tasks.length ?? 0;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col h-full">

      {/* Meta bar: team name + New Task button + progress */}
      <div className="flex items-center justify-between mb-5 px-1 shrink-0">
        {/* Left: name + subtitle */}
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">
            {selectedTeam ? selectedTeam.name : "Select a team"}
          </h1>
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
          {selectedTeam && (
            <button
              onClick={onNewTask}
              className="flex items-center gap-1.5 bg-primary text-white px-3.5 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
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
              onDragStart={handleDragStart}
              onDrop={handleDrop}
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
    </div>
  );
}
