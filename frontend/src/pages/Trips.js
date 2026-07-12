import { useState, useEffect } from "react";
import axios from "axios";
import { Download, AlertTriangle } from "lucide-react";
import { API_URL } from "../config";
import { canManage } from "../permissions";
import { downloadCsv } from "../utils/exportCsv";
import { useToast } from "../components/ui/Toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/Badge";
import { TextField, SelectField } from "../components/ui/FormField";

const LIFECYCLE_STEPS = ["Draft", "Dispatched", "Completed", "Cancelled"];

const emptyForm = {
  source: "",
  destination: "",
  vehicleId: "",
  driverId: "",
  cargoWeight: "",
  plannedDistance: "",
};

const emptyCompleteForm = {
  finalOdometer: "",
  fuelConsumed: "",
  revenue: "",
};

export default function Trips() {
  const role = localStorage.getItem("role");
  const canDispatch = canManage("trips", role); // only Dispatcher, per RBAC matrix
  const { showToast } = useToast();

  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [exporting, setExporting] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Trip currently being completed (opens the odometer/fuel modal)
  const [completingTrip, setCompletingTrip] = useState(null);
  const [completeForm, setCompleteForm] = useState(emptyCompleteForm);
  const [completeError, setCompleteError] = useState("");
  const [completing, setCompleting] = useState(false);

  // Track per-trip action errors (dispatch/cancel) inline on the card
  const [actionError, setActionError] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await downloadCsv("/export/trips", "trips.csv");
      showToast("Trips exported to CSV");
    } catch (err) {
      showToast("Failed to export trips CSV", "error");
    } finally {
      setExporting(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        axios.get(`${API_URL}/trips`, authHeaders()),
        axios.get(`${API_URL}/vehicles`, authHeaders()),
        axios.get(`${API_URL}/drivers`, authHeaders()),
      ]);
      setTrips(tripsRes.data.trips);
      setVehicles(vehiclesRes.data.vehicles);
      setDrivers(driversRes.data.drivers);
    } catch (err) {
      setLoadError(err.response?.data?.detail || "Failed to load trip data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vehicleById = (id) => vehicles.find((v) => v.id === id);
  const driverById = (id) => drivers.find((d) => d.id === id);

  const availableVehicles = vehicles.filter((v) => v.status === "Available");
  const availableDrivers = drivers.filter((d) => d.status === "Available");

  const selectedVehicle = vehicles.find((v) => String(v.id) === form.vehicleId);
  const cargoWeightNum = Number(form.cargoWeight) || 0;
  const capacityExceededBy = selectedVehicle
    ? cargoWeightNum - selectedVehicle.max_load_capacity_kg
    : 0;
  const capacityExceeded = selectedVehicle && capacityExceededBy > 0;

  const canSubmit =
    form.source.trim() &&
    form.destination.trim() &&
    form.vehicleId &&
    form.driverId &&
    cargoWeightNum > 0 &&
    Number(form.plannedDistance) > 0 &&
    !capacityExceeded;

  const resetForm = () => {
    setForm(emptyForm);
    setFormError("");
  };

  const noteForTrip = (t) => {
    if (t.status === "Draft") return t.vehicle_id && t.driver_id ? "Awaiting dispatch" : "Awaiting vehicle/driver";
    if (t.status === "Dispatched") return "In transit";
    if (t.status === "Completed") return "Delivered";
    if (t.status === "Cancelled") return "Cancelled";
    return "";
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError("");
    try {
      await axios.post(
        `${API_URL}/trips`,
        {
          source: form.source,
          destination: form.destination,
          vehicle_id: Number(form.vehicleId),
          driver_id: Number(form.driverId),
          cargo_weight_kg: cargoWeightNum,
          planned_distance_km: Number(form.plannedDistance),
        },
        authHeaders()
      );
      resetForm();
      showToast("Trip created as Draft");
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create trip");
    } finally {
      setSubmitting(false);
    }
  };

  const clearActionError = (tripId) =>
    setActionError((prev) => ({ ...prev, [tripId]: "" }));

  const setBusy = (tripId, action) =>
    setActionLoading((prev) => ({ ...prev, [tripId]: action }));

  const handleDispatch = async (tripId) => {
    clearActionError(tripId);
    setBusy(tripId, "dispatch");
    try {
      await axios.patch(`${API_URL}/trips/${tripId}/dispatch`, {}, authHeaders());
      showToast(`TR${String(tripId).padStart(3, "0")} dispatched`);
      fetchAll();
    } catch (err) {
      setActionError((prev) => ({
        ...prev,
        [tripId]: err.response?.data?.detail || "Failed to dispatch trip",
      }));
    } finally {
      setBusy(tripId, null);
    }
  };

  const openCompleteModal = (trip) => {
    setCompletingTrip(trip);
    setCompleteForm(emptyCompleteForm);
    setCompleteError("");
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!completingTrip) return;
    setCompleteError("");
    setCompleting(true);
    try {
      await axios.patch(
        `${API_URL}/trips/${completingTrip.id}/complete`,
        {
          final_odometer: Number(completeForm.finalOdometer),
          fuel_consumed_liters: Number(completeForm.fuelConsumed),
          revenue: Number(completeForm.revenue) || 0,
        },
        authHeaders()
      );
      showToast(`TR${String(completingTrip.id).padStart(3, "0")} marked complete`);
      setCompletingTrip(null);
      fetchAll();
    } catch (err) {
      setCompleteError(err.response?.data?.detail || "Failed to complete trip");
    } finally {
      setCompleting(false);
    }
  };

  const handleCancel = async (tripId) => {
    clearActionError(tripId);
    setBusy(tripId, "cancel");
    try {
      await axios.patch(`${API_URL}/trips/${tripId}/cancel`, {}, authHeaders());
      showToast(`TR${String(tripId).padStart(3, "0")} cancelled`, "info");
      fetchAll();
    } catch (err) {
      setActionError((prev) => ({
        ...prev,
        [tripId]: err.response?.data?.detail || "Failed to cancel trip",
      }));
    } finally {
      setBusy(tripId, null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-1">
        <h1 className="font-display text-xl font-bold text-ink-900 dark:text-paper-50">
          Trip Dispatcher
        </h1>
        <Button variant="secondary" icon={Download} loading={exporting} onClick={handleExportCsv}>
          Export CSV
        </Button>
      </div>
      <p className="text-xs text-ink-400 mb-6">Live trip data from the API.</p>

      {/* Trip lifecycle stepper */}
      <div className="flex items-center gap-2 mb-8 max-w-xl">
        {LIFECYCLE_STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  step === "Cancelled"
                    ? "bg-alert-400"
                    : i === 0
                    ? "bg-signal-300"
                    : "bg-ink-200 dark:bg-ink-700"
                }`}
              />
              <span className="text-xs text-ink-400">{step}</span>
            </div>
            {i < LIFECYCLE_STEPS.length - 1 && (
              <div className="flex-1 h-px border-t-2 border-dashed border-ink-200 dark:border-ink-700 mx-2 mb-4" />
            )}
          </div>
        ))}
      </div>

      <Alert variant="error">{loadError}</Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Trip form */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-3">
            Create Trip
          </h2>

          {!canDispatch && (
            <div className="flex items-start gap-2 rounded-md border border-signal-300/40 bg-signal-300/10 text-signal-700 dark:text-signal-300 text-sm px-3 py-2 mb-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              Your role has view-only access to Trips. Only Dispatcher can create or dispatch trips.
            </div>
          )}

          <Alert variant="error">{formError}</Alert>

          <Card className={!canDispatch ? "opacity-50 pointer-events-none" : ""}>
            <form onSubmit={handleCreateTrip}>
              <TextField
                label="Source"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="Gandhinagar Depot"
              />

              <TextField
                label="Destination"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="Ahmedabad Hub"
              />

              <SelectField
                label="Vehicle (Available only)"
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              >
                <option value="">Select vehicle...</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.max_load_capacity_kg} kg capacity
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Driver (Available only)"
                value={form.driverId}
                onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              >
                <option value="">Select driver...</option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </SelectField>

              <TextField
                label="Cargo Weight (kg)"
                type="number"
                value={form.cargoWeight}
                onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })}
                placeholder="450"
              />

              <TextField
                label="Planned Distance (km)"
                type="number"
                value={form.plannedDistance}
                onChange={(e) => setForm({ ...form, plannedDistance: e.target.value })}
                placeholder="58"
              />

              {selectedVehicle && (
                <div
                  className={`font-data text-xs rounded-md px-3 py-2 mb-4 border ${
                    capacityExceeded
                      ? "bg-alert-50 dark:bg-ink-950 border-alert-400/40 text-alert-600 dark:text-alert-400"
                      : "bg-paper-100 dark:bg-ink-950 border-ink-100 dark:border-ink-800 text-ink-500 dark:text-ink-400"
                  }`}
                >
                  Vehicle Capacity {selectedVehicle.max_load_capacity_kg} kg
                  <br />
                  Cargo Weight: {cargoWeightNum || 0} kg
                  {capacityExceeded && (
                    <>
                      <br />
                      ✗ Capacity exceeded by {capacityExceededBy} kg — dispatch blocked
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Reset
                </Button>
                <Button type="submit" disabled={!canSubmit} loading={submitting}>
                  Create Trip (Draft)
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Live Board */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-3">
            Live Board
          </h2>

          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="h-24 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && trips.length === 0 && (
            <Card padded={false}>
              <EmptyState title="No trips yet" description="Trips you create will appear on this board." />
            </Card>
          )}

          {!loading && trips.length > 0 && (
            <div className="space-y-3">
              {trips.map((t) => {
                const vehicle = vehicleById(t.vehicle_id);
                const driver = driverById(t.driver_id);
                const busy = actionLoading[t.id];
                return (
                  <Card key={t.id}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-data text-sm font-semibold text-ink-900 dark:text-paper-50">
                        TR{String(t.id).padStart(3, "0")}
                      </span>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="text-sm text-ink-600 dark:text-ink-300 mb-1">
                      {t.source} → {t.destination}
                    </div>
                    <div className="text-xs text-ink-400 mb-3">
                      {vehicle && driver ? `${vehicle.name} / ${driver.name}` : "Unassigned"} ·{" "}
                      {noteForTrip(t)}
                    </div>

                    <Alert variant="error" className="text-xs">
                      {actionError[t.id]}
                    </Alert>

                    {canDispatch && (
                      <div className="flex gap-2">
                        {t.status === "Draft" && (
                          <Button
                            size="sm"
                            loading={busy === "dispatch"}
                            onClick={() => handleDispatch(t.id)}
                          >
                            Dispatch
                          </Button>
                        )}
                        {t.status === "Dispatched" && (
                          <Button size="sm" variant="success" onClick={() => openCompleteModal(t)}>
                            Complete
                          </Button>
                        )}
                        {(t.status === "Draft" || t.status === "Dispatched") && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={busy === "cancel"}
                            onClick={() => handleCancel(t.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-ink-400 mt-6 max-w-2xl">
        Rule: Cargo Weight must not exceed the vehicle's maximum load capacity. Retired/In Shop
        vehicles and non-Available drivers never appear in the selection pools above.
      </p>

      {/* Complete Trip modal — captures final odometer + fuel consumed */}
      <Modal
        open={!!completingTrip}
        onClose={() => setCompletingTrip(null)}
        title={completingTrip ? `Complete Trip TR${String(completingTrip.id).padStart(3, "0")}` : ""}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setCompletingTrip(null)}>
              Cancel
            </Button>
            <Button type="submit" form="complete-trip-form" variant="success" loading={completing}>
              Mark Completed
            </Button>
          </>
        }
      >
        <form id="complete-trip-form" onSubmit={handleComplete}>
          <Alert variant="error">{completeError}</Alert>

          <TextField
            label="Final Odometer"
            required
            type="number"
            value={completeForm.finalOdometer}
            onChange={(e) => setCompleteForm({ ...completeForm, finalOdometer: e.target.value })}
          />

          <TextField
            label="Fuel Consumed (liters)"
            required
            type="number"
            value={completeForm.fuelConsumed}
            onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })}
          />

          <TextField
            label="Revenue (optional)"
            type="number"
            value={completeForm.revenue}
            onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })}
            wrapperClassName="mb-0"
          />
        </form>
      </Modal>
    </div>
  );
}
