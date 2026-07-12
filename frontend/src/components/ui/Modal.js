import { useEffect } from "react";
import { X } from "lucide-react";

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${SIZE_CLASSES[size]} rounded-lg bg-paper-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-800 shadow-popover`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 dark:border-ink-800">
          <h2 className="font-display font-bold text-ink-900 dark:text-paper-50">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md text-ink-400 hover:text-ink-700 dark:hover:text-ink-100 hover:bg-paper-100 dark:hover:bg-ink-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-ink-100 dark:border-ink-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
