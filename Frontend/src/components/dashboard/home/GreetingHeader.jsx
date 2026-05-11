import { CalendarDays } from "lucide-react";

function getGreetingByHour(hour) {
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function getHighPrioritySubtitle(count) {
  if (count === 0) {
    return "Great progress. No high priority tasks are pending right now.";
  }

  return `You have ${count} high priority task${count > 1 ? "s" : ""} pending today.`;
}

export default function GreetingHeader({ username, highPriorityCount = 0 }) {
  const now = new Date();
  const greeting = getGreetingByHour(now.getHours());
  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const statusLabel = highPriorityCount > 0 ? "Needs attention" : "On track";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-500 px-6 py-7 text-white shadow-[0_20px_60px_-24px_rgba(16,185,129,0.55)] sm:px-8 sm:py-8">
      <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch">
        <div className="flex flex-col justify-between">
          <div>
            
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {greeting}, {username || "there"} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">
              {getHighPrioritySubtitle(highPriorityCount)}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-emerald-50/90">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
              Focus on today’s highest impact work
            </span>
            
          </div>
        </div>

        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-50/80">Status</p>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold text-white">{statusLabel}</p>
                <p className="mt-2 text-sm leading-6 text-emerald-50/85">
                  {highPriorityCount > 0
                    ? `${highPriorityCount} high priority task${highPriorityCount > 1 ? "s" : ""} need your attention today.`
                    : "No urgent items right now. Keep the momentum going."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/15 p-3">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/15 pt-4">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-50/75">Today</p>
            <p className="mt-2 text-sm font-medium text-white">{formattedDate}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
