import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description,
  action,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800 text-ink-400 mb-3">
        <Icon size={18} />
      </div>
      <p className="text-sm font-semibold text-ink-700 dark:text-ink-200">{title}</p>
      {description && (
        <p className="text-sm text-ink-400 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
