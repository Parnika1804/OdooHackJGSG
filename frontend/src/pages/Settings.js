import { useState } from "react";
import ThemeToggle from "../theme/ThemeToggle";

const initialPermissions = [
  { role: "Fleet Manager", fleet: "✓", drivers: "✓", trips: "—", fuelExp: "—", analytics: "—" },
  { role: "Dispatcher", fleet: "View", drivers: "—", trips: "✓", fuelExp: "—", analytics: "—" },
  { role: "Safety Officer", fleet: "—", drivers: "✓", trips: "View", fuelExp: "—", analytics: "—" },
  { role: "Financial Analyst", fleet: "—", drivers: "—", trips: "—", fuelExp: "✓", analytics: "View" },
];

export default function Settings() {
  const [depotName, setDepotName] = useState("Gandhinagar Depot 624");
  const [currency, setCurrency] = useState("INR (₹)");
  const [distanceUnit, setDistanceUnit] = useState("Kilometers");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    // TODO: connect to PUT /settings once backend exists (skipped for now — not a mandatory requirement)
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 bg-white dark:bg-neutral-950 min-h-screen text-gray-900 dark:text-neutral-100">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold">Settings</h1>
        <input
          type="text"
          placeholder="Search..."
          className="border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-1.5 text-sm w-64"
        />
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* General settings */}
        <div>
          <h2 className="font-semibold text-sm text-gray-500 dark:text-neutral-400 uppercase mb-3">
            General
          </h2>

          <form onSubmit={handleSave}>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">
              Depot Name
            </label>
            <input
              type="text"
              value={depotName}
              onChange={(e) => setDepotName(e.target.value)}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-4"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-4"
            >
              <option>INR (₹)</option>
              <option>USD ($)</option>
              <option>EUR (€)</option>
            </select>

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">
              Distance Unit
            </label>
            <select
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value)}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-4"
            >
              <option>Kilometers</option>
              <option>Miles</option>
            </select>

            <button
              type="submit"
              className="bg-accent text-black font-semibold rounded px-5 py-2 text-sm hover:opacity-90"
            >
              Save changes
            </button>

            {saved && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                Settings saved.
              </p>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-neutral-800">
            <h2 className="font-semibold text-sm text-gray-500 dark:text-neutral-400 uppercase mb-3">
              Appearance
            </h2>
            <ThemeToggle />
          </div>
        </div>

        {/* Role-permission matrix */}
        <div>
          <h2 className="font-semibold text-sm text-gray-500 dark:text-neutral-400 uppercase mb-3">
            Role-Based Access (RBAC)
          </h2>

          <table className="w-full text-sm border border-gray-200 dark:border-neutral-800 rounded overflow-hidden">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-900 text-left">
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Fleet</th>
                <th className="px-3 py-2">Drivers</th>
                <th className="px-3 py-2">Trips</th>
                <th className="px-3 py-2">Fuel/Exp</th>
                <th className="px-3 py-2">Analytics</th>
              </tr>
            </thead>
            <tbody>
              {initialPermissions.map((row) => (
                <tr key={row.role} className="border-t border-gray-200 dark:border-neutral-800">
                  <td className="px-3 py-2 font-medium">{row.role}</td>
                  <td className="px-3 py-2">{row.fleet}</td>
                  <td className="px-3 py-2">{row.drivers}</td>
                  <td className="px-3 py-2">{row.trips}</td>
                  <td className="px-3 py-2">{row.fuelExp}</td>
                  <td className="px-3 py-2">{row.analytics}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs text-gray-400 dark:text-neutral-600 mt-2">
            ✓ = full access · View = read-only · — = no access
          </p>
        </div>
      </div>
    </div>
  );
}