import { useId } from "react";
import { AlertCircle } from "lucide-react";

const baseFieldClasses =
  "w-full rounded-md border bg-paper-50 dark:bg-ink-950 px-3 py-2 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

// Valid fields get the normal focus ring; invalid ones stay flagged red even
// on focus so the error doesn't silently disappear the moment you click back in.
const stateClasses = (hasError) =>
  hasError
    ? "border-alert-400 focus:border-alert-400 focus:ring-2 focus:ring-alert-400/25"
    : "border-ink-200 dark:border-ink-700 focus:border-signal-300 focus:ring-2 focus:ring-signal-300/30";

function Label({ children, htmlFor, required }) {
  if (!children) return null;
  return (
    <label htmlFor={htmlFor} className="block text-sm text-ink-500 dark:text-ink-300 mb-1">
      {children}
      {required && <span className="text-alert-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ id, error }) {
  if (!error) return null;
  return (
    <p
      id={id}
      role="alert"
      className="flex items-center gap-1 text-xs text-alert-600 dark:text-alert-400 mt-1"
    >
      <AlertCircle size={12} className="shrink-0" />
      {error}
    </p>
  );
}

export function TextField({
  label,
  id,
  error,
  required,
  className = "",
  wrapperClassName = "mb-3",
  ...props
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className={wrapperClassName}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      <input
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={`${baseFieldClasses} ${stateClasses(!!error)} ${className}`}
        {...props}
      />
      <FieldError id={errorId} error={error} />
    </div>
  );
}

export function SelectField({
  label,
  id,
  error,
  required,
  children,
  className = "",
  wrapperClassName = "mb-3",
  ...props
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className={wrapperClassName}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      <select
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={`${baseFieldClasses} ${stateClasses(!!error)} ${className}`}
        {...props}
      >
        {children}
      </select>
      <FieldError id={errorId} error={error} />
    </div>
  );
}

export function TextAreaField({
  label,
  id,
  error,
  required,
  className = "",
  wrapperClassName = "mb-3",
  ...props
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className={wrapperClassName}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      <textarea
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={`${baseFieldClasses} ${stateClasses(!!error)} ${className}`}
        {...props}
      />
      <FieldError id={errorId} error={error} />
    </div>
  );
}