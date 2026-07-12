import { useEffect, useRef } from "react";
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
  const dialogRef = useRef(null);
  const openerRef = useRef(null);

  // Escape closes; Tab is trapped inside the dialog while it's open.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Move focus into the dialog on open; restore it to whatever triggered
  // the modal (e.g. an "Add" button) once it closes.
  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement;
      const focusable = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      (focusable?.[0] || dialogRef.current)?.focus();
    } else {
      openerRef.current?.focus?.();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full ${SIZE_CLASSES[size]} rounded-lg bg-paper-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-800 shadow-popover animate-scale-in`}
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