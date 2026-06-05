import { useState } from "react";
import { Plus, MoreHorizontal, ClipboardList } from "lucide-react";
import TaskCard from "./TaskCard";

export default function KanbanColumn({ column, onDragStart, onDrop, movingTaskId, canMoveTask, team, currentUser, onTaskUpdated, onTaskDeleted }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only trigger if leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    setIsDragOver(false);
    onDrop(e, column.id);
  };

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
          <h3 className="text-sm font-semibold text-gray-700">{column.title}</h3>
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 flex flex-col gap-2.5 min-h-[120px] rounded-xl p-2 transition-colors ${
          isDragOver
            ? "bg-primary/5 border-2 border-dashed border-primary/30"
            : "bg-gray-50/60 border-2 border-transparent"
        }`}
      >
        {column.tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onDragStart={onDragStart}
            canDrag={canMoveTask ? canMoveTask(task) : false}
            isSaving={movingTaskId === task._id}
            team={team}
            currentUser={currentUser}
            onTaskUpdated={onTaskUpdated}
            onTaskDeleted={onTaskDeleted}
          />
        ))}

        {column.tasks.length === 0 && !isDragOver && (
          <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2 select-none">
            <ClipboardList className="h-7 w-7 text-gray-200" strokeWidth={1.5} />
            <p className="text-xs text-gray-300 font-medium">No tasks yet</p>
          </div>
        )}

        {column.tasks.length === 0 && isDragOver && (
          <div className="flex-1 flex items-center justify-center py-10">
            <p className="text-xs text-primary/60 font-medium">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}
