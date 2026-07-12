import { toneForStatus } from "../../statusTones";

const TONE_CLASSES = {
  success: "bg-success-500/10 text-success-600 dark:bg-success-500/15 dark:text-success-400",
  signal: "bg-signal-300/15 text-signal-600 dark:bg-signal-300/20 dark:text-signal-300",
  transit: "bg-transit-400/10 text-transit-600 dark:bg-transit-400/15 dark:text-transit-300",
  alert: "bg-alert-400/10 text-alert-600 dark:bg-alert-400/15 dark:text-alert-400",
  neutral: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
};

export function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Convenience wrapper: looks up the right tone for a known status word. */
export function StatusBadge({ status, className = "" }) {
  return (
    <Badge tone={toneForStatus(status)} className={className}>
      {status}
    </Badge>
  );
}

export default Badge;
