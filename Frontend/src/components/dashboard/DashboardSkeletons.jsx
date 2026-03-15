import { Skeleton } from "../ui/skeleton";

function KanbanTaskCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-5/6" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}

function KanbanColumnSkeleton({ titleWidth, cards = 3 }) {
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <Skeleton className="h-2.5 w-2.5 rounded-full" />
        <Skeleton className={`h-4 ${titleWidth}`} />
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>

      <div className="flex min-h-[120px] flex-1 flex-col gap-2.5 rounded-xl border-2 border-transparent bg-gray-50/60 p-2">
        {Array.from({ length: cards }).map((_, index) => (
          <KanbanTaskCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function TeamTasksHeaderSkeleton() {
  return (
    <div className="mb-5 flex shrink-0 items-center justify-between px-1">
      <div className="min-w-0">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <Skeleton className="h-1.5 w-28 rounded-full" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}

function MyTasksSectionSkeleton({ rows = 3 }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, index) => (
          <article
            key={index}
            className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-12 md:gap-4"
          >
            <div className="min-w-0 md:col-span-4">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="mt-2 h-4 w-11/12" />
            </div>

            <div className="min-w-0 md:col-span-6">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>

            <div className="md:col-span-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="mt-2 h-6 w-20 rounded-full" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TeamListSkeleton({ items = 4 }) {
  return (
    <div className="mt-1 space-y-0.5">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-2.5 rounded-md px-3 py-1.5 pl-7">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-full max-w-[7.5rem]" />
        </div>
      ))}
    </div>
  );
}

export function KanbanBoardSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <TeamTasksHeaderSkeleton />
      <div className="flex flex-1 items-start gap-5 overflow-x-auto pb-6">
        <KanbanColumnSkeleton titleWidth="w-16" />
        <KanbanColumnSkeleton titleWidth="w-24" />
        <KanbanColumnSkeleton titleWidth="w-20" cards={2} />
        <KanbanColumnSkeleton titleWidth="w-24" cards={2} />
      </div>
    </div>
  );
}

export function MyTasksByTeamSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-y-auto pr-1">
      <div className="mb-5">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-2 h-3 w-56" />
      </div>

      <div className="space-y-5 pb-6">
        <MyTasksSectionSkeleton rows={3} />
        <MyTasksSectionSkeleton rows={2} />
      </div>
    </div>
  );
}