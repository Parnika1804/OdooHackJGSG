import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import AuthBrandPanel from "../components/AuthBrandPanel";
import { TextField, SelectField } from "../components/ui/FormField";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";

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
      const res = await axios.post(`${API_URL}/signup`, { name, email, password, role });

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
    <div className="flex min-h-screen bg-paper-100 dark:bg-ink-950">
      <AuthBrandPanel />

      <div className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="font-display text-xl font-bold text-ink-900 dark:text-paper-50">
            Create your account
          </h2>
          <p className="text-sm text-ink-400 mb-5">Sign up and pick your role to get started</p>

          <Alert variant="error">{error}</Alert>

          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ravan K."
            required
          />

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@transitops.io"
            required
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />

          <SelectField
            label="Role (RBAC)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            wrapperClassName="mb-0"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </SelectField>

          <Button type="submit" loading={submitting} className="w-full mt-5">
            Create Account
          </Button>

          <p className="text-sm text-ink-400 mt-4 text-center">
            Already have an account?{" "}
            <Link to="/" className="text-signal-600 dark:text-signal-300 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
