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

  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            {greeting}, {username || "there"} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">{getHighPrioritySubtitle(highPriorityCount)}</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 sm:text-sm">
          <CalendarDays className="h-4 w-4 text-gray-500" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </section>
  );
}
