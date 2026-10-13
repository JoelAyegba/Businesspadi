import { Skeleton } from "@/components/ui/skeleton";

/**
 * Settings page loading skeleton.
 * Matches the redesigned layout with stacked cards.
 */
export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
