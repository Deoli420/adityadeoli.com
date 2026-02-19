import clsx from "clsx";

interface SkeletonProps {
  className?: string;
}

/**
 * Animated placeholder pulse — the universal loading primitive.
 *
 * Usage:
 *   <Skeleton className="h-4 w-32" />          // text line
 *   <Skeleton className="h-10 w-full" />        // card row
 *   <Skeleton className="h-48 w-full rounded-xl" /> // chart area
 *
 * All page skeletons compose from this single component so loading
 * states are visually consistent across the app.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-surface-tertiary",
        className,
      )}
    />
  );
}

/** Preset: a row of skeleton lines simulating a text block */
export function SkeletonLines({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx("h-3.5", i === count - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

/** Preset: a skeleton card mimicking a stat card */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-1 h-7 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
