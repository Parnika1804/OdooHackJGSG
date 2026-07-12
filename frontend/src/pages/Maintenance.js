import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { canManage } from "../permissions";

const statusStyles = {
  "In Shop": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const emptyForm = {
  vehicleId: "",
  serviceType: "",
  cost: "",
  serviceDate: "",
};

export default function Maintenance() {
  const role = localStorage.getItem("role");
  const canManageMaintenance = canManage("maintenance", role);

  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [closingId, setClosingId] = useState(null);
  const [rowError, setRowError] = useState({});

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
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to log service record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (logId) => {
    setClosingId(logId);
    setRowError((prev) => ({ ...prev, [logId]: "" }));
    try {
      await axios.put(
        `${API_URL}/maintenance/${logId}`,
        { status: "Completed" },
        authHeaders()
      );
      fetchAll();
    } catch (err) {
      setRowError((prev) => ({
        ...prev,
        [logId]: err.response?.data?.detail || "Failed to close maintenance log",
      }));
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 min-h-screen">
      <h1 className="text-xl font-bold mb-1">Maintenance</h1>
      <p className="text-xs text-gray-400 dark:text-neutral-600 mb-5">
        Live maintenance data from the API.
      </p>

      {loadError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-4">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log Service Record form */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 mb-3">
            LOG SERVICE RECORD
          </h2>

          {!canManageMaintenance && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm px-3 py-2 rounded mb-3">
              Your role has view-only access to Maintenance. Only Fleet Manager can log or close service records.
            </div>
          )}

          {formError && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
              {formError}
            </div>
          )}

          <form onSubmit={handleSave} className={!canManageMaintenance ? "opacity-50 pointer-events-none" : ""}>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Vehicle</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-3"
            >
              <option value="">Select vehicle...</option>
              {eligibleVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.status})
                </option>
              ))}
            </select>

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Service Type</label>
            <input
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              placeholder="Oil Change"
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Cost</label>
            <input
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              placeholder="2500"
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Date</label>
            <input
              type="date"
              value={form.serviceDate}
              onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-4"
            />

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
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-xs text-gray-400 dark:text-neutral-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">Available</span>
              <span>→</span>
              <span className="text-amber-600 dark:text-amber-400">In Shop</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-600 dark:text-amber-400">In Shop</span>
              <span>→</span>
              <span className="text-green-600 dark:text-green-400">Available</span>
            </div>
            <p>Note: In Shop vehicles are removed from the dispatch pool.</p>
          </div>
        </div>

        {/* Service Log table */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 mb-3">SERVICE LOG</h2>

          {loading && <p className="text-sm text-gray-400">Loading service log...</p>}

          {!loading && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-400">
                  <th className="py-2 pr-4">Vehicle</th>
                  <th className="py-2 pr-4">Service Type</th>
                  <th className="py-2 pr-4">Cost</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Status</th>
                  {canManageMaintenance && <th className="py-2 pr-4"></th>}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const vehicle = vehicleById(log.vehicle_id);
                  return (
                    <tr key={log.id} className="border-b border-gray-100 dark:border-neutral-900 align-top">
                      <td className="py-2 pr-4">{vehicle ? vehicle.name : `#${log.vehicle_id}`}</td>
                      <td className="py-2 pr-4">{log.service_type}</td>
                      <td className="py-2 pr-4">₹{Number(log.cost).toLocaleString()}</td>
                      <td className="py-2 pr-4">{log.service_date}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[log.status]}`}>
                          {log.status}
                        </span>
                        {rowError[log.id] && (
                          <div className="text-xs text-red-500 mt-1">{rowError[log.id]}</div>
                        )}
                      </td>
                      {canManageMaintenance && (
                        <td className="py-2 pr-4">
                          {log.status === "In Shop" && (
                            <button
                              onClick={() => handleClose(log.id)}
                              disabled={closingId === log.id}
                              className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-neutral-700 disabled:opacity-40"
                            >
                              {closingId === log.id ? "Closing..." : "Close"}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-400 dark:text-neutral-600">
                      No maintenance logs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}