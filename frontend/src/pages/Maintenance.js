import { useState, useEffect } from "react";
import axios from "axios";
import { Wrench, CheckCircle2, ArrowRight } from "lucide-react";
import { API_URL } from "../config";
import { canManage } from "../permissions";
import { useToast } from "../components/ui/Toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import Alert from "../components/ui/Alert";
import { StatusBadge } from "../components/ui/Badge";
import { TextField, SelectField } from "../components/ui/FormField";

const emptyForm = {
  vehicleId: "",
  serviceType: "",
  cost: "",
  serviceDate: "",
};

export default function Maintenance() {
  const role = localStorage.getItem("role");
  const canManageMaintenance = canManage("maintenance", role);
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [closingId, setClosingId] = useState(null);

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchAll = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        axios.get(`${API_URL}/maintenance`, authHeaders()),
        axios.get(`${API_URL}/vehicles`, authHeaders()),
      ]);
      setLogs(logsRes.data.maintenance_logs);
      setVehicles(vehiclesRes.data.vehicles);
    } catch (err) {
      setLoadError(err.response?.data?.detail || "Failed to load maintenance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vehicleById = (id) => vehicles.find((v) => v.id === id);

  // A vehicle already In Shop (via an open log) or On Trip/Retired shouldn't be
  // sent to maintenance again from this form.
  const eligibleVehicles = vehicles.filter(
    (v) => v.status !== "On Trip" && v.status !== "Retired"
  );

  const resetForm = () => {
    setForm(emptyForm);
    setFormError("");
  };

  const canSubmit =
    form.vehicleId && form.serviceType.trim() && form.serviceDate && Number(form.cost) >= 0;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError("");
    try {
      await axios.post(
        `${API_URL}/maintenance`,
        {
          vehicle_id: Number(form.vehicleId),
          service_type: form.serviceType,
          cost: Number(form.cost) || 0,
          service_date: form.serviceDate,
        },
        authHeaders()
      );
      resetForm();
      showToast("Service record logged");
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to log service record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (logId) => {
    setClosingId(logId);
    try {
      await axios.put(
        `${API_URL}/maintenance/${logId}`,
        { status: "Completed" },
        authHeaders()
      );
      showToast("Service log closed — vehicle back to Available");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to close maintenance log", "error");
    } finally {
      setClosingId(null);
    }
  };

  const columns = [
    {
      key: "vehicle_id",
      label: "Vehicle",
      render: (log) => {
        const vehicle = vehicleById(log.vehicle_id);
        return vehicle ? vehicle.name : `#${log.vehicle_id}`;
      },
    },
    { key: "service_type", label: "Service Type" },
    {
      key: "cost",
      label: "Cost",
      numeric: true,
      render: (log) => `₹${Number(log.cost).toLocaleString()}`,
    },
    { key: "service_date", label: "Date", numeric: true },
    {
      key: "status",
      label: "Status",
      render: (log) => <StatusBadge status={log.status} />,
    },
  ];

  if (canManageMaintenance) {
    columns.push({
      key: "actions",
      label: "",
      align: "right",
      render: (log) =>
        log.status === "In Shop" ? (
          <Button
            size="sm"
            variant="secondary"
            icon={CheckCircle2}
            loading={closingId === log.id}
            onClick={() => handleClose(log.id)}
          >
            Close
          </Button>
        ) : null,
    });
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="font-display text-xl font-bold text-ink-900 dark:text-paper-50">
          Maintenance
        </h1>
        <p className="text-sm text-ink-400 mt-0.5">
          {logs.length} service record{logs.length === 1 ? "" : "s"} on file
        </p>
      </div>

      <Alert variant="error">{loadError}</Alert>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-6 items-start">
        {/* Log Service Record form */}
        <Card>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-4">
            <Wrench size={15} />
            Log Service Record
          </h2>

          {!canManageMaintenance && (
            <Alert variant="info">
              Your role has view-only access to Maintenance. Only Fleet Manager can log or close
              service records.
            </Alert>
          )}
          <Alert variant="error">{formError}</Alert>

          <form
            onSubmit={handleSave}
            className={!canManageMaintenance ? "opacity-50 pointer-events-none" : ""}
          >
            <SelectField
              label="Vehicle"
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            >
              <option value="">Select vehicle...</option>
              {eligibleVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.status})
                </option>
              ))}
            </SelectField>

            <TextField
              label="Service Type"
              placeholder="Oil Change"
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            />

            <TextField
              label="Cost"
              type="number"
              placeholder="2500"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />

            <TextField
              label="Date"
              type="date"
              value={form.serviceDate}
              onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
            />

            <div className="flex gap-2 justify-end mt-1">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit} loading={submitting}>
                Save
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-ink-100 dark:border-ink-800 text-xs text-ink-400 space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status="Available" />
              <ArrowRight size={12} />
              <StatusBadge status="In Shop" />
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="In Shop" />
              <ArrowRight size={12} />
              <StatusBadge status="Available" />
            </div>
            <p>In Shop vehicles are removed from the dispatch pool.</p>
          </div>
        </Card>

        {/* Service Log table */}
        <div>
          <h2 className="text-sm font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-3">
            Service Log
          </h2>
          <Table
            columns={columns}
            rows={logs}
            rowKey={(log) => log.id}
            loading={loading}
            emptyTitle="No maintenance logs yet"
            emptyDescription="Records logged here will appear as vehicles go in and out of the shop."
          />
        </div>
      </div>
    </div>
  );
}