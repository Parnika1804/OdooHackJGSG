import { Loader2 } from "lucide-react";

const VARIANT_CLASSES = {
  primary:
    "bg-signal-300 text-ink-950 hover:bg-signal-400 disabled:hover:bg-signal-300 shadow-xs",
  secondary:
    "border border-ink-200 dark:border-ink-700 bg-paper-50 dark:bg-ink-900 text-ink-700 dark:text-ink-200 hover:border-signal-300 dark:hover:border-signal-300 hover:text-signal-600 dark:hover:text-signal-300",
  success: "bg-success-500 text-white hover:bg-success-600 disabled:hover:bg-success-500",
  danger: "bg-alert-500 text-white hover:bg-alert-600 disabled:hover:bg-alert-500",
  ghost:
    "text-ink-500 dark:text-ink-300 hover:bg-paper-100 dark:hover:bg-ink-900 hover:text-ink-800 dark:hover:text-ink-100",
};

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-md font-semibold transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === "sm" ? 14 : 16} />
      )}
      {children}
    </button>
  );
}
