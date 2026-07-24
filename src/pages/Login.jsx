import { useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import AuthLayout from "../components/AuthLayout";
import { setCredentials } from "../store/authSlice";
import { useWebSocket } from "../context/WebSocketContext";
import {
  MailIcon,
  UserIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertIcon,
} from "../components/icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;
// Mirrors the server's validateName/validateAge: it rejects anything outside
// this set, so catch it here rather than round-tripping to a raw API error.
const NAME_RE = /^[a-zA-Z\s'-]+$/;
const MIN_AGE = 12;
const MAX_AGE = 120;

const META = {
  login: { title: "Sign In" },
  register: { title: "Create Account" },
  // The server mails a code and only issues a session once it's confirmed.
  otp: { title: "Подтвердите почту" },
};

const emptyForm = {
  firstName: "",
  lastName: "",
  age: "",
  email: "",
  password: "",
};

// Shared styling for the glass field wrapper + inner <input>.
const INPUT_CLASS =
  "w-full bg-transparent text-[15px] text-[#e4e1ee] placeholder:text-[#8b88a0] outline-none";

function FieldShell({ icon, children }) {
  return (
    <div className="flex h-[52px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 transition-colors focus-within:border-[#9db0f7]/70 focus-within:bg-white/[0.06]">
      {icon && <span className="shrink-0 text-[#a99ff0]">{icon}</span>}
      {children}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const { status, register, login, verifyOtp, resendOtp } = useWebSocket();

  // "Добавить аккаунт": reached while already signed in, so the usual bounce
  // back to the chat has to be skipped. A success here adds to the stored list
  // and switches to it — the previous account's token is left untouched.
  const addMode = params.get("add") === "1" && isAuthenticated;

  const [mode, setMode] = useState("login"); // login | register | otp
  const [form, setForm] = useState(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  // Set when the server asks for an emailed code — either after registering or
  // when signing in to an account that never finished verifying.
  const [otpEmail, setOtpEmail] = useState("");
  const [code, setCode] = useState("");

  const from = location.state?.from?.pathname || "/";
  const offline = status !== "open";
  const meta = META[mode];

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (error) setError("");
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setNotice("");
    setShowPass(false);
  };

  const goToOtp = (email, message) => {
    setOtpEmail(email);
    setCode("");
    setError("");
    setNotice(message);
    setMode("otp");
  };

  const finish = (res) => {
    dispatch(setCredentials({ user: res.user, token: res.token }));
    navigate(from, { replace: true });
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{4,8}$/.test(code.trim())) return setError("Введите код из письма");
    setLoading(true);
    const res = await verifyOtp(otpEmail, code.trim());
    setLoading(false);
    if (!res.ok) return setError(res.error || "Не удалось подтвердить код");
    finish(res);
  };

  const resend = async () => {
    setError("");
    setLoading(true);
    const res = await resendOtp(otpEmail);
    setLoading(false);
    setNotice(res.ok ? "Новый код отправлен" : "");
    if (!res.ok) setError(res.error || "Не удалось отправить код");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const email = form.email.trim();
    const password = form.password;
    if (!EMAIL_RE.test(email)) return setError("Enter a valid email address");
    if (password.length < MIN_PASSWORD) {
      return setError(`Password must be at least ${MIN_PASSWORD} characters`);
    }

    if (mode === "login") {
      setLoading(true);
      const res = await login(email, password);
      setLoading(false);
      if (res.needsOtp) {
        return goToOtp(res.email || email, "Аккаунт не подтверждён — введите код из письма");
      }
      if (!res.ok) return setError(res.error || "Could not sign in");
      return finish(res);
    }

    // register
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const age = Number(form.age);
    if (!firstName || !lastName) return setError("First and last name are required");
    if (!NAME_RE.test(firstName) || !NAME_RE.test(lastName)) {
      return setError("Имя и фамилия — только латиницей (ограничение сервера)");
    }
    if (!Number.isFinite(age) || age < MIN_AGE || age > MAX_AGE) {
      return setError(`Enter a valid age (${MIN_AGE}–${MAX_AGE})`);
    }
    setLoading(true);
    const res = await register({ firstName, lastName, age, email, password });
    setLoading(false);
    if (!res.ok) return setError(res.error || "Could not create your account");
    finish(res);
  };

  if (isAuthenticated && !addMode) return <Navigate to={from} replace />;

  return (
    <AuthLayout
      title={meta.title}
      subtitle={addMode ? "Добавление ещё одного аккаунта" : undefined}
    >
      {offline && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#e4e1ee]"
        >
          <span className="loading loading-spinner loading-xs" />
          <span>Connecting to the server…</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-xl border border-[#ff5d6c]/30 bg-[#ff5d6c]/10 px-4 py-3 text-sm text-[#ffb4ab]"
        >
          <AlertIcon className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && !error && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#c7c4d8]">
          {notice}
        </div>
      )}

      {/* key={mode} remounts the block so switching login/register/otp pops in smoothly */}
      <div key={mode} className="so-pop">
      {mode === "otp" ? (
        <form onSubmit={submitOtp} noValidate className="space-y-4">
          <FieldShell icon={<LockIcon className="h-5 w-5" />}>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Код из письма"
              aria-label="Код из письма"
              className={`${INPUT_CLASS} tracking-[0.3em]`}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 8));
                if (error) setError("");
              }}
              required
              autoFocus
            />
          </FieldShell>

          <button
            type="submit"
            disabled={loading || offline}
            aria-busy={loading}
            className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-[#1a1730] transition-[transform,opacity] duration-150 hover:brightness-[1.03] active:scale-[.99] disabled:pointer-events-none disabled:opacity-60"
            style={{
              background: "linear-gradient(100deg, #8fe3f5 0%, #c3b4f5 100%)",
              boxShadow: "0 8px 30px -6px rgba(150,180,255,.55)",
            }}
          >
            {loading && <span className="loading loading-spinner loading-sm" />}
            {loading ? "Проверяем…" : "Подтвердить"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={resend}
              disabled={loading}
              className="font-medium text-[#c3b4f5] transition-colors hover:text-[#d8ccff] disabled:opacity-50"
            >
              Отправить код ещё раз
            </button>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="font-medium text-[#8b88a0] transition-colors hover:text-[#e4e1ee]"
            >
              Назад
            </button>
          </div>
        </form>
      ) : (
      <form onSubmit={submit} noValidate className="space-y-4">
        {mode === "register" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FieldShell icon={<UserIcon className="h-5 w-5" />}>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="First name"
                  aria-label="First name"
                  className={INPUT_CLASS}
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  required
                  autoFocus
                />
              </FieldShell>
              <FieldShell icon={<UserIcon className="h-5 w-5" />}>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Last name"
                  aria-label="Last name"
                  className={INPUT_CLASS}
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  required
                />
              </FieldShell>
            </div>
            <FieldShell>
              <input
                id="age"
                type="number"
                inputMode="numeric"
                min={12}
                max={120}
                placeholder="Age"
                aria-label="Age"
                className={INPUT_CLASS}
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                required
              />
            </FieldShell>
          </>
        )}

        <FieldShell icon={<MailIcon className="h-5 w-5" />}>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Email"
            aria-label="Email"
            className={INPUT_CLASS}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
            autoFocus={mode === "login"}
          />
        </FieldShell>

        <FieldShell icon={<LockIcon className="h-5 w-5" />}>
          <input
            id="password"
            type={showPass ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="Password"
            aria-label="Password"
            className={INPUT_CLASS}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            required
            minLength={MIN_PASSWORD}
          />
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            className="shrink-0 text-[#8b88a0] transition-colors hover:text-[#e4e1ee]"
            aria-label={showPass ? "Hide password" : "Show password"}
          >
            {showPass ? (
              <EyeIcon className="h-5 w-5" />
            ) : (
              <EyeOffIcon className="h-5 w-5" />
            )}
          </button>
        </FieldShell>

        <button
          type="submit"
          disabled={loading || offline}
          aria-busy={loading}
          className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-[#1a1730] transition-[transform,opacity] duration-150 hover:brightness-[1.03] active:scale-[.99] disabled:pointer-events-none disabled:opacity-60"
          style={{
            background: "linear-gradient(100deg, #8fe3f5 0%, #c3b4f5 100%)",
            boxShadow: "0 8px 30px -6px rgba(150,180,255,.55)",
          }}
        >
          {loading && <span className="loading loading-spinner loading-sm" />}
          {loading
            ? mode === "login"
              ? "Signing in…"
              : "Creating account…"
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>
      )}

      {mode !== "otp" && (
      <p className="mt-6 text-center text-sm text-[#c7c4d8]">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="font-medium text-[#c3b4f5] transition-colors hover:text-[#d8ccff]"
              onClick={() => switchMode("register")}
            >
              Register now
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="font-medium text-[#c3b4f5] transition-colors hover:text-[#d8ccff]"
              onClick={() => switchMode("login")}
            >
              Log in
            </button>
          </>
        )}
      </p>
      )}
      </div>

      {addMode && (
        <p className="mt-3 text-center text-sm">
          <button
            type="button"
            className="font-medium text-[#8b88a0] transition-colors hover:text-[#e4e1ee]"
            onClick={() => navigate("/", { replace: true })}
          >
            Отмена
          </button>
        </p>
      )}
    </AuthLayout>
  );
}
