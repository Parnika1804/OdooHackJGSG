import { useState } from "react";
import { canManage } from "../permissions";

// ---------------------------------------------------------------------------
// MOCK DATA — replace with real API calls in Step 16 (feature/trip-connect).
// Once backend/trips.py exists, swap:
//   - MOCK_VEHICLES / MOCK_DRIVERS  -> GET /vehicles, GET /drivers
//   - MOCK_TRIPS (initial state)    -> GET /trips
//   - handleCreateTrip              -> POST /trips
//   - handleDispatch                -> PATCH /trips/{id}/dispatch
//   - handleComplete                -> PATCH /trips/{id}/complete
//   - handleCancel                  -> PATCH /trips/{id}/cancel
// The shape of the mock objects mirrors the real DB columns (schema.sql) so
// the swap should just be replacing the data source, not the UI logic.
// ---------------------------------------------------------------------------

const MOCK_VEHICLES = [
  { id: 1, name: "Van-05", status: "Available", max_load_capacity_kg: 500 },
  { id: 2, name: "Truck-04", status: "Available", max_load_capacity_kg: 3000 },
  { id: 3, name: "Mini-03", status: "In Shop", max_load_capacity_kg: 200 },
  { id: 4, name: "Van-09", status: "Retired", max_load_capacity_kg: 500 },
];

const MOCK_DRIVERS = [
  { id: 1, name: "Alex", status: "Available" },
  { id: 2, name: "Priya", status: "Available" },
  { id: 3, name: "Suresh", status: "On Trip" },
  { id: 4, name: "John", status: "Suspended" },
];

const MOCK_TRIPS_INITIAL = [
  {
    id: "TR001",
    source: "Gandhinagar Depot",
    destination: "Ahmedabad Hub",
    vehicleName: "Van-05",
    driverName: "Alex",
    status: "Dispatched",
    note: "45 min",
  },
  {
    id: "TR004",
    source: "Vatva Industrial Area",
    destination: "Sanand Warehouse",
    vehicleName: "Truck-04",
    driverName: "Suresh",
    status: "Draft",
    note: "Awaiting driver",
  },
  {
    id: "TR006",
    source: "Mansa",
    destination: "Kalol Depot",
    vehicleName: null,
    driverName: null,
    status: "Cancelled",
    note: "Vehicle sent to shop",
  },
];

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

export default function Trips() {
  const role = localStorage.getItem("role");
  const canDispatch = canManage("trips", role); // only Dispatcher, per RBAC matrix

  const [trips, setTrips] = useState(MOCK_TRIPS_INITIAL);
  const [form, setForm] = useState(emptyForm);

  const availableVehicles = MOCK_VEHICLES.filter((v) => v.status === "Available");
  const availableDrivers = MOCK_DRIVERS.filter((d) => d.status === "Available");

  const selectedVehicle = MOCK_VEHICLES.find((v) => String(v.id) === form.vehicleId);
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

  const resetForm = () => setForm(emptyForm);

  // TODO (Step 16): replace with POST /trips
  const handleCreateTrip = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const vehicle = MOCK_VEHICLES.find((v) => String(v.id) === form.vehicleId);
    const driver = MOCK_DRIVERS.find((d) => String(d.id) === form.driverId);

    const newTrip = {
      id: `TR${String(trips.length + 1).padStart(3, "0")}`,
      source: form.source,
      destination: form.destination,
      vehicleName: vehicle?.name,
      driverName: driver?.name,
      status: "Draft",
      note: "Awaiting dispatch",
    };

    setTrips([newTrip, ...trips]);
    resetForm();
  };

  // TODO (Step 16): replace with PATCH /trips/{id}/dispatch
  const handleDispatch = (tripId) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: "Dispatched", note: "In transit" } : t))
    );
  };

  // TODO (Step 16): replace with PATCH /trips/{id}/complete
  const handleComplete = (tripId) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: "Completed", note: "Delivered" } : t))
    );
  };

  // TODO (Step 16): replace with PATCH /trips/{id}/cancel
  const handleCancel = (tripId) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: "Cancelled", note: "Cancelled by dispatcher" } : t))
    );
  };

  return (
    <div className="p-6 bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 min-h-screen">
      <h1 className="text-xl font-bold mb-1">Trip Dispatcher</h1>
      <p className="text-xs text-gray-400 dark:text-neutral-600 mb-5">
        Showing mock data — connects to the real trip API once Person A ships it (Step 16).
      </p>

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
                disabled={!canSubmit}
                className="px-4 py-2 rounded text-sm bg-accent text-black font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create Trip (Draft)
              </button>
            </div>
          </form>
        </div>

        {/* Live Board */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 mb-3">LIVE BOARD</h2>
          <div className="space-y-3">
            {trips.map((t) => (
              <div
                key={t.id}
                className="border border-gray-200 dark:border-neutral-800 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-semibold">{t.id}</span>
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
                  {t.vehicleName && t.driverName
                    ? `${t.vehicleName} / ${t.driverName}`
                    : "Unassigned"}{" "}
                  · {t.note}
                </div>

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
                        onClick={() => handleComplete(t.id)}
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
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-neutral-600 mt-6">
        Rule: Cargo Weight must not exceed the vehicle's maximum load capacity. Retired/In Shop vehicles and non-Available drivers never appear in the selection pools above.
      </p>
    </div>
  );
}
