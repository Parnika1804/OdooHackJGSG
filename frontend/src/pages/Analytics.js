import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

const COSTLIEST_COLORS = [
  "bg-red-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-blue-400",
  "bg-neutral-400",
];

function formatMonthLabel(month) {
  // month comes back as "YYYY-MM"
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleString("en-US", { month: "short" });
}

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [topCostliest, setTopCostliest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchAll = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [summaryRes, revenueRes, costliestRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/summary`, authHeaders()),
        axios.get(`${API_URL}/analytics/monthly-revenue`, authHeaders()),
        axios.get(`${API_URL}/analytics/top-costliest-vehicles`, authHeaders()),
      ]);
      setSummary(summaryRes.data);
      setMonthlyRevenue(revenueRes.data.monthly_revenue);
      setTopCostliest(costliestRes.data.top_costliest_vehicles);
    } catch (err) {
      setLoadError(err.response?.data?.detail || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const kpiCards = summary
    ? [
        { label: "Fuel Efficiency", value: `${summary.fuel_efficiency_km_per_liter} km/l` },
        { label: "Fleet Utilization", value: `${summary.fleet_utilization_percent}%` },
        { label: "Operational Cost", value: `₹${summary.operational_cost.toLocaleString()}` },
        { label: "Vehicle ROI", value: `${summary.vehicle_roi_percent}%`, highlight: true },
      ]
    : [];

  const maxRevenue = Math.max(1, ...monthlyRevenue.map((m) => m.revenue));
  const maxCost = Math.max(1, ...topCostliest.map((v) => v.total_cost));

  return (
    <div className="p-6 bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 min-h-screen">
      <h1 className="text-xl font-bold mb-1">Reports & Analytics</h1>
      <p className="text-xs text-gray-400 dark:text-neutral-600 mb-5">
        Live analytics from the API.
      </p>

      {loadError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-4">
          {loadError}
        </div>
      )}

      {loading && <p className="text-sm text-gray-400">Loading analytics...</p>}

      {!loading && summary && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
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

          <p className="text-xs text-gray-400 dark:text-neutral-600 mb-6">
            ROI = Revenue − (Maintenance + Fuel) / Acquisition Cost
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Revenue bar chart */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 mb-4">
                MONTHLY REVENUE
              </h2>
              {monthlyRevenue.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-neutral-600">
                  No completed trips with revenue yet.
                </p>
              ) : (
                <div className="flex items-end gap-3 h-40">
                  {monthlyRevenue.map((m) => (
                    <div key={m.month} className="flex flex-col items-center flex-1 h-full justify-end">
                      <div
                        className="w-full bg-blue-400 rounded-t"
                        style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                        title={`₹${m.revenue.toLocaleString()}`}
                      />
                      <span className="text-xs text-gray-400 dark:text-neutral-500 mt-2">
                        {formatMonthLabel(m.month)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Costliest Vehicles */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 mb-4">
                TOP COSTLIEST VEHICLES
              </h2>
              {topCostliest.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-neutral-600">No cost data yet.</p>
              ) : (
                <div className="space-y-3">
                  {topCostliest.map((v, i) => (
                    <div key={v.vehicle_id} className="flex items-center gap-3">
                      <span className="text-xs w-16 text-gray-500 dark:text-neutral-400 truncate">
                        {v.name}
                      </span>
                      <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-900 rounded overflow-hidden">
                        <div
                          className={`h-full ${COSTLIEST_COLORS[i % COSTLIEST_COLORS.length]}`}
                          style={{ width: `${(v.total_cost / maxCost) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs w-20 text-right">₹{v.total_cost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}