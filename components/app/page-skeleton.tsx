export function PageSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-6">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="h-3 w-24 rounded bg-rd-gray-200" />
        <div className="mt-3 h-7 w-56 rounded bg-rd-gray-200" />
        <div className="mt-2 h-4 w-72 rounded bg-rd-gray-100" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-2xl border border-border bg-card/60" />
        <div className="h-56 rounded-2xl border border-border bg-card/60" />
      </div>
      <div className="h-72 rounded-2xl border border-border bg-card/60" />
    </div>
  );
}
