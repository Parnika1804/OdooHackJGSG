export default function Card({ children, className = "", padded = true }) {
  return (
    <div
      className={`rounded-lg border border-ink-100 dark:border-ink-800 bg-paper-50 dark:bg-ink-900 shadow-card ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
