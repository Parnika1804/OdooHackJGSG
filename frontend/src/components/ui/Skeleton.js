export default function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded bg-ink-100 dark:bg-ink-800 ${className}`}
      aria-hidden
    />
  );
}

/** Skeleton rows sized to slot into a Table's <tbody> while data loads. */
export function TableSkeletonRows({ columnCount, rowCount = 5 }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, r) => (
        <tr key={r} className="border-b border-ink-100 dark:border-ink-800">
          {Array.from({ length: columnCount }).map((__, c) => (
            <td key={c} className="py-3 pr-4">
              <Skeleton className="h-3.5 w-full max-w-[10rem]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
