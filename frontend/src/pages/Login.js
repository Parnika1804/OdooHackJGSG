import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import AuthBrandPanel from "../components/AuthBrandPanel";
import { TextField } from "../components/ui/FormField";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";

const roleRoutes = {
  "Fleet Manager": "/vehicles",
  Dispatcher: "/dashboard",
  "Safety Officer": "/drivers",
  "Financial Analyst": "/fuel-expenses",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errors = {};
    if (!email.trim()) errors.email = "Email is required";
    else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address";
    if (!password) errors.password = "Password is required";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });

      const { access_token, user } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("name", user.name);

      navigate(roleRoutes[user.role] || "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-paper-100 dark:bg-ink-950">
      <AuthBrandPanel />

      <div className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm" noValidate>
          <h2 className="font-display text-xl font-bold text-ink-900 dark:text-paper-50">
            Sign in to your account
          </h2>
          <p className="text-sm text-ink-400 mb-5">Enter your credentials to continue</p>

          <Alert variant="error">{error}</Alert>

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
            }}
            placeholder="you@transitops.io"
            required
            error={fieldErrors.email}
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
            }}
            placeholder="••••••••"
            required
            error={fieldErrors.password}
            wrapperClassName="mb-0"
          />

          <div className="flex justify-between items-center mt-4 mb-1 text-sm">
            <label className="flex items-center gap-2 text-ink-500 dark:text-ink-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-signal-400"
              />
              Remember me
            </label>
            <a href="#forgot" className="text-signal-600 dark:text-signal-300 font-medium hover:text-signal-500 dark:hover:text-signal-200 transition-colors">
              Forgot password?
            </a>
          </div>

          <Button type="submit" loading={submitting} className="w-full mt-4">
            Sign In
          </Button>

          <p className="text-sm text-ink-400 mt-4 text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-signal-600 dark:text-signal-300 font-medium hover:text-signal-500 dark:hover:text-signal-200 transition-colors">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}