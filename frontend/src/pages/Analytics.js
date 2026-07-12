import { useState, useEffect } from "react";
import axios from "axios";
import { Gauge, Percent, IndianRupee, TrendingUp } from "lucide-react";
import { API_URL } from "../config";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import Skeleton from "../components/ui/Skeleton";

const KPI_META = {
  "Fuel Efficiency": { icon: Gauge, tone: "text-transit-500 bg-transit-400/10" },
  "Fleet Utilization": { icon: Percent, tone: "text-signal-600 bg-signal-300/15" },
  "Operational Cost": { icon: IndianRupee, tone: "text-ink-500 bg-ink-100 dark:bg-ink-800" },
  "Vehicle ROI": { icon: TrendingUp, tone: "text-success-600 bg-success-500/10" },
};

// Costliest-vehicle bars cycle through the palette rather than raw red/orange/
// amber/blue tailwind shades, so this chart reads consistently with badges
// and KPI cards elsewhere in the app.
const COSTLIEST_BAR_CLASSES = [
  "bg-alert-400",
  "bg-signal-300",
  "bg-transit-400",
  "bg-ink-300 dark:bg-ink-600",
  "bg-ink-300 dark:bg-ink-600",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="p-6">
      <div className="mb-5">
        <h1 className="font-display text-xl font-bold text-ink-900 dark:text-paper-50">
          Reports & Analytics
        </h1>
        <p className="text-sm text-ink-400 mt-0.5">Live analytics from the API</p>
      </div>

      <Alert variant="error">{loadError}</Alert>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-7 w-16" />
            </Card>
          ))}
        </div>
      )}

      {!loading && summary && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {kpiCards.map((card) => {
              const meta = KPI_META[card.label];
              const Icon = meta.icon;
              return (
                <Card
                  key={card.label}
                  className={card.highlight ? "border-signal-300/60 dark:border-signal-300/40" : ""}
                >
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-md mb-3 ${meta.tone}`}>
                    <Icon size={16} />
                  </div>
                  <div className="text-xs text-ink-400 mb-1">{card.label}</div>
                  <div className="font-display text-2xl font-bold text-ink-900 dark:text-paper-50">
                    {card.value}
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="text-xs text-ink-400 mb-6">
            ROI = Revenue − (Maintenance + Fuel) / Acquisition Cost
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue bar chart */}
            <Card>
              <h2 className="text-sm font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-4">
                Monthly Revenue
              </h2>
              {monthlyRevenue.length === 0 ? (
                <p className="text-sm text-ink-400">No completed trips with revenue yet.</p>
              ) : (
                <div className="flex items-end gap-3 h-40">
                  {monthlyRevenue.map((m) => (
                    <div key={m.month} className="flex flex-col items-center flex-1 h-full justify-end">
                      <div
                        className="w-full bg-transit-400 rounded-t transition-all"
                        style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                        title={`₹${m.revenue.toLocaleString()}`}
                      />
                      <span className="text-xs text-ink-400 mt-2">{formatMonthLabel(m.month)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Top Costliest Vehicles */}
            <Card>
              <h2 className="text-sm font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-4">
                Top Costliest Vehicles
              </h2>
              {topCostliest.length === 0 ? (
                <p className="text-sm text-ink-400">No cost data yet.</p>
              ) : (
                <div className="space-y-3">
                  {topCostliest.map((v, i) => (
                    <div key={v.vehicle_id} className="flex items-center gap-3">
                      <span className="text-xs w-16 text-ink-500 dark:text-ink-400 truncate">{v.name}</span>
                      <div className="flex-1 h-3 bg-paper-100 dark:bg-ink-800 rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all ${
                            COSTLIEST_BAR_CLASSES[i % COSTLIEST_BAR_CLASSES.length]
                          }`}
                          style={{ width: `${(v.total_cost / maxCost) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs w-20 text-right font-data text-ink-700 dark:text-ink-200">
                        ₹{v.total_cost.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}