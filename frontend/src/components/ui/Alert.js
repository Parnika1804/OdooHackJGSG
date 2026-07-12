import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const VARIANTS = {
  error: {
    classes: "bg-alert-50 dark:bg-ink-900 border-alert-400/40 text-alert-600 dark:text-alert-400",
    Icon: AlertCircle,
  },
  success: {
    classes:
      "bg-success-500/5 dark:bg-ink-900 border-success-500/30 text-success-600 dark:text-success-400",
    Icon: CheckCircle2,
  },
  info: {
    classes: "bg-transit-400/5 dark:bg-ink-900 border-transit-400/30 text-transit-600 dark:text-transit-300",
    Icon: Info,
  },
};

export default function Alert({ variant = "error", children, className = "" }) {
  if (!children) return null;
  const { classes, Icon } = VARIANTS[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm mb-3 ${classes} ${className}`}
    >
      <Icon size={15} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
