export default function SettingsLoading() {
  const Skeleton = ({ className }: { className: string }) => (
    <div className={`bg-muted animate-pulse rounded-lg ${className}`} />
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-2 border-b pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-lg" />
        ))}
      </div>

      {/* Form Card */}
      <div className="rounded-xl border bg-card p-6 space-y-6">
        <Skeleton className="h-6 w-44" />

        {/* 2-column form fields */}
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>

        {/* Textarea field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>

        {/* Dropdown field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>

        {/* Save Button */}
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
