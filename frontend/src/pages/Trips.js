import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { canManage } from "../permissions";
import { downloadCsv } from "../utils/exportCsv";

const LIFECYCLE_STEPS = ["Draft", "Dispatched", "Completed", "Cancelled"];

const statusStyles = {
  Draft: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  Dispatched: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

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

  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Trip currently being completed (opens the odometer/fuel modal)
  const [completingTrip, setCompletingTrip] = useState(null);
  const [completeForm, setCompleteForm] = useState(emptyCompleteForm);
  const [completeError, setCompleteError] = useState("");

  // Track per-trip action errors (dispatch/cancel) inline on the card
  const [actionError, setActionError] = useState({});

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const handleExportCsv = async () => {
    setExporting(true);
    setExportError("");
    try {
      await downloadCsv("/export/trips", "trips.csv");
    } catch (err) {
      setExportError("Failed to export trips CSV");
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
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create trip");
    } finally {
      setSubmitting(false);
    }
  };

  const clearActionError = (tripId) =>
    setActionError((prev) => ({ ...prev, [tripId]: "" }));

  const handleDispatch = async (tripId) => {
    clearActionError(tripId);
    try {
      await axios.patch(`${API_URL}/trips/${tripId}/dispatch`, {}, authHeaders());
      fetchAll();
    } catch (err) {
      setActionError((prev) => ({
        ...prev,
        [tripId]: err.response?.data?.detail || "Failed to dispatch trip",
      }));
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
      setCompletingTrip(null);
      fetchAll();
    } catch (err) {
      setCompleteError(err.response?.data?.detail || "Failed to complete trip");
    }
  };

  const handleCancel = async (tripId) => {
    clearActionError(tripId);
    try {
      await axios.patch(`${API_URL}/trips/${tripId}/cancel`, {}, authHeaders());
      fetchAll();
    } catch (err) {
      setActionError((prev) => ({
        ...prev,
        [tripId]: err.response?.data?.detail || "Failed to cancel trip",
      }));
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 min-h-screen">
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-xl font-bold">Trip Dispatcher</h1>
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="border border-gray-300 dark:border-neutral-700 px-4 py-2 rounded text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-40"
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-neutral-600 mb-5">
        Live trip data from the API.
      </p>

      {exportError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
          {exportError}
        </div>
      )}

      {/* Trip lifecycle stepper */}
      <div className="flex items-center gap-2 mb-8 max-w-xl">
        {LIFECYCLE_STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  step === "Cancelled"
                    ? "bg-red-400"
                    : i === 0
                    ? "bg-accent"
                    : "bg-neutral-300 dark:bg-neutral-700"
                }`}
              />
              <span className="text-xs text-gray-500 dark:text-neutral-400">{step}</span>
            </div>
            {i < LIFECYCLE_STEPS.length - 1 && (
              <div className="flex-1 h-px bg-neutral-300 dark:bg-neutral-700 mx-2 mb-4" />
            )}
          </div>
        ))}
      </div>

      {loadError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-4">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Trip form */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 mb-3">
            CREATE TRIP
          </h2>

          {!canDispatch && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm px-3 py-2 rounded mb-3">
              Your role has view-only access to Trips. Only Dispatcher can create or dispatch trips.
            </div>
          )}

          {formError && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateTrip} className={!canDispatch ? "opacity-50 pointer-events-none" : ""}>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Source</label>
            <input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="Gandhinagar Depot"
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Destination</label>
            <input
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="Ahmedabad Hub"
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">
              Vehicle (Available only)
            </label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-3"
            >
              <option value="">Select vehicle...</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.max_load_capacity_kg} kg capacity
                </option>
              ))}
            </select>

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">
              Driver (Available only)
            </label>
            <select
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-3"
            >
              <option value="">Select driver...</option>
              {availableDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Cargo Weight (kg)</label>
            <input
              type="number"
              value={form.cargoWeight}
              onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })}
              placeholder="450"
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Planned Distance (km)</label>
            <input
              type="number"
              value={form.plannedDistance}
              onChange={(e) => setForm({ ...form, plannedDistance: e.target.value })}
              placeholder="58"
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-3"
            />

            {selectedVehicle && (
              <div
                className={`text-xs rounded px-3 py-2 mb-4 border ${
                  capacityExceeded
                    ? "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400"
                    : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-400"
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
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded text-sm border border-gray-300 dark:border-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="px-4 py-2 rounded text-sm bg-accent text-black font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : "Create Trip (Draft)"}
              </button>
            </div>
          </form>
        </div>

        {/* Live Board */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 mb-3">LIVE BOARD</h2>

          {loading && <p className="text-sm text-gray-400">Loading trips...</p>}

          {!loading && (
            <div className="space-y-3">
              {trips.map((t) => {
                const vehicle = vehicleById(t.vehicle_id);
                const driver = driverById(t.driver_id);
                return (
                  <div
                    key={t.id}
                    className="border border-gray-200 dark:border-neutral-800 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold">TR{String(t.id).padStart(3, "0")}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[t.status]}`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-neutral-300 mb-1">
                      {t.source} → {t.destination}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-neutral-500 mb-3">
                      {vehicle && driver ? `${vehicle.name} / ${driver.name}` : "Unassigned"} ·{" "}
                      {noteForTrip(t)}
                    </div>

                    {actionError[t.id] && (
                      <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded mb-3">
                        {actionError[t.id]}
                      </div>
                    )}

                    {canDispatch && (
                      <div className="flex gap-2">
                        {t.status === "Draft" && (
                          <button
                            onClick={() => handleDispatch(t.id)}
                            className="text-xs px-3 py-1.5 rounded bg-accent text-black font-semibold hover:opacity-90"
                          >
                            Dispatch
                          </button>
                        )}
                        {t.status === "Dispatched" && (
                          <button
                            onClick={() => openCompleteModal(t)}
                            className="text-xs px-3 py-1.5 rounded bg-green-600 text-white font-semibold hover:opacity-90"
                          >
                            Complete
                          </button>
                        )}
                        {(t.status === "Draft" || t.status === "Dispatched") && (
                          <button
                            onClick={() => handleCancel(t.id)}
                            className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-neutral-700"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {trips.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-neutral-600">No trips yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-neutral-600 mt-6">
        Rule: Cargo Weight must not exceed the vehicle's maximum load capacity. Retired/In Shop vehicles and non-Available drivers never appear in the selection pools above.
      </p>

      {/* Complete Trip modal — captures final odometer + fuel consumed */}
      {completingTrip && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleComplete}
            className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-96 shadow-xl"
          >
            <h2 className="text-lg font-bold mb-4">
              Complete Trip TR{String(completingTrip.id).padStart(3, "0")}
            </h2>

            {completeError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
                {completeError}
              </div>
            )}

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Final Odometer</label>
            <input
              required
              type="number"
              value={completeForm.finalOdometer}
              onChange={(e) => setCompleteForm({ ...completeForm, finalOdometer: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Fuel Consumed (liters)</label>
            <input
              required
              type="number"
              value={completeForm.fuelConsumed}
              onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Revenue (optional)</label>
            <input
              type="number"
              value={completeForm.revenue}
              onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-4"
            />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setCompletingTrip(null)}
                className="px-4 py-2 rounded text-sm border border-gray-300 dark:border-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded text-sm bg-accent text-black font-semibold hover:opacity-90"
              >
                Mark Completed
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}