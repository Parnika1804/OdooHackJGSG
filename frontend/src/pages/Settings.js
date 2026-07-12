import { useState } from "react";
import { Search, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { TextField, SelectField } from "../components/ui/FormField";

const initialPermissions = [
  { role: "Fleet Manager", fleet: "full", drivers: "full", trips: "none", fuelExp: "none", analytics: "none" },
  { role: "Dispatcher", fleet: "view", drivers: "none", trips: "full", fuelExp: "none", analytics: "none" },
  { role: "Safety Officer", fleet: "none", drivers: "full", trips: "view", fuelExp: "none", analytics: "none" },
  { role: "Financial Analyst", fleet: "none", drivers: "none", trips: "none", fuelExp: "full", analytics: "view" },
];

const PERMISSION_META = {
  full: { label: "Full", tone: "success" },
  view: { label: "View", tone: "signal" },
  none: { label: "—", tone: "neutral" },
};

function PermissionBadge({ level }) {
  const meta = PERMISSION_META[level];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export default function Settings() {
  const [depotName, setDepotName] = useState("Gandhinagar Depot 624");
  const [currency, setCurrency] = useState("INR (₹)");
  const [distanceUnit, setDistanceUnit] = useState("Kilometers");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleSave = (e) => {
    e.preventDefault();
    // TODO: connect to PUT /settings once backend exists (skipped for now — not a mandatory requirement)
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast("Settings saved");
    }, 400);
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="font-display text-xl font-bold text-ink-900 dark:text-paper-50">Settings</h1>
        <div className="relative w-64 max-w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search settings..."
            className="w-full rounded-md border border-ink-200 dark:border-ink-700 bg-paper-50 dark:bg-ink-950 pl-9 pr-3 py-2 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 focus:border-signal-300 focus:ring-2 focus:ring-signal-300/30 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* General settings */}
        <Card>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-4">
            <SlidersHorizontal size={15} />
            General
          </h2>

          <form onSubmit={handleSave}>
            <TextField
              label="Depot Name"
              value={depotName}
              onChange={(e) => setDepotName(e.target.value)}
            />

            <SelectField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option>INR (₹)</option>
              <option>USD ($)</option>
              <option>EUR (€)</option>
            </SelectField>

            <SelectField
              label="Distance Unit"
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value)}
              wrapperClassName="mb-4"
            >
              <option>Kilometers</option>
              <option>Miles</option>
            </SelectField>

            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </form>
        </Card>

        {/* Role-permission matrix */}
        <Card padded={false}>
          <div className="px-5 pt-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-4">
              <ShieldCheck size={15} />
              Role-Based Access (RBAC)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left bg-paper-100 dark:bg-ink-900 text-ink-500 dark:text-ink-400 border-y border-ink-100 dark:border-ink-800">
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Role</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Fleet</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Drivers</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Trips</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Fuel/Exp</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Analytics</th>
                </tr>
              </thead>
              <tbody>
                {initialPermissions.map((row) => (
                  <tr
                    key={row.role}
                    className="border-b border-ink-50 dark:border-ink-800/60 last:border-0 hover:bg-paper-100/60 dark:hover:bg-ink-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-medium text-ink-800 dark:text-ink-100">{row.role}</td>
                    <td className="py-2.5 px-4"><PermissionBadge level={row.fleet} /></td>
                    <td className="py-2.5 px-4"><PermissionBadge level={row.drivers} /></td>
                    <td className="py-2.5 px-4"><PermissionBadge level={row.trips} /></td>
                    <td className="py-2.5 px-4"><PermissionBadge level={row.fuelExp} /></td>
                    <td className="py-2.5 px-4"><PermissionBadge level={row.analytics} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-ink-400 px-5 py-3">
            Full = full access · View = read-only · — = no access
          </p>
        </Card>
      </div>
    </div>
  );
}