import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import AuthLayout from "../components/AuthLayout";
import { setCredentials } from "../store/authSlice";
import {
  UserIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertIcon,
} from "../components/icons";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // After all hooks — Rules of Hooks.
  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!emailRe.test(form.email)) next.email = "Enter a valid email address";
    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 8)
      next.password = "Password must be at least 8 characters";
    if (!form.confirm) next.confirm = "Please confirm your password";
    else if (form.confirm !== form.password)
      next.confirm = "Passwords do not match";
    return next;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setLoading(true);
    setSubmitError("");
    try {
      // TODO: replace with a real registration request
      await new Promise((resolve) => setTimeout(resolve, 900));
      dispatch(
        setCredentials({
          user: { name: form.name, email: form.email },
          token: "demo-token",
        }),
      );
      navigate("/chat", { replace: true });
    } catch (err) {
      setSubmitError("Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start using the app in less than a minute"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="link link-primary font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {submitError && (
          <div role="alert" className="alert alert-error text-sm">
            <AlertIcon className="h-5 w-5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Full name */}
        <div className="form-control">
          <label className="label" htmlFor="name">
            <span className="label-text font-medium">
              Full name <span className="text-error">*</span>
            </span>
          </label>
          <label
            className={`input input-bordered flex items-center gap-2 ${
              errors.name ? "input-error" : ""
            }`}
          >
            <UserIcon className="h-4 w-4 opacity-60" />
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              className="grow"
              value={form.name}
              onChange={handleChange}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              required
            />
          </label>
          {errors.name && (
            <p id="name-error" role="alert" className="mt-1 text-sm text-error">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="form-control">
          <label className="label" htmlFor="email">
            <span className="label-text font-medium">
              Email <span className="text-error">*</span>
            </span>
          </label>
          <label
            className={`input input-bordered flex items-center gap-2 ${
              errors.email ? "input-error" : ""
            }`}
          >
            <MailIcon className="h-4 w-4 opacity-60" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="grow"
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              required
            />
          </label>
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1 text-sm text-error">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="form-control">
          <label className="label" htmlFor="password">
            <span className="label-text font-medium">
              Password <span className="text-error">*</span>
            </span>
          </label>
          <label
            className={`input input-bordered flex items-center gap-2 ${
              errors.password ? "input-error" : ""
            }`}
          >
            <LockIcon className="h-4 w-4 opacity-60" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="grow"
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "password-error" : "password-hint"
              }
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="opacity-60 transition hover:opacity-100"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </label>
          {errors.password ? (
            <p id="password-error" role="alert" className="mt-1 text-sm text-error">
              {errors.password}
            </p>
          ) : (
            <p id="password-hint" className="mt-1 text-xs text-base-content/60">
              Use 8 or more characters.
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="form-control">
          <label className="label" htmlFor="confirm">
            <span className="label-text font-medium">
              Confirm password <span className="text-error">*</span>
            </span>
          </label>
          <label
            className={`input input-bordered flex items-center gap-2 ${
              errors.confirm ? "input-error" : ""
            }`}
          >
            <LockIcon className="h-4 w-4 opacity-60" />
            <input
              id="confirm"
              name="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="grow"
              value={form.confirm}
              onChange={handleChange}
              aria-invalid={Boolean(errors.confirm)}
              aria-describedby={errors.confirm ? "confirm-error" : undefined}
              required
            />
          </label>
          {errors.confirm && (
            <p id="confirm-error" role="alert" className="mt-1 text-sm text-error">
              {errors.confirm}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary mt-2 w-full"
          disabled={loading}
          aria-busy={loading}
        >
          {loading && <span className="loading loading-spinner loading-sm" />}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
