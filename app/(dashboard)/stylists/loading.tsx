export default function StylistsLoading() {
  const Skeleton = ({ className }: { className: string }) => (
    <div className={`bg-muted animate-pulse rounded-lg ${className}`} />
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* 3 Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="rounded-xl border bg-card p-4">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* 4 Stylist Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-4 pt-4 border-t">
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Skeleton className="h-9 flex-1 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
