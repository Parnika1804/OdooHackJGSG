import { Train, Truck, Route, IdCard, BarChart3 } from "lucide-react";

const ROLE_SCOPES = [
  { role: "Fleet Manager", scope: "Fleet, Maintenance", icon: Truck },
  { role: "Dispatcher", scope: "Dashboard, Trips", icon: Route },
  { role: "Safety Officer", scope: "Drivers, Compliance", icon: IdCard },
  { role: "Financial Analyst", scope: "Fuel & Expenses, Analytics", icon: BarChart3 },
];

/**
 * Left-side brand panel shared by Login and Signup. Reuses the sidebar's
 * station-dot language (a small solid dot per role) so the very first
 * screen someone sees already speaks the app's visual dialect.
 */
export default function AuthBrandPanel() {
  return (
    <div className="hidden md:flex flex-1 bg-ink-950 text-paper-50 p-10 flex-col justify-between relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-signal-300 text-ink-950 mb-4">
          <Train size={20} strokeWidth={2.25} />
        </div>
        <h2 className="font-display text-xl font-bold">TransitOps</h2>
        <p className="text-sm text-ink-300 mt-1">Smart Transport Operations Platform</p>
      </div>

      <div className="relative z-10">
        <h4 className="font-semibold text-sm text-ink-300 uppercase tracking-wide mb-4">
          One login, four roles
        </h4>
        <ul className="space-y-3.5">
          {ROLE_SCOPES.map(({ role, scope, icon: Icon }) => (
            <li key={role} className="flex items-center gap-3">
              <span className="flex h-3 w-3 shrink-0 rounded-full bg-signal-300/70" aria-hidden />
              <Icon size={15} className="text-ink-300 shrink-0" />
              <span>
                <span className="text-sm font-medium text-paper-50">{role}</span>
                <span className="text-xs text-ink-400"> — {scope}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-xs text-ink-500 font-data">
        TRANSITOPS © 2026 · RBAC ENABLED
      </p>

      {/* Ambient signature: a faint dashed route line running down the panel,
          echoing the sidebar's transit-line motif at low contrast. */}
      <div
        aria-hidden
        className="absolute right-10 top-0 bottom-0 w-px border-l-2 border-dashed border-ink-700"
      />
    </div>
  );
}
