import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import socket from "../socket/socket";
import { loginSuccess } from "../store/authSlice";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.on("login_response", (data) => {
      setLoading(false);
      if (data.success) {
        setStatus({ type: "success", message: data.message });
        dispatch(loginSuccess(data.user));
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setStatus({ type: "error", message: data.message });
      }
    });
    return () => socket.off("login_response");
  }, [navigate, dispatch]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus(null);
    if (!form.email.trim() || !form.password.trim()) {
      return setStatus({ type: "error", message: "Barcha maydonlarni to'ldiring!" });
    }
    setLoading(true);
    socket.emit("login", { email: form.email.trim(), password: form.password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body gap-4">
          <h2 className="card-title text-2xl font-bold justify-center">
            Tizimga kirish
          </h2>

          {status && (
            <div className={`alert ${status.type === "success" ? "alert-success" : "alert-error"}`}>
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="input input-bordered w-full"
                autoComplete="email"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Parol</span>
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Parol kiriting"
                className="input input-bordered w-full"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full mt-2 ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? "Tekshirilmoqda..." : "Kirish"}
            </button>
          </form>

          <p className="text-center text-sm mt-2">
            Hisobingiz yo'qmi?{" "}
            <Link to="/register" className="link link-primary font-semibold">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
