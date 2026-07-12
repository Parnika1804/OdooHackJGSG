import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { TableSkeletonRows } from "./Skeleton";
import EmptyState from "./EmptyState";

/**
 * columns: [{ key, label, sortable, numeric, render(row), align }]
 * rows: array of data objects
 * sortConfig: { key, direction: "asc" | "desc" }
 * onSort(key): called when a sortable header is clicked
 */
export default function Table({
  columns,
  rows,
  rowKey = (row) => row.id,
  sortConfig,
  onSort,
  loading = false,
  emptyTitle = "No records match your filters",
  emptyDescription,
}) {
  const renderSortIcon = (col) => {
    if (!col.sortable) return null;
    if (sortConfig?.key !== col.key) {
      return <ChevronsUpDown size={13} className="text-ink-300 dark:text-ink-600" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={13} className="text-signal-500" />
    ) : (
      <ChevronDown size={13} className="text-signal-500" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-ink-100 dark:border-ink-800">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left bg-paper-100 dark:bg-ink-900 text-ink-500 dark:text-ink-400 border-b border-ink-100 dark:border-ink-800">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => col.sortable && onSort?.(col.key)}
                className={`py-2.5 px-4 font-semibold text-xs uppercase tracking-wide whitespace-nowrap ${
                  col.sortable ? "cursor-pointer select-none hover:text-ink-800 dark:hover:text-ink-100" : ""
                } ${col.align === "right" ? "text-right" : ""}`}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {renderSortIcon(col)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows columnCount={columns.length} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-ink-50 dark:border-ink-800/60 last:border-0 hover:bg-paper-100/60 dark:hover:bg-ink-800/40 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-2.5 px-4 text-ink-700 dark:text-ink-200 ${
                      col.numeric ? "font-data" : ""
                    } ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
