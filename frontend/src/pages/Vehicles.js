import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Download, Search } from "lucide-react";
import { API_URL } from "../config";
import { canManage } from "../permissions";
import { downloadCsv } from "../utils/exportCsv";
import { useToast } from "../components/ui/Toast";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import Alert from "../components/ui/Alert";
import { StatusBadge } from "../components/ui/Badge";
import { TextField, SelectField } from "../components/ui/FormField";

const emptyForm = {
  registration_number: "",
  name: "",
  type: "Van",
  max_load_capacity_kg: "",
  acquisition_cost: "",
  status: "Available",
};

// Columns that are numeric under the hood, so sorting compares numbers
// rather than lexicographically (e.g. "1500" wouldn't sort naturally as a string).
const NUMERIC_COLUMNS = ["max_load_capacity_kg", "odometer", "acquisition_cost"];

export default function Vehicles() {
  const role = localStorage.getItem("role");
  const canManageVehicles = canManage("vehicles", role);
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const clearFieldError = (field) => {
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.registration_number.trim()) errors.registration_number = "Registration number is required";
    if (!form.name.trim()) errors.name = "Name / model is required";
    if (!form.max_load_capacity_kg) errors.max_load_capacity_kg = "Capacity is required";
    else if (Number(form.max_load_capacity_kg) <= 0) errors.max_load_capacity_kg = "Must be greater than 0";
    if (!form.acquisition_cost) errors.acquisition_cost = "Acquisition cost is required";
    else if (Number(form.acquisition_cost) < 0) errors.acquisition_cost = "Cannot be negative";
    return errors;
  };

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await downloadCsv("/export/vehicles", "vehicles.csv");
      showToast("Vehicles exported to CSV");
    } catch (err) {
      showToast("Failed to export vehicles CSV", "error");
    } finally {
      setExporting(false);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.registration_number.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || v.type === typeFilter;
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
  };

  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (NUMERIC_COLUMNS.includes(sortConfig.key)) {
      valA = Number(valA);
      valB = Number(valB);
    } else if (typeof valA === "string") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setFormError("");
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitting(true);
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
      setFieldErrors({});
      setShowForm(false);
      showToast(`${form.name || "Vehicle"} added to the registry`);
      fetchVehicles();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to add vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "registration_number", label: "Reg. No", sortable: true, numeric: true },
    { key: "name", label: "Name / Model", sortable: true },
    { key: "type", label: "Type", sortable: true },
    {
      key: "max_load_capacity_kg",
      label: "Capacity",
      sortable: true,
      numeric: true,
      render: (v) => `${v.max_load_capacity_kg} kg`,
    },
    {
      key: "odometer",
      label: "Odometer",
      sortable: true,
      numeric: true,
      render: (v) => Number(v.odometer).toLocaleString(),
    },
    {
      key: "acquisition_cost",
      label: "Acq. Cost",
      sortable: true,
      numeric: true,
      render: (v) => `₹${Number(v.acquisition_cost).toLocaleString()}`,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (v) => <StatusBadge status={v.status} />,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900 dark:text-paper-50">
            Vehicle Registry
          </h1>
          <p className="text-sm text-ink-400 mt-0.5">
            {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} on record
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download} loading={exporting} onClick={handleExportCsv}>
            Export CSV
          </Button>
          {canManageVehicles && (
            <Button icon={Plus} onClick={() => setShowForm(true)}>
              Add Vehicle
            </Button>
          )}
        </div>
      </div>

      <Alert variant="error">{loadError}</Alert>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search reg. no / name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-ink-200 dark:border-ink-700 bg-paper-50 dark:bg-ink-950 pl-9 pr-3 py-2 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 focus:border-signal-300 focus:ring-2 focus:ring-signal-300/30 outline-none"
          />
        </div>
        <SelectField
          wrapperClassName="mb-0 w-36"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option>All</option>
          <option>Van</option>
          <option>Truck</option>
          <option>Mini</option>
        </SelectField>
        <SelectField
          wrapperClassName="mb-0 w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All</option>
          <option>Available</option>
          <option>On Trip</option>
          <option>In Shop</option>
          <option>Retired</option>
        </SelectField>
      </div>

      <Table
        columns={columns}
        rows={sorted}
        rowKey={(v) => v.id}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
        emptyTitle="No vehicles match your filters"
        emptyDescription="Try clearing the search or filters above."
      />

      <Modal
        open={showForm && canManageVehicles}
        onClose={() => {
          setShowForm(false);
          setFormError("");
          setFieldErrors({});
        }}
        title="Add Vehicle"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setFormError("");
                setFieldErrors({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="add-vehicle-form" loading={submitting}>
              Add Vehicle
            </Button>
          </>
        }
      >
        <form id="add-vehicle-form" onSubmit={handleAddVehicle}>
          <Alert variant="error">{formError}</Alert>

          <TextField
            label="Registration Number"
            required
            value={form.registration_number}
            onChange={(e) => {
              setForm({ ...form, registration_number: e.target.value });
              clearFieldError("registration_number");
            }}
            error={fieldErrors.registration_number}
          />

          <TextField
            label="Name / Model"
            required
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              clearFieldError("name");
            }}
            error={fieldErrors.name}
          />

          <SelectField
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option>Van</option>
            <option>Truck</option>
            <option>Mini</option>
          </SelectField>

          <TextField
            label="Max Load Capacity (kg)"
            required
            type="number"
            value={form.max_load_capacity_kg}
            onChange={(e) => {
              setForm({ ...form, max_load_capacity_kg: e.target.value });
              clearFieldError("max_load_capacity_kg");
            }}
            error={fieldErrors.max_load_capacity_kg}
          />

          <TextField
            label="Acquisition Cost"
            required
            type="number"
            value={form.acquisition_cost}
            onChange={(e) => {
              setForm({ ...form, acquisition_cost: e.target.value });
              clearFieldError("acquisition_cost");
            }}
            error={fieldErrors.acquisition_cost}
            wrapperClassName="mb-0"
          />
        </form>
      </Modal>
    </div>
  );
}