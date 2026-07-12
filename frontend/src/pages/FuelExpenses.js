import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Fuel, Receipt, Calculator } from "lucide-react";
import { API_URL } from "../config";
import { canManage } from "../permissions";
import { useToast } from "../components/ui/Toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import Alert from "../components/ui/Alert";
import Skeleton from "../components/ui/Skeleton";
import { TextField, SelectField } from "../components/ui/FormField";

const emptyFuelForm = {
  vehicleId: "",
  liters: "",
  cost: "",
  logDate: "",
};

const emptyExpenseForm = {
  vehicleId: "",
  expenseType: "",
  amount: "",
  expenseDate: "",
};

export default function FuelExpenses() {
  const role = localStorage.getItem("role");
  const canManageFuel = canManage("fuelExpenses", role);
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showFuelForm, setShowFuelForm] = useState(false);
  const [fuelForm, setFuelForm] = useState(emptyFuelForm);
  const [fuelFormError, setFuelFormError] = useState("");
  const [fuelFieldErrors, setFuelFieldErrors] = useState({});
  const [savingFuel, setSavingFuel] = useState(false);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [expenseFormError, setExpenseFormError] = useState("");
  const [expenseFieldErrors, setExpenseFieldErrors] = useState({});
  const [savingExpense, setSavingExpense] = useState(false);

  const clearFuelFieldError = (field) => {
    if (fuelFieldErrors[field]) setFuelFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };
  const clearExpenseFieldError = (field) => {
    if (expenseFieldErrors[field]) setExpenseFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateFuelForm = () => {
    const errors = {};
    if (!fuelForm.vehicleId) errors.vehicleId = "Select a vehicle";
    if (!fuelForm.liters || Number(fuelForm.liters) <= 0) errors.liters = "Enter liters greater than 0";
    if (fuelForm.cost === "" || Number(fuelForm.cost) < 0) errors.cost = "Enter a valid cost";
    if (!fuelForm.logDate) errors.logDate = "Date is required";
    return errors;
  };

  const validateExpenseForm = () => {
    const errors = {};
    if (!expenseForm.vehicleId) errors.vehicleId = "Select a vehicle";
    if (!expenseForm.expenseType.trim()) errors.expenseType = "Expense type is required";
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) errors.amount = "Enter an amount greater than 0";
    if (!expenseForm.expenseDate) errors.expenseDate = "Date is required";
    return errors;
  };

  const [costVehicleId, setCostVehicleId] = useState("");
  const [costData, setCostData] = useState(null);
  const [costLoading, setCostLoading] = useState(false);
  const [costError, setCostError] = useState("");

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchAll = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [vehiclesRes, fuelRes, expensesRes] = await Promise.all([
        axios.get(`${API_URL}/vehicles`, authHeaders()),
        axios.get(`${API_URL}/fuel-logs`, authHeaders()),
        axios.get(`${API_URL}/expenses`, authHeaders()),
      ]);
      setVehicles(vehiclesRes.data.vehicles);
      setFuelLogs(fuelRes.data.fuel_logs);
      setExpenses(expensesRes.data.expenses);
    } catch (err) {
      setLoadError(err.response?.data?.detail || "Failed to load fuel & expense data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vehicleById = (id) => vehicles.find((v) => v.id === id);
  const vehicleOptions = () =>
    vehicles.map((v) => (
      <option key={v.id} value={v.id}>
        {v.name}
      </option>
    ));

  // ---------- Fuel log form ----------
  const canSubmitFuel =
    fuelForm.vehicleId && Number(fuelForm.liters) > 0 && Number(fuelForm.cost) >= 0 && fuelForm.logDate;

  const handleLogFuel = async (e) => {
    e.preventDefault();
    const errors = validateFuelForm();
    setFuelFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSavingFuel(true);
    setFuelFormError("");
    try {
      await axios.post(
        `${API_URL}/fuel-logs`,
        {
          vehicle_id: Number(fuelForm.vehicleId),
          liters: Number(fuelForm.liters),
          cost: Number(fuelForm.cost),
          log_date: fuelForm.logDate,
        },
        authHeaders()
      );
      setFuelForm(emptyFuelForm);
      setFuelFieldErrors({});
      setShowFuelForm(false);
      showToast("Fuel entry logged");
      fetchAll();
    } catch (err) {
      setFuelFormError(err.response?.data?.detail || "Failed to log fuel entry");
    } finally {
      setSavingFuel(false);
    }
  };

  // ---------- Expense form ----------
  const canSubmitExpense =
    expenseForm.vehicleId &&
    expenseForm.expenseType.trim() &&
    Number(expenseForm.amount) > 0 &&
    expenseForm.expenseDate;

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const errors = validateExpenseForm();
    setExpenseFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSavingExpense(true);
    setExpenseFormError("");
    try {
      await axios.post(
        `${API_URL}/expenses`,
        {
          vehicle_id: Number(expenseForm.vehicleId),
          expense_type: expenseForm.expenseType,
          amount: Number(expenseForm.amount),
          expense_date: expenseForm.expenseDate,
        },
        authHeaders()
      );
      setExpenseForm(emptyExpenseForm);
      setExpenseFieldErrors({});
      setShowExpenseForm(false);
      showToast("Expense added");
      fetchAll();
    } catch (err) {
      setExpenseFormError(err.response?.data?.detail || "Failed to add expense");
    } finally {
      setSavingExpense(false);
    }
  };

  // ---------- Total operational cost ----------
  const fetchOperationalCost = async (vehicleId) => {
    if (!vehicleId) {
      setCostData(null);
      return;
    }
    setCostLoading(true);
    setCostError("");
    try {
      const res = await axios.get(`${API_URL}/vehicles/${vehicleId}/operational-cost`, authHeaders());
      setCostData(res.data);
    } catch (err) {
      setCostError(err.response?.data?.detail || "Failed to load operational cost");
      setCostData(null);
    } finally {
      setCostLoading(false);
    }
  };

  const handleCostVehicleChange = (e) => {
    const id = e.target.value;
    setCostVehicleId(id);
    fetchOperationalCost(id);
  };

  const fuelColumns = [
    {
      key: "vehicle_id",
      label: "Vehicle",
      render: (f) => {
        const vehicle = vehicleById(f.vehicle_id);
        return vehicle ? vehicle.name : `#${f.vehicle_id}`;
      },
    },
    { key: "log_date", label: "Date", numeric: true },
    { key: "liters", label: "Liters", numeric: true, render: (f) => `${f.liters} L` },
    { key: "cost", label: "Cost", numeric: true, render: (f) => `₹${Number(f.cost).toLocaleString()}` },
  ];

  const expenseColumns = [
    {
      key: "vehicle_id",
      label: "Vehicle",
      render: (exp) => {
        const vehicle = vehicleById(exp.vehicle_id);
        return vehicle ? vehicle.name : `#${exp.vehicle_id}`;
      },
    },
    { key: "expense_type", label: "Type" },
    { key: "expense_date", label: "Date", numeric: true },
    { key: "amount", label: "Amount", numeric: true, render: (exp) => `₹${Number(exp.amount).toLocaleString()}` },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-1">
        <h1 className="font-display text-xl font-bold text-ink-900 dark:text-paper-50">
          Fuel & Expense Management
        </h1>
        {canManageFuel && (
          <div className="flex gap-2">
            <Button icon={Fuel} onClick={() => setShowFuelForm(true)}>
              Log Fuel
            </Button>
            <Button variant="secondary" icon={Plus} onClick={() => setShowExpenseForm(true)}>
              Add Expense
            </Button>
          </div>
        )}
      </div>
      <p className="text-sm text-ink-400 mb-5">
        {fuelLogs.length} fuel log{fuelLogs.length === 1 ? "" : "s"} · {expenses.length} other expense
        {expenses.length === 1 ? "" : "s"}
      </p>

      {!canManageFuel && (
        <Alert variant="info">
          Your role has view-only access to Fuel & Expenses. Only Financial Analyst can log fuel or
          add expenses.
        </Alert>
      )}
      <Alert variant="error">{loadError}</Alert>

      {/* Fuel Logs */}
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-3">
        <Fuel size={15} />
        Fuel Logs
      </h2>
      <div className="mb-6">
        <Table
          columns={fuelColumns}
          rows={fuelLogs}
          rowKey={(f) => f.id}
          loading={loading}
          emptyTitle="No fuel logs yet"
        />
      </div>

      {/* Other Expenses */}
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-3">
        <Receipt size={15} />
        Other Expenses (Toll / Misc)
      </h2>
      <div className="mb-6">
        <Table
          columns={expenseColumns}
          rows={expenses}
          rowKey={(exp) => exp.id}
          loading={loading}
          emptyTitle="No other expenses yet"
        />
      </div>

      {/* Total Operational Cost */}
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-3">
        <Calculator size={15} />
        Total Operational Cost (Fuel + Maintenance + Expenses)
      </h2>
      <Card className="max-w-md">
        <SelectField
          label="Select Vehicle"
          value={costVehicleId}
          onChange={handleCostVehicleChange}
          wrapperClassName="mb-3"
        >
          <option value="">Select vehicle...</option>
          {vehicleOptions()}
        </SelectField>

        {costLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}
        <Alert variant="error">{costError}</Alert>

        {costData && !costLoading && (
          <div className="text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-ink-400">Fuel cost</span>
              <span className="font-data text-ink-700 dark:text-ink-200">
                ₹{costData.fuel_cost.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">Maintenance cost</span>
              <span className="font-data text-ink-700 dark:text-ink-200">
                ₹{costData.maintenance_cost.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">Other expenses</span>
              <span className="font-data text-ink-700 dark:text-ink-200">
                ₹{costData.other_expenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between font-semibold border-t border-ink-100 dark:border-ink-800 pt-2 mt-2 text-ink-900 dark:text-paper-50">
              <span>Total Operational Cost</span>
              <span className="font-data">₹{costData.total_operational_cost.toLocaleString()}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Log Fuel modal */}
      <Modal
        open={showFuelForm && canManageFuel}
        onClose={() => {
          setShowFuelForm(false);
          setFuelFormError("");
          setFuelFieldErrors({});
        }}
        title="Log Fuel"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowFuelForm(false);
                setFuelFormError("");
                setFuelFieldErrors({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="log-fuel-form" loading={savingFuel}>
              Log Fuel
            </Button>
          </>
        }
      >
        <form id="log-fuel-form" onSubmit={handleLogFuel}>
          <Alert variant="error">{fuelFormError}</Alert>

          <SelectField
            label="Vehicle"
            required
            value={fuelForm.vehicleId}
            onChange={(e) => {
              setFuelForm({ ...fuelForm, vehicleId: e.target.value });
              clearFuelFieldError("vehicleId");
            }}
            error={fuelFieldErrors.vehicleId}
          >
            <option value="">Select vehicle...</option>
            {vehicleOptions()}
          </SelectField>

          <TextField
            label="Liters"
            required
            type="number"
            value={fuelForm.liters}
            onChange={(e) => {
              setFuelForm({ ...fuelForm, liters: e.target.value });
              clearFuelFieldError("liters");
            }}
            error={fuelFieldErrors.liters}
          />

          <TextField
            label="Cost"
            required
            type="number"
            value={fuelForm.cost}
            onChange={(e) => {
              setFuelForm({ ...fuelForm, cost: e.target.value });
              clearFuelFieldError("cost");
            }}
            error={fuelFieldErrors.cost}
          />

          <TextField
            label="Date"
            required
            type="date"
            value={fuelForm.logDate}
            onChange={(e) => {
              setFuelForm({ ...fuelForm, logDate: e.target.value });
              clearFuelFieldError("logDate");
            }}
            error={fuelFieldErrors.logDate}
            wrapperClassName="mb-0"
          />
        </form>
      </Modal>

      {/* Add Expense modal */}
      <Modal
        open={showExpenseForm && canManageFuel}
        onClose={() => {
          setShowExpenseForm(false);
          setExpenseFormError("");
          setExpenseFieldErrors({});
        }}
        title="Add Expense"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowExpenseForm(false);
                setExpenseFormError("");
                setExpenseFieldErrors({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="add-expense-form" loading={savingExpense}>
              Add Expense
            </Button>
          </>
        }
      >
        <form id="add-expense-form" onSubmit={handleAddExpense}>
          <Alert variant="error">{expenseFormError}</Alert>

          <SelectField
            label="Vehicle"
            required
            value={expenseForm.vehicleId}
            onChange={(e) => {
              setExpenseForm({ ...expenseForm, vehicleId: e.target.value });
              clearExpenseFieldError("vehicleId");
            }}
            error={expenseFieldErrors.vehicleId}
          >
            <option value="">Select vehicle...</option>
            {vehicleOptions()}
          </SelectField>

          <TextField
            label="Expense Type"
            required
            placeholder="Toll"
            value={expenseForm.expenseType}
            onChange={(e) => {
              setExpenseForm({ ...expenseForm, expenseType: e.target.value });
              clearExpenseFieldError("expenseType");
            }}
            error={expenseFieldErrors.expenseType}
          />

          <TextField
            label="Amount"
            required
            type="number"
            value={expenseForm.amount}
            onChange={(e) => {
              setExpenseForm({ ...expenseForm, amount: e.target.value });
              clearExpenseFieldError("amount");
            }}
            error={expenseFieldErrors.amount}
          />

          <TextField
            label="Date"
            required
            type="date"
            value={expenseForm.expenseDate}
            onChange={(e) => {
              setExpenseForm({ ...expenseForm, expenseDate: e.target.value });
              clearExpenseFieldError("expenseDate");
            }}
            error={expenseFieldErrors.expenseDate}
            wrapperClassName="mb-0"
          />
        </form>
      </Modal>
    </div>
  );
}