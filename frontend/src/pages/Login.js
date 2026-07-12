import { useState } from "react";

const roles = ["Dispatcher", "Fleet Manager", "Safety Officer", "Financial Analyst"];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roles[0]);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password, role, rememberMe });
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
            <li>Fleet Manager</li>
            <li>Dispatcher</li>
            <li>Safety Officer</li>
            <li>Financial Analyst</li>
          </ul>
        </div>

        <div className="text-sm text-gray-600 dark:text-neutral-400">
          <p className="mb-2">Access is scoped by role after login:</p>
          <ul className="space-y-1">
            <li>Fleet Manager → Fleet, Maintenance</li>
            <li>Dispatcher → Dashboard, Trips</li>
            <li>Safety Officer → Drivers, Compliance</li>
            <li>Financial Analyst → Fuel & Expenses, Analytics</li>
          </ul>
        </div>

        <p className="text-xs text-gray-400 dark:text-neutral-600">
          TRANSITOPS © 2026 · RBAC ENABLED
        </p>
      </div>

      <div className="flex-1 bg-white dark:bg-neutral-950 flex items-center justify-center">
        <form onSubmit={handleSubmit} className="w-80">
          <h2 className="text-xl font-bold text-gray-900 dark:text-neutral-100">
            Sign in to your account
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mb-5">
            Enter your credentials to continue
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded mb-3">
              {error}
            </div>
          )}

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
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <div className="flex justify-between items-center mt-4 text-sm">
            <label className="flex items-center gap-2 text-gray-600 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <a href="#forgot" className="text-accent">Forgot password?</a>
          </div>

          <button
            type="submit"
            className="w-full mt-5 bg-accent text-black font-semibold rounded py-2.5 text-sm hover:opacity-90"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}