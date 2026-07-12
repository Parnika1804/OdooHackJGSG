import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Download, Search, ShieldAlert } from "lucide-react";
import { API_URL } from "../config";
import { canManage } from "../permissions";
import { downloadCsv } from "../utils/exportCsv";
import { useToast } from "../components/ui/Toast";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import Alert from "../components/ui/Alert";
import Badge, { StatusBadge } from "../components/ui/Badge";
import { TextField, SelectField } from "../components/ui/FormField";

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

// Numeric under the hood, so sorting compares numbers rather than lexicographically.
const NUMERIC_COLUMNS = ["safety_score"];

function SafetyScore({ score }) {
  const value = Number(score);
  const tone =
    value >= 85 ? "text-success-600 dark:text-success-400" :
    value >= 60 ? "text-signal-600 dark:text-signal-300" :
    "text-alert-600 dark:text-alert-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            value >= 85 ? "bg-success-400" : value >= 60 ? "bg-signal-300" : "bg-alert-400"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className={`font-data text-xs font-semibold ${tone}`}>{value}%</span>
    </div>
  );
}

export default function Drivers() {
  const role = localStorage.getItem("role");
  const canManageDrivers = canManage("drivers", role);
  const { showToast } = useToast();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
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
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.license_number.trim()) errors.license_number = "License number is required";
    if (!form.license_expiry_date) errors.license_expiry_date = "Expiry date is required";
    if (!form.contact_number.trim()) errors.contact_number = "Contact number is required";
    else if (!/^\+?[0-9\s-]{7,15}$/.test(form.contact_number.trim()))
      errors.contact_number = "Enter a valid phone number";
    return errors;
  };

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await downloadCsv("/export/drivers", "drivers.csv");
      showToast("Drivers exported to CSV");
    } catch (err) {
      showToast("Failed to export drivers CSV", "error");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.license_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || d.license_category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
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

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setFormError("");
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitting(true);
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
      setFieldErrors({});
      setShowForm(false);
      showToast(`${form.name || "Driver"} added to the roster`);
      fetchDrivers();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to add driver");
    } finally {
      setSubmitting(false);
    }
  };

  const expiredCount = drivers.filter((d) => isExpired(d.license_expiry_date)).length;

  const columns = [
    { key: "name", label: "Driver", sortable: true },
    { key: "license_number", label: "License No.", sortable: true, numeric: true },
    { key: "license_category", label: "Category", sortable: true },
    {
      key: "license_expiry_date",
      label: "Expiry",
      sortable: true,
      render: (d) =>
        isExpired(d.license_expiry_date) ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="font-data text-ink-700 dark:text-ink-200">{d.license_expiry_date}</span>
            <Badge tone="alert">Expired</Badge>
          </span>
        ) : (
          <span className="font-data">{d.license_expiry_date}</span>
        ),
    },
    { key: "contact_number", label: "Contact", numeric: true },
    {
      key: "safety_score",
      label: "Safety",
      sortable: true,
      render: (d) => <SafetyScore score={d.safety_score} />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (d) => <StatusBadge status={d.status} />,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900 dark:text-paper-50">
            Drivers & Safety Profiles
          </h1>
          <p className="text-sm text-ink-400 mt-0.5">
            {drivers.length} driver{drivers.length === 1 ? "" : "s"} on record
            {expiredCount > 0 && (
              <span className="text-alert-600 dark:text-alert-400 font-medium">
                {" "}· {expiredCount} license{expiredCount === 1 ? "" : "s"} expired
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download} loading={exporting} onClick={handleExportCsv}>
            Export CSV
          </Button>
          {canManageDrivers && (
            <Button icon={Plus} onClick={() => setShowForm(true)}>
              Add Driver
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
            placeholder="Search name / license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-ink-200 dark:border-ink-700 bg-paper-50 dark:bg-ink-950 pl-9 pr-3 py-2 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 focus:border-signal-300 focus:ring-2 focus:ring-signal-300/30 outline-none"
          />
        </div>
        <SelectField
          wrapperClassName="mb-0 w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All</option>
          <option>Available</option>
          <option>On Trip</option>
          <option>Off Duty</option>
          <option>Suspended</option>
        </SelectField>
        <SelectField
          wrapperClassName="mb-0 w-32"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option>All</option>
          <option>LMV</option>
          <option>HMV</option>
        </SelectField>
      </div>

      <Table
        columns={columns}
        rows={sorted}
        rowKey={(d) => d.id}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
        emptyTitle="No drivers match your filters"
        emptyDescription="Try clearing the search or filters above."
      />

      <div className="flex items-start gap-2 mt-3 text-xs text-ink-400">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />
        <p>Rule: expired license or Suspended status blocks a driver from trip assignment.</p>
      </div>

      <Modal
        open={showForm && canManageDrivers}
        onClose={() => {
          setShowForm(false);
          setFormError("");
          setFieldErrors({});
        }}
        title="Add Driver"
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
            <Button type="submit" form="add-driver-form" loading={submitting}>
              Add Driver
            </Button>
          </>
        }
      >
        <form id="add-driver-form" onSubmit={handleAddDriver}>
          <Alert variant="error">{formError}</Alert>

          <TextField
            label="Name"
            required
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              clearFieldError("name");
            }}
            error={fieldErrors.name}
          />

          <TextField
            label="License Number"
            required
            value={form.license_number}
            onChange={(e) => {
              setForm({ ...form, license_number: e.target.value });
              clearFieldError("license_number");
            }}
            error={fieldErrors.license_number}
          />

          <SelectField
            label="License Category"
            value={form.license_category}
            onChange={(e) => setForm({ ...form, license_category: e.target.value })}
          >
            <option>LMV</option>
            <option>HMV</option>
          </SelectField>

          <TextField
            label="License Expiry Date"
            required
            type="date"
            value={form.license_expiry_date}
            onChange={(e) => {
              setForm({ ...form, license_expiry_date: e.target.value });
              clearFieldError("license_expiry_date");
            }}
            error={fieldErrors.license_expiry_date}
          />

          <TextField
            label="Contact Number"
            required
            value={form.contact_number}
            onChange={(e) => {
              setForm({ ...form, contact_number: e.target.value });
              clearFieldError("contact_number");
            }}
            error={fieldErrors.contact_number}
            wrapperClassName="mb-0"
          />
        </form>
      </Modal>
    </div>
  );
}