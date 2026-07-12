import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { canManage } from "../permissions";

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

  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showFuelForm, setShowFuelForm] = useState(false);
  const [fuelForm, setFuelForm] = useState(emptyFuelForm);
  const [fuelFormError, setFuelFormError] = useState("");
  const [savingFuel, setSavingFuel] = useState(false);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [expenseFormError, setExpenseFormError] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);

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
  }, []);

  const vehicleById = (id) => vehicles.find((v) => v.id === id);

  // ---------- Fuel log form ----------
  const canSubmitFuel =
    fuelForm.vehicleId && Number(fuelForm.liters) > 0 && Number(fuelForm.cost) >= 0 && fuelForm.logDate;

  const handleLogFuel = async (e) => {
    e.preventDefault();
    if (!canSubmitFuel) return;
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
      setShowFuelForm(false);
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
    if (!canSubmitExpense) return;
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
      setShowExpenseForm(false);
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

  return (
    <div className="p-6 bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 min-h-screen">
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-xl font-bold">Fuel & Expense Management</h1>
        {canManageFuel && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowFuelForm(true)}
              className="bg-accent text-black font-semibold px-4 py-2 rounded text-sm hover:opacity-90"
            >
              + Log Fuel
            </button>
            <button
              onClick={() => setShowExpenseForm(true)}
              className="bg-accent text-black font-semibold px-4 py-2 rounded text-sm hover:opacity-90"
            >
              + Add Expense
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 dark:text-neutral-600 mb-5">
        Live fuel and expense data from the API.
      </p>

      {!canManageFuel && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm px-3 py-2 rounded mb-4">
          Your role has view-only access to Fuel & Expenses. Only Financial Analyst can log fuel or add expenses.
        </div>
      )}

      {loadError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-4">
          {loadError}
        </div>
      )}

      {loading && <p className="text-sm text-gray-400">Loading...</p>}

      {!loading && (
        <>
          {/* Fuel Logs */}
          <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 mb-2">FUEL LOGS</h2>
          <table className="w-full text-sm border-collapse mb-6">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-400">
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Liters</th>
                <th className="py-2 pr-4">Cost</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.map((f) => {
                const vehicle = vehicleById(f.vehicle_id);
                return (
                  <tr key={f.id} className="border-b border-gray-100 dark:border-neutral-900">
                    <td className="py-2 pr-4">{vehicle ? vehicle.name : `#${f.vehicle_id}`}</td>
                    <td className="py-2 pr-4">{f.log_date}</td>
                    <td className="py-2 pr-4">{f.liters} L</td>
                    <td className="py-2 pr-4">₹{Number(f.cost).toLocaleString()}</td>
                  </tr>
                );
              })}
              {fuelLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400 dark:text-neutral-600">
                    No fuel logs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Other Expenses */}
          <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 mb-2">
            OTHER EXPENSES (TOLL / MISC)
          </h2>
          <table className="w-full text-sm border-collapse mb-6">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-400">
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => {
                const vehicle = vehicleById(exp.vehicle_id);
                return (
                  <tr key={exp.id} className="border-b border-gray-100 dark:border-neutral-900">
                    <td className="py-2 pr-4">{vehicle ? vehicle.name : `#${exp.vehicle_id}`}</td>
                    <td className="py-2 pr-4">{exp.expense_type}</td>
                    <td className="py-2 pr-4">{exp.expense_date}</td>
                    <td className="py-2 pr-4">₹{Number(exp.amount).toLocaleString()}</td>
                  </tr>
                );
              })}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400 dark:text-neutral-600">
                    No other expenses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Total Operational Cost */}
          <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 mb-2">
            TOTAL OPERATIONAL COST (FUEL + MAINTENANCE + EXPENSES)
          </h2>
          <div className="border border-gray-200 dark:border-neutral-800 rounded-lg p-4 max-w-md">
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Select Vehicle</label>
            <select
              value={costVehicleId}
              onChange={handleCostVehicleChange}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm mb-3"
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            {costLoading && <p className="text-sm text-gray-400">Loading...</p>}
            {costError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded">
                {costError}
              </div>
            )}

            {costData && !costLoading && (
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-neutral-400">Fuel cost</span>
                  <span>₹{costData.fuel_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-neutral-400">Maintenance cost</span>
                  <span>₹{costData.maintenance_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-neutral-400">Other expenses</span>
                  <span>₹{costData.other_expenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-neutral-800 pt-2 mt-2">
                  <span>Total Operational Cost</span>
                  <span>₹{costData.total_operational_cost.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Log Fuel modal */}
      {showFuelForm && canManageFuel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleLogFuel}
            className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-96 shadow-xl"
          >
            <h2 className="text-lg font-bold mb-4">Log Fuel</h2>

            {fuelFormError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
                {fuelFormError}
              </div>
            )}

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Vehicle</label>
            <select
              required
              value={fuelForm.vehicleId}
              onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Liters</label>
            <input
              required
              type="number"
              value={fuelForm.liters}
              onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Cost</label>
            <input
              required
              type="number"
              value={fuelForm.cost}
              onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Date</label>
            <input
              required
              type="date"
              value={fuelForm.logDate}
              onChange={(e) => setFuelForm({ ...fuelForm, logDate: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-4"
            />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowFuelForm(false); setFuelFormError(""); }}
                className="px-4 py-2 rounded text-sm border border-gray-300 dark:border-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingFuel}
                className="px-4 py-2 rounded text-sm bg-accent text-black font-semibold hover:opacity-90 disabled:opacity-40"
              >
                {savingFuel ? "Saving..." : "Log Fuel"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Expense modal */}
      {showExpenseForm && canManageFuel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleAddExpense}
            className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-96 shadow-xl"
          >
            <h2 className="text-lg font-bold mb-4">Add Expense</h2>

            {expenseFormError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
                {expenseFormError}
              </div>
            )}

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Vehicle</label>
            <select
              required
              value={expenseForm.vehicleId}
              onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Expense Type</label>
            <input
              required
              value={expenseForm.expenseType}
              onChange={(e) => setExpenseForm({ ...expenseForm, expenseType: e.target.value })}
              placeholder="Toll"
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Amount</label>
            <input
              required
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-3"
            />

            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Date</label>
            <input
              required
              type="date"
              value={expenseForm.expenseDate}
              onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded px-3 py-2 text-sm mb-4"
            />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowExpenseForm(false); setExpenseFormError(""); }}
                className="px-4 py-2 rounded text-sm border border-gray-300 dark:border-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingExpense}
                className="px-4 py-2 rounded text-sm bg-accent text-black font-semibold hover:opacity-90 disabled:opacity-40"
              >
                {savingExpense ? "Saving..." : "Add Expense"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}