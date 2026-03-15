import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckSquare, Users } from "lucide-react";
import { getAssignedTodos } from "../../apis/todo.api";
import { MyTasksByTeamSkeleton } from "./DashboardSkeletons";

function normalizeStatus(status = "") {
  return status
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function groupTasksByTeam(tasks = []) {
  return tasks.reduce((acc, task) => {
    const teamId = task.team?._id || "unassigned-team";
    const teamName = task.team?.name || "Unknown Team";

    if (!acc[teamId]) {
      acc[teamId] = {
        teamId,
        teamName,
        teamDescription: task.team?.description || "",
        tasks: [],
      };
    }

    acc[teamId].tasks.push(task);
    return acc;
  }, {});
}

export default function MyTasksByTeam() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchAssignedTasks = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getAssignedTodos();
        const assignedTasks = response?.data?.data || [];
        if (isMounted) {
          setTasks(Array.isArray(assignedTasks) ? assignedTasks : []);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError?.response?.data?.message || "Failed to load your tasks. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAssignedTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedTeams = useMemo(() => {
    const grouped = groupTasksByTeam(tasks);
    return Object.values(grouped).sort((a, b) => a.teamName.localeCompare(b.teamName));
  }, [tasks]);

  const totalTasks = tasks.length;

  if (loading) {
    return <MyTasksByTeamSkeleton />;
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (groupedTeams.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-2">
        <CheckSquare className="h-8 w-8 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">No tasks assigned yet</p>
        <p className="text-xs text-gray-400">Tasks assigned to you will appear here grouped by team.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900">My Tasks</h1>
        <p className="text-xs text-gray-400 mt-0.5">{totalTasks} assigned tasks across {groupedTeams.length} team{groupedTeams.length > 1 ? "s" : ""}</p>
      </div>

      <div className="space-y-5 pb-6">
        {groupedTeams.map((teamGroup) => (
          <section key={teamGroup.teamId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{teamGroup.teamName}</span>
                  </h2>
                  {teamGroup.teamDescription && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{teamGroup.teamDescription}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 shrink-0">{teamGroup.tasks.length} task{teamGroup.tasks.length > 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {teamGroup.tasks.map((task) => (
                <article key={task._id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4">
                  <div className="md:col-span-4 min-w-0">
                    <p className="text-xs text-gray-400">Task</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
                  </div>

                  <div className="md:col-span-6 min-w-0">
                    <p className="text-xs text-gray-400">Description</p>
                    <p className="text-sm text-gray-600 truncate">{task.description || "—"}</p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-400">Status</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mt-0.5">
                      {normalizeStatus(task.status)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
