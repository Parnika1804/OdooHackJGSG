import { Link } from "react-router-dom";
import {
  Train,
  ArrowRight,
  LayoutDashboard,
  Truck,
  IdCard,
  Route,
  Wrench,
  Fuel,
} from "lucide-react";

// Same module set as navConfig.js, in the same order — the hero's line is
// a literal read of the sidebar's own "route" motif, just laid on its side.
const LINE_STOPS = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Fleet", icon: Truck },
  { label: "Drivers", icon: IdCard },
  { label: "Trips", icon: Route },
  { label: "Maintenance", icon: Wrench },
  { label: "Fuel & Expenses", icon: Fuel },
];

// Mirrors AuthBrandPanel's role/scope copy so the story is identical
// whether someone lands here first or goes straight to /login.
const ROLE_SCOPES = [
  { role: "Fleet Manager", scope: "Fleet, Maintenance", icon: Truck },
  { role: "Dispatcher", scope: "Dashboard, Trips", icon: Route },
  { role: "Safety Officer", scope: "Drivers, Compliance", icon: IdCard },
  { role: "Financial Analyst", scope: "Fuel & Expenses, Analytics", icon: LayoutDashboard },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper-100 dark:bg-ink-950 text-ink-900 dark:text-paper-50">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-ink-100 dark:border-ink-800 bg-paper-100/90 dark:bg-ink-950/90 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-signal-300 text-ink-950 shrink-0">
              <Train size={18} strokeWidth={2.25} />
            </div>
            <span className="font-display font-extrabold tracking-tight">TransitOps</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-ink-500 dark:text-ink-300">
            <a href="#roles" className="hover:text-ink-900 dark:hover:text-paper-50 transition-colors">
              Roles
            </a>
            <Link
              to="/signup"
              className="hover:text-ink-900 dark:hover:text-paper-50 transition-colors"
            >
              Create account
            </Link>
          </nav>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-md bg-signal-300 px-3.5 py-2 text-sm font-semibold text-ink-950 hover:bg-signal-400 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <p className="font-data text-xs font-semibold uppercase tracking-wide text-signal-500 dark:text-signal-300 mb-4">
          Dispatch console for fleet operations
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight max-w-2xl">
          Every vehicle, every driver, one line of sight.
        </h1>
        <p className="text-ink-500 dark:text-ink-300 mt-5 max-w-lg text-[15px] leading-relaxed">
          Dispatch trips, track vehicles, and close out maintenance and fuel
          logs — from one console built around how a fleet actually moves,
          not a generic admin panel bent into shape.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-md bg-signal-300 px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-signal-400 transition-colors"
          >
            Sign in
            <ArrowRight size={15} />
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-md border border-ink-200 dark:border-ink-700 px-5 py-2.5 text-sm font-semibold text-ink-700 dark:text-ink-200 hover:border-signal-300 hover:text-signal-600 dark:hover:text-signal-300 transition-colors"
          >
            Create an account
          </Link>
        </div>

        {/* Signature: the sidebar's transit line, laid flat — every module
            the product covers, presented as one continuous route rather
            than a features list. */}
        <div className="mt-20 overflow-x-auto">
          <ul className="relative flex items-start min-w-[640px] pt-2">
            {LINE_STOPS.map((stop, i) => {
              const Icon = stop.icon;
              return (
                <li key={stop.label} className="relative flex-1 flex flex-col items-start pr-2">
                  {i > 0 && (
                    <div
                      aria-hidden
                      className="absolute top-[7px] right-1/2 w-full border-t-2 border-signal-300 dark:border-signal-500/60"
                      style={{ transform: "translateX(50%)" }}
                    />
                  )}
                  <span
                    aria-hidden
                    className={`relative z-10 flex h-4 w-4 rounded-full ${
                      i === LINE_STOPS.length - 1
                        ? "bg-signal-400 shadow-glow-signal animate-pulse"
                        : "bg-signal-300"
                    }`}
                  />
                  <Icon size={16} strokeWidth={2} className="mt-3 text-ink-400 dark:text-ink-500" />
                  <span className="text-xs font-semibold mt-1.5 text-ink-700 dark:text-ink-200">
                    {stop.label}
                  </span>
                </li>
              );
            })}
            <li className="relative flex flex-col items-start">
              <div
                aria-hidden
                className="absolute top-[7px] right-1/2 w-full border-t-2 border-dashed border-ink-200 dark:border-ink-700"
                style={{ transform: "translateX(50%)" }}
              />
              <span
                aria-hidden
                className="relative z-10 flex h-4 w-4 rounded-full border-2 border-dashed border-ink-300 dark:border-ink-600"
              />
              <span className="text-xs font-medium mt-3 text-ink-400 dark:text-ink-500">
                &amp; Analytics
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-t border-ink-100 dark:border-ink-800">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <p className="font-data text-xs font-semibold uppercase tracking-wide text-ink-400 mb-3">
            One login, four roles
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold max-w-md">
            Built around whoever's actually looking at the screen.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {ROLE_SCOPES.map(({ role, scope, icon: Icon }) => (
              <div
                key={role}
                className="rounded-lg border border-ink-100 dark:border-ink-800 bg-paper-50 dark:bg-ink-900 p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-paper-100 dark:bg-ink-800 text-signal-500 dark:text-signal-300 mb-4">
                  <Icon size={17} strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-sm text-ink-900 dark:text-paper-50">{role}</h3>
                <p className="text-xs text-ink-400 mt-1">{scope}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100 dark:border-ink-800">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3">
          <p className="font-data text-xs text-ink-400">TRANSITOPS © 2026 · RBAC ENABLED</p>
          <Link
            to="/login"
            className="text-sm font-semibold text-signal-600 dark:text-signal-300 hover:text-signal-500 dark:hover:text-signal-200 transition-colors"
          >
            Sign in →
          </Link>
        </div>
      </footer>
    </div>
  );
}