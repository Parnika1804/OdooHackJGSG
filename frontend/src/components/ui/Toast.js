import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const VARIANTS = {
  success: { classes: "border-success-500/30 text-success-600 dark:text-success-400", Icon: CheckCircle2 },
  error: { classes: "border-alert-400/40 text-alert-600 dark:text-alert-400", Icon: AlertCircle },
  info: { classes: "border-transit-400/30 text-transit-600 dark:text-transit-300", Icon: Info },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, variant = "success", duration = 3500) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, variant }]);
      if (duration) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => {
          const { classes, Icon } = VARIANTS[toast.variant] || VARIANTS.success;
          return (
            <div
              key={toast.id}
              role="status"
              className={`flex items-start gap-2 rounded-md border bg-paper-50 dark:bg-ink-900 shadow-popover px-3 py-2.5 text-sm ${classes}`}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <span className="flex-1 text-ink-800 dark:text-ink-100">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-100"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
