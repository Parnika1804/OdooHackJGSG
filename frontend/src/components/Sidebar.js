import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, Train } from "lucide-react";
import { canAccess } from "../permissions";
import { navItems } from "../navConfig";

const COLLAPSE_KEY = "transitops-sidebar-collapsed";

/**
 * Sidebar nav styled as a transit line: each page is a "station" on a
 * vertical route. The line segment leading into the current page is solid
 * (the route you've taken to get here); everything past it is dashed
 * (stops not yet visited). It's a literal read of "TransitOps," not a
 * decorative flourish — the line encodes your position in the nav, same
 * job a breadcrumb does, in the app's own visual language.
 */
export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const role = localStorage.getItem("role");
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "1"
  );

  const visibleItems = navItems.filter((item) => canAccess(item.permKey, role));
  const activeIndex = visibleItems.findIndex((item) => item.path === location.pathname);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      return !c;
    });
  };

  const content = (
    <div
      className={`h-full flex flex-col bg-paper-50 dark:bg-ink-950 border-r border-ink-100 dark:border-ink-800 transition-[width] duration-200 ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-16 shrink-0 border-b border-ink-100 dark:border-ink-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-signal-300 text-ink-950 shrink-0">
          <Train size={18} strokeWidth={2.25} />
        </div>
        {!collapsed && (
          <span className="font-display font-extrabold text-ink-900 dark:text-paper-50 tracking-tight">
            TransitOps
          </span>
        )}
      </div>

      {/* Route / nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="relative">
          {visibleItems.map((item, i) => {
            const isActive = i === activeIndex;
            const traveled = activeIndex >= 0 && i <= activeIndex;
            const Icon = item.icon;
            return (
              <li key={item.path} className="relative">
                {i > 0 && (
                  <div
                    aria-hidden
                    className={`absolute left-[23px] -top-2 h-2 border-l-2 ${
                      traveled
                        ? "border-solid border-signal-400 dark:border-signal-300"
                        : "border-dashed border-ink-200 dark:border-ink-700"
                    }`}
                  />
                )}
                <NavLink
                  to={item.path}
                  onClick={onCloseMobile}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive: linkActive }) =>
                    `group relative flex items-center gap-3 rounded-md px-2.5 py-2.5 mb-0.5 text-sm transition-colors duration-150 ${
                      linkActive
                        ? "text-ink-900 dark:text-paper-50 font-semibold"
                        : "text-ink-500 dark:text-ink-300 hover:text-ink-800 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-900"
                    }`
                  }
                >
                  <span
                    aria-hidden
                    className={`relative z-10 flex h-3 w-3 shrink-0 rounded-full transition-all duration-150 ${
                      isActive
                        ? "bg-signal-400 shadow-glow-signal"
                        : traveled
                        ? "bg-signal-200 dark:bg-signal-700"
                        : "bg-paper-50 dark:bg-ink-950 border-2 border-ink-300 dark:border-ink-600 group-hover:border-signal-300"
                    }`}
                  />
                  <Icon size={17} strokeWidth={2} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle (desktop only) */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="hidden md:flex items-center gap-2 mx-2 mb-3 px-2.5 py-2 rounded-md text-xs font-medium text-ink-400 hover:text-ink-700 dark:hover:text-ink-100 hover:bg-paper-100 dark:hover:bg-ink-900 transition-colors"
      >
        {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
        {!collapsed && "Collapse"}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block shrink-0">{content}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-ink-950/50"
            onClick={onCloseMobile}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 shadow-popover">{content}</div>
        </div>
      )}
    </>
  );
}
