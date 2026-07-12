const fieldClasses =
  "w-full rounded-md border border-ink-200 dark:border-ink-700 bg-paper-50 dark:bg-ink-950 px-3 py-2 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 focus:border-signal-300 focus:ring-2 focus:ring-signal-300/30 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

function Label({ children, htmlFor }) {
  if (!children) return null;
  return (
    <label htmlFor={htmlFor} className="block text-sm text-ink-500 dark:text-ink-300 mb-1">
      {children}
    </label>
  );
}

export function TextField({ label, id, className = "", wrapperClassName = "mb-3", ...props }) {
  return (
    <div className={wrapperClassName}>
      <Label htmlFor={id}>{label}</Label>
      <input id={id} className={`${fieldClasses} ${className}`} {...props} />
    </div>
  );
}

export function SelectField({
  label,
  id,
  children,
  className = "",
  wrapperClassName = "mb-3",
  ...props
}) {
  return (
    <div className={wrapperClassName}>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={`${fieldClasses} ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}

export function TextAreaField({
  label,
  id,
  className = "",
  wrapperClassName = "mb-3",
  ...props
}) {
  return (
    <div className={wrapperClassName}>
      <Label htmlFor={id}>{label}</Label>
      <textarea id={id} className={`${fieldClasses} ${className}`} {...props} />
    </div>
  );
}
