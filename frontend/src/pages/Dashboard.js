import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

const statusStyles = {
  Draft: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  Dispatched: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const vehicleStatusBarColors = {
  Available: "bg-green-500",
  "On Trip": "bg-blue-500",
  "In Shop": "bg-amber-500",
  Retired: "bg-red-500",
};

const VEHICLE_STATUSES = ["Available", "On Trip", "In Shop", "Retired"];

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [allVehicles, setAllVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  // Vehicles fetched once (unfiltered) — used to populate the Type/Region
  // dropdown options and to compute the vehicle status bar under the same
  // filters as the KPI cards, since the KPI endpoint doesn't return a full
  // per-status breakdown.
  const fetchVehicles = async () => {
    try {
      const res = await axios.get(`${API_URL}/vehicles`, authHeaders());
      setAllVehicles(res.data.vehicles);
    } catch (err) {
      // Non-fatal — filters/status bar just won't populate.
    }
  };

  const fetchKpis = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = {};
      if (typeFilter !== "All") params.vehicle_type = typeFilter;
      if (statusFilter !== "All") params.status = statusFilter;
      if (regionFilter !== "All") params.region = regionFilter;

      const res = await axios.get(`${API_URL}/dashboard/kpis`, {
        ...authHeaders(),
        params,
      });
      setKpis(res.data);
    } catch (err) {
      setLoadError(err.response?.data?.detail || "Failed to load dashboard KPIs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchKpis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, regionFilter]);

  const vehicleTypes = [...new Set(allVehicles.map((v) => v.type))].filter(Boolean);
  const regions = [...new Set(allVehicles.map((v) => v.region))].filter(Boolean);

  const filteredVehicles = allVehicles.filter((v) => {
    const matchesType = typeFilter === "All" || v.type === typeFilter;
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    const matchesRegion = regionFilter === "All" || v.region === regionFilter;
    return matchesType && matchesStatus && matchesRegion;
  });

  const statusCounts = VEHICLE_STATUSES.map((s) => ({
    status: s,
    count: filteredVehicles.filter((v) => v.status === s).length,
  }));
  const totalForBar = filteredVehicles.length || 1;

  const kpiCards = kpis
    ? [
        { label: "Active Vehicles", value: kpis.active_vehicles },
        { label: "Available Vehicles", value: kpis.available_vehicles },
        { label: "Vehicles in Maintenance", value: kpis.in_maintenance_vehicles },
        { label: "Active Trips", value: kpis.active_trips },
        { label: "Pending Trips", value: kpis.pending_trips },
        { label: "Drivers on Duty", value: kpis.drivers_on_duty },
        { label: "Fleet Utilization", value: `${kpis.fleet_utilization_percent}%`, highlight: true },
      ]
    : [];

  return (
    <div className="p-6 bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 min-h-screen">
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-1.5 text-sm"
        >
          <option>All</option>
          {vehicleTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-1.5 text-sm"
        >
          <option>All</option>
          {VEHICLE_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-1.5 text-sm"
        >
          <option>All</option>
          {regions.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      {loadError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-4">
          {loadError}
        </div>
      )}

      {loading && <p className="text-sm text-gray-400">Loading dashboard...</p>}

      {!loading && kpis && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className={`border rounded-lg p-3 ${
                  card.highlight
                    ? "border-accent bg-accent/10"
                    : "border-gray-200 dark:border-neutral-800"
                }`}
              >
                <div className="text-xs text-gray-500 dark:text-neutral-400 mb-1">{card.label}</div>
                <div className="text-2xl font-bold">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent trips */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 mb-3">
                RECENT TRIPS
              </h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-400">
                    <th className="py-2 pr-4">Trip</th>
                    <th className="py-2 pr-4">Vehicle</th>
                    <th className="py-2 pr-4">Driver</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.recent_trips.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100 dark:border-neutral-900">
                      <td className="py-2 pr-4">TR{String(t.id).padStart(3, "0")}</td>
                      <td className="py-2 pr-4">{t.vehicle_name || "--"}</td>
                      <td className="py-2 pr-4">{t.driver_name || "--"}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[t.status]}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {kpis.recent_trips.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400 dark:text-neutral-600">
                        No trips yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Vehicle status bar */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 mb-3">
                VEHICLE STATUS
              </h2>
              <div className="space-y-3">
                {statusCounts.map(({ status, count }) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs w-20 text-gray-500 dark:text-neutral-400">{status}</span>
                    <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-900 rounded overflow-hidden">
                      <div
                        className={`h-full ${vehicleStatusBarColors[status]}`}
                        style={{ width: `${(count / totalForBar) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}