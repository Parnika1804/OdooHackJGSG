import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { canManage } from "../permissions";

const statusStyles = {
  Available: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "On Trip": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "In Shop": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Retired: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const emptyForm = {
  registration_number: "",
  name: "",
  type: "Van",
  max_load_capacity_kg: "",
  acquisition_cost: "",
  status: "Available",
};

export default function Vehicles() {
  const role = localStorage.getItem("role");
  const canManageVehicles = canManage("vehicles", role);

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchVehicles = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await axios.get(`${API_URL}/vehicles`, authHeaders());
      setVehicles(res.data.vehicles);
    } catch (err) {
      setLoadError(err.response?.data?.detail || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.registration_number.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || v.type === typeFilter;
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await axios.post(
        `${API_URL}/vehicles`,
        {
          ...form,
          max_load_capacity_kg: Number(form.max_load_capacity_kg),
          acquisition_cost: Number(form.acquisition_cost),
        },
        authHeaders()
      );
      setForm(emptyForm);
      setShowForm(false);
      fetchVehicles();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to add vehicle");
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Vehicle Registry</h1>
        {canManageVehicles && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-accent text-black font-semibold px-4 py-2 rounded text-sm hover:opacity-90"
          >
            + Add Vehicle
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search reg. no / name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-1.5 text-sm flex-1"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-1.5 text-sm"
        >
          <option>All</option>
          <option>Van</option>
          <option>Truck</option>
          <option>Mini</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-1.5 text-sm"
        >
          <option>All</option>
          <option>Available</option>
          <option>On Trip</option>
          <option>In Shop</option>
          <option>Retired</option>
        </select>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading vehicles...</p>}
      {loadError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
          {loadError}
        </div>
      )}

      {!loading && !loadError && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-400">
              <th className="py-2 pr-4">Reg. No (Unique)</th>
              <th className="py-2 pr-4">Name/Model</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Capacity</th>
              <th className="py-2 pr-4">Odometer</th>
              <th className="py-2 pr-4">Acq. Cost</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-b border-gray-100 dark:border-neutral-900">
                <td className="py-2 pr-4">{v.registration_number}</td>
                <td className="py-2 pr-4">{v.name}</td>
                <td className="py-2 pr-4">{v.type}</td>
                <td className="py-2 pr-4">{v.max_load_capacity_kg} kg</td>
                <td className="py-2 pr-4">{Number(v.odometer).toLocaleString()}</td>
                <td className="py-2 pr-4">₹{Number(v.acquisition_cost).toLocaleString()}</td>
                <td className="py-2 pr-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[v.status]}`}>
                    {v.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-400 dark:text-neutral-600">
                  No vehicles match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && canManageVehicles && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleAddVehicle}
            className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-96 shadow-xl"
          >
            <h2 className="text-lg font-bold mb-4">Add Vehicle</h2>

            {formError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
                {formError}
              </div>
            )}

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Registration Number</label>
            <input
              required
              value={form.registration_number}
              onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Name / Model</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            >
              <option>Van</option>
              <option>Truck</option>
              <option>Mini</option>
            </select>

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Max Load Capacity (kg)</label>
            <input
              required
              type="number"
              value={form.max_load_capacity_kg}
              onChange={(e) => setForm({ ...form, max_load_capacity_kg: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Acquisition Cost</label>
            <input
              required
              type="number"
              value={form.acquisition_cost}
              onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-4"
            />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(""); }}
                className="px-4 py-2 rounded text-sm border border-gray-300 dark:border-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded text-sm bg-accent text-black font-semibold hover:opacity-90"
              >
                Add Vehicle
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}