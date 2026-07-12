import { useState, useEffect } from "react";
import axios from "axios";
import { Truck, CheckCircle2, Wrench, Route, Clock, Users, Gauge } from "lucide-react";
import { API_URL } from "../config";
import { toneForStatus } from "../statusTones";
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import Alert from "../components/ui/Alert";
import Skeleton from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/Badge";
import { SelectField } from "../components/ui/FormField";

const VEHICLE_STATUSES = ["Available", "On Trip", "In Shop", "Retired"];

const BAR_TONE_CLASSES = {
  success: "bg-success-400",
  transit: "bg-transit-400",
  signal: "bg-signal-300",
  alert: "bg-alert-400",
  neutral: "bg-ink-300 dark:bg-ink-600",
};

const KPI_META = {
  "Active Vehicles": { icon: Truck, tone: "text-transit-500 bg-transit-400/10" },
  "Available Vehicles": { icon: CheckCircle2, tone: "text-success-600 bg-success-500/10" },
  "Vehicles in Maintenance": { icon: Wrench, tone: "text-signal-600 bg-signal-300/15" },
  "Active Trips": { icon: Route, tone: "text-transit-500 bg-transit-400/10" },
  "Pending Trips": { icon: Clock, tone: "text-ink-500 bg-ink-100 dark:bg-ink-800" },
  "Drivers on Duty": { icon: Users, tone: "text-transit-500 bg-transit-400/10" },
  "Fleet Utilization": { icon: Gauge, tone: "text-signal-600 bg-signal-300/15" },
};

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const tripColumns = [
    {
      key: "trip",
      label: "Trip",
      numeric: true,
      render: (t) => `TR${String(t.id).padStart(3, "0")}`,
    },
    { key: "vehicle_name", label: "Vehicle", render: (t) => t.vehicle_name || "--" },
    { key: "driver_name", label: "Driver", render: (t) => t.driver_name || "--" },
    { key: "status", label: "Status", render: (t) => <StatusBadge status={t.status} /> },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h1 className="font-display text-xl font-bold text-ink-900 dark:text-paper-50">
          Dashboard
        </h1>
        <div className="flex flex-wrap gap-2">
          <SelectField
            wrapperClassName="mb-0 w-32"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option>All</option>
            {vehicleTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </SelectField>
          <SelectField
            wrapperClassName="mb-0 w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            {VEHICLE_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectField>
          <SelectField
            wrapperClassName="mb-0 w-32"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option>All</option>
            {regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </SelectField>
        </div>
      </div>

      <Alert variant="error">{loadError}</Alert>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {loading &&
          Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="p-3">
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-6 w-10" />
            </Card>
          ))}

        {!loading &&
          kpiCards.map((card) => {
            const meta = KPI_META[card.label] || {};
            const Icon = meta.icon;
            return (
              <Card
                key={card.label}
                className={`p-3 ${card.highlight ? "border-signal-300 dark:border-signal-300/60" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-ink-400 leading-tight">{card.label}</span>
                  {Icon && (
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${meta.tone}`}>
                      <Icon size={13} />
                    </span>
                  )}
                </div>
                <div className="font-data text-2xl font-bold text-ink-900 dark:text-paper-50">
                  {card.value}
                </div>
              </Card>
            );
          })}
      </div>

      {!loading && kpis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent trips */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-3">
              Recent Trips
            </h2>
            <Table
              columns={tripColumns}
              rows={kpis.recent_trips}
              rowKey={(t) => t.id}
              emptyTitle="No trips yet"
              emptyDescription="Dispatched trips will show up here."
            />
          </div>

          {/* Vehicle status bar */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-3">
              Vehicle Status
            </h2>
            <Card>
              <div className="space-y-4">
                {statusCounts.map(({ status, count }) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs w-20 shrink-0 text-ink-500 dark:text-ink-400">
                      {status}
                    </span>
                    <div className="flex-1 h-2.5 bg-paper-100 dark:bg-ink-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${BAR_TONE_CLASSES[toneForStatus(status)]}`}
                        style={{ width: `${(count / totalForBar) * 100}%` }}
                      />
                    </div>
                    <span className="font-data text-xs w-6 text-right text-ink-600 dark:text-ink-300">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
