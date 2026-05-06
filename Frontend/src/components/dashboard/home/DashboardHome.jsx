import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardList, TriangleAlert, UsersRound } from "lucide-react";
import GreetingHeader from "./GreetingHeader";
import StatsCard from "./StatsCard";
import TaskCard from "./TaskCard";
import { getAssignedTodos, getPriorityTodos } from "../../../apis/todo.api";

function isOverdue(task) {
  if (!task?.dueDate || task?.status === "completed") {
    return false;
  }

  const due = new Date(task.dueDate);
  const today = new Date();

  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return due < today;
}

function sortByPriorityAndDate(tasks = []) {
  const priorityOrder = { high: 0, medium: 1, low: 2 };

  return [...tasks].sort((a, b) => {
    const pA = priorityOrder[a.priority] ?? 1;
    const pB = priorityOrder[b.priority] ?? 1;

    if (pA !== pB) {
      return pA - pB;
    }

    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    return new Date(a.dueDate) - new Date(b.dueDate);
  });
}

export default function DashboardHome({ currentUser, activeTeams = 0 }) {
  const [tasks, setTasks] = useState([]);
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        const [assignedRes, priorityRes] = await Promise.all([
          getAssignedTodos(),
          getPriorityTodos(),
        ]);

        if (!isMounted) {
          return;
        }

        const assignedData = assignedRes?.data?.data;
        const priorityData = priorityRes?.data?.data;

        const safeAssigned = Array.isArray(assignedData) ? assignedData : [];
        const safePriority = Array.isArray(priorityData) ? priorityData : [];

        setTasks(safeAssigned);
        setPriorityTasks(sortByPriorityAndDate(safePriority));
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError?.response?.data?.message || "Failed to load dashboard insights.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const assignedTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === "completed").length;
    const overdueTasks = tasks.filter((task) => isOverdue(task)).length;
    const highPriorityPending = tasks.filter(
      (task) => task.priority === "high" && task.status !== "completed"
    ).length;

    return {
      assignedTasks,
      completedTasks,
      overdueTasks,
      highPriorityPending,
    };
  }, [tasks]);

  const topPriorityTasks = useMemo(() => {
    const filtered = priorityTasks.filter((task) => task.status !== "completed");
    return filtered.slice(0, 6);
  }, [priorityTasks]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="inline-flex items-center gap-2 font-medium">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GreetingHeader
        username={currentUser?.username}
        highPriorityCount={stats.highPriorityPending}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Assigned Tasks"
          value={stats.assignedTasks}
          description="Total tasks currently assigned to you"
          icon={ClipboardList}
          tone="default"
        />
        <StatsCard
          title="Completed Tasks"
          value={stats.completedTasks}
          description="Tasks completed across your teams"
          icon={CheckCircle2}
          tone="success"
        />
        <StatsCard
          title="Overdue Tasks"
          value={stats.overdueTasks}
          description="Require immediate follow-up"
          icon={TriangleAlert}
          tone="danger"
        />
        <StatsCard
          title="Active Teams"
          value={activeTeams}
          description="Teams where you collaborate"
          icon={UsersRound}
          tone="neutral"
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">Priority Tasks</h2>
          <p className="text-sm text-gray-500">Focus on the most important work first.</p>
        </div>

        {topPriorityTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-12 text-center">
            <CheckCircle2 className="h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-600">No priority tasks pending</p>
            <p className="mt-1 text-xs text-gray-500">You are all caught up for now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topPriorityTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
