import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";

/**
 * Compact icon toggle. Sits in Settings for now (Phase 1) — Phase 2 moves
 * it into the persistent Topbar alongside search and the user menu.
 */
export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={`inline-flex items-center gap-2 rounded-md border border-ink-100 dark:border-ink-700 bg-paper-50 dark:bg-ink-900 px-3 py-2 text-sm font-medium text-ink-700 dark:text-ink-200 hover:border-signal-300 hover:text-signal-500 dark:hover:text-signal-300 transition-colors duration-150 ${className}`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
