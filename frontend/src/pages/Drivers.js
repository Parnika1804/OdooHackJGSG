import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { canManage } from "../permissions";
import { downloadCsv } from "../utils/exportCsv";

const statusStyles = {
  Available: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "On Trip": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "Off Duty": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Suspended: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const isExpired = (dateStr) => new Date(dateStr) < new Date();

const emptyForm = {
  name: "",
  license_number: "",
  license_category: "LMV",
  license_expiry_date: "",
  contact_number: "",
  safety_score: 100,
  status: "Available",
};

export default function Drivers() {
  const role = localStorage.getItem("role");
  const canManageDrivers = canManage("drivers", role);

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const handleExportCsv = async () => {
    setExporting(true);
    setExportError("");
    try {
      await downloadCsv("/export/drivers", "drivers.csv");
    } catch (err) {
      setExportError("Failed to export drivers CSV");
    } finally {
      setExporting(false);
    }
  };

  const fetchDrivers = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await axios.get(`${API_URL}/drivers`, authHeaders());
      setDrivers(res.data.drivers);
    } catch (err) {
      setLoadError(err.response?.data?.detail || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const filtered = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.license_number.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await axios.post(
        `${API_URL}/drivers`,
        {
          ...form,
          safety_score: Number(form.safety_score),
        },
        authHeaders()
      );
      setForm(emptyForm);
      setShowForm(false);
      fetchDrivers();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to add driver");
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Drivers & Safety Profiles</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="border border-gray-300 dark:border-neutral-700 px-4 py-2 rounded text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-40"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          {canManageDrivers && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-accent text-black font-semibold px-4 py-2 rounded text-sm hover:opacity-90"
            >
              + Add Driver
            </button>
          )}
        </div>
      </div>

      {exportError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
          {exportError}
        </div>
      )}

      <input
        type="text"
        placeholder="Search name / license..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-1.5 text-sm mb-4 w-72"
      />

      {loading && <p className="text-sm text-gray-400">Loading drivers...</p>}
      {loadError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
          {loadError}
        </div>
      )}

      {!loading && !loadError && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-400">
              <th className="py-2 pr-4">Driver</th>
              <th className="py-2 pr-4">License No.</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Expiry</th>
              <th className="py-2 pr-4">Contact</th>
              <th className="py-2 pr-4">Safety</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-gray-100 dark:border-neutral-900">
                <td className="py-2 pr-4">{d.name}</td>
                <td className="py-2 pr-4">{d.license_number}</td>
                <td className="py-2 pr-4">{d.license_category}</td>
                <td className={`py-2 pr-4 ${isExpired(d.license_expiry_date) ? "text-red-500 font-medium" : ""}`}>
                  {d.license_expiry_date}
                  {isExpired(d.license_expiry_date) && " EXPIRED"}
                </td>
                <td className="py-2 pr-4">{d.contact_number}</td>
                <td className="py-2 pr-4">{d.safety_score}%</td>
                <td className="py-2 pr-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[d.status]}`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-400 dark:text-neutral-600">
                  No drivers match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <p className="text-xs text-gray-400 dark:text-neutral-600 mt-3">
        Rule: Expired license or Suspended status → blocked from trip assignment
      </p>

      {showForm && canManageDrivers && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleAddDriver}
            className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-96 shadow-xl"
          >
            <h2 className="text-lg font-bold mb-4">Add Driver</h2>

            {formError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
                {formError}
              </div>
            )}

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">License Number</label>
            <input
              required
              value={form.license_number}
              onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">License Category</label>
            <select
              value={form.license_category}
              onChange={(e) => setForm({ ...form, license_category: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            >
              <option>LMV</option>
              <option>HMV</option>
            </select>

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">License Expiry Date</label>
            <input
              required
              type="date"
              value={form.license_expiry_date}
              onChange={(e) => setForm({ ...form, license_expiry_date: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Contact Number</label>
            <input
              required
              value={form.contact_number}
              onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
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
                Add Driver
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}