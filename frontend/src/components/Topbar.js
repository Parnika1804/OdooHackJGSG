import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Search, Bell, ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import { labelForPath } from "../navConfig";
import { getSession, clearSession, initials } from "../utils/auth";
import { useTheme } from "../theme/ThemeContext";

export default function Topbar({ onOpenMobileNav }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { name, role } = getSession();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pageLabel = labelForPath(location.pathname) || "TransitOps";

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-ink-100 dark:border-ink-800 bg-paper-50/95 dark:bg-ink-950/95 backdrop-blur px-4 md:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="md:hidden -ml-1 p-2 rounded-md text-ink-500 hover:bg-paper-100 dark:hover:bg-ink-900"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb / page title */}
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500">
          TransitOps
        </div>
        <h1 className="text-base font-bold text-ink-900 dark:text-paper-50 leading-tight truncate">
          {pageLabel}
        </h1>
      </div>

      {/* Search */}
      <div className="hidden sm:flex flex-1 max-w-sm ml-4">
        <div className="relative w-full">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="text"
            placeholder="Search vehicles, trips, drivers..."
            className="w-full rounded-md border border-ink-100 dark:border-ink-700 bg-paper-100 dark:bg-ink-900 pl-9 pr-3 py-2 text-sm text-ink-800 dark:text-ink-100 placeholder:text-ink-400 focus:bg-paper-50 dark:focus:bg-ink-950 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 sm:flex-none" />

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="p-2 rounded-md text-ink-500 hover:text-signal-500 dark:hover:text-signal-300 hover:bg-paper-100 dark:hover:bg-ink-900 transition-colors"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Notifications (static placeholder — wired up in a later phase) */}
      <button
        type="button"
        aria-label="Notifications"
        className="relative p-2 rounded-md text-ink-500 hover:text-ink-800 dark:hover:text-ink-100 hover:bg-paper-100 dark:hover:bg-ink-900 transition-colors"
      >
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-transit-400" />
      </button>

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md pl-1.5 pr-2 py-1.5 hover:bg-paper-100 dark:hover:bg-ink-900 transition-colors"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-800 dark:bg-ink-100 text-paper-50 dark:text-ink-900 text-xs font-semibold font-data">
            {initials(name)}
          </span>
          <span className="hidden md:block text-left leading-tight">
            <span className="block text-sm font-semibold text-ink-800 dark:text-ink-100">
              {name || "User"}
            </span>
            <span className="block text-[11px] text-ink-400">{role}</span>
          </span>
          <ChevronDown size={15} className="hidden md:block text-ink-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md border border-ink-100 dark:border-ink-700 bg-paper-50 dark:bg-ink-900 shadow-popover py-1">
            <div className="px-3 py-2 border-b border-ink-100 dark:border-ink-800 md:hidden">
              <div className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                {name || "User"}
              </div>
              <div className="text-xs text-ink-400">{role}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-alert-500 hover:bg-alert-50 dark:hover:bg-ink-800"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
