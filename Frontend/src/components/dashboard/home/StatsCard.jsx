export default function StatsCard({ title, value, description, icon: Icon, tone = "default" }) {
  const toneClasses = {
    default: "text-primary bg-primary/10",
    success: "text-emerald-600 bg-emerald-100",
    danger: "text-red-600 bg-red-100",
    neutral: "text-gray-700 bg-gray-100",
  };

  const iconTone = toneClasses[tone] || toneClasses.default;

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${iconTone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}
