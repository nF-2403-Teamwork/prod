import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import AuthLayout from "../components/AuthLayout";
import { setCredentials } from "../store/authSlice";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, AlertIcon } from "../components/icons";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const from = location.state?.from?.pathname || "/chat";

  // Already signed in? Skip the form. (After all hooks — Rules of Hooks.)
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = "Email is required";
    else if (!emailRe.test(form.email)) next.email = "Enter a valid email address";
    if (!form.password) next.password = "Password is required";
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
      // TODO: replace with a real authentication request
      await new Promise((resolve) => setTimeout(resolve, 800));
      dispatch(
        setCredentials({
          user: { email: form.email },
          token: "demo-token",
        }),
      );
      navigate(from, { replace: true });
    } catch (err) {
      setSubmitError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="link link-primary font-medium">
            Create one
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
          <div className="label">
            <label className="label-text font-medium" htmlFor="password">
              Password <span className="text-error">*</span>
            </label>
            <Link to="/login" className="label-text-alt link link-hover">
              Forgot password?
            </Link>
          </div>
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
              autoComplete="current-password"
              placeholder="Enter your password"
              className="grow"
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
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
          {errors.password && (
            <p id="password-error" role="alert" className="mt-1 text-sm text-error">
              {errors.password}
            </p>
          )}
        </div>

        <label className="label cursor-pointer justify-start gap-3 py-0">
          <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" />
          <span className="label-text">Remember me</span>
        </label>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
          aria-busy={loading}
        >
          {loading && <span className="loading loading-spinner loading-sm" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
