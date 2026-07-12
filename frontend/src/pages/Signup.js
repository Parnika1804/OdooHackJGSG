import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

const ROLES = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];

const roleRoutes = {
  "Fleet Manager": "/vehicles",
  Dispatcher: "/dashboard",
  "Safety Officer": "/drivers",
  "Financial Analyst": "/fuel-expenses",
};

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/signup`, {
        name,
        email,
        password,
        role,
      });

      const { access_token, user } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("name", user.name);

      navigate(roleRoutes[user.role] || "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-neutral-100 dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 p-10 flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-md bg-neutral-400 dark:bg-neutral-700 mb-3" />
          <h2 className="text-xl font-bold">TransitOps</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            Smart Transport Operations Platform
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">One login, four roles:</h4>
          <ul className="text-sm space-y-1 list-disc list-inside">
            {ROLES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-gray-400 dark:text-neutral-600">
          TRANSITOPS © 2026 · RBAC ENABLED
        </p>
      </div>

      <div className="flex-1 bg-white dark:bg-neutral-950 flex items-center justify-center">
        <form onSubmit={handleSubmit} className="w-80">
          <h2 className="text-xl font-bold text-gray-900 dark:text-neutral-100">
            Create your account
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mb-5">
            Sign up and pick your role to get started
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
              {error}
            </div>
          )}

          <label className="block text-sm text-gray-600 dark:text-neutral-300 mt-3 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ravan K."
            required
            className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 rounded px-3 py-2 text-sm"
          />

          <label className="block text-sm text-gray-600 dark:text-neutral-300 mt-3 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@transitops.io"
            required
            className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 rounded px-3 py-2 text-sm"
          />

          <label className="block text-sm text-gray-600 dark:text-neutral-300 mt-3 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 rounded px-3 py-2 text-sm"
          />

          <label className="block text-sm text-gray-600 dark:text-neutral-300 mt-3 mb-1">
            Role (RBAC)
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 rounded px-3 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-5 bg-accent text-black font-semibold rounded py-2.5 text-sm hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-4 text-center">
            Already have an account?{" "}
            <Link to="/" className="text-accent font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
