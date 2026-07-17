import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import socket from "../socket/socket";

const initialForm = {
  firstName: "",
  lastName: "",
  age: "",
  email: "",
  password: "",
  confirm: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.on("register_response", (data) => {
      setLoading(false);
      if (data.success) {
        setStatus({ type: "success", message: data.message });
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setStatus({ type: "error", message: data.message });
      }
    });
    return () => socket.off("register_response");
  }, [navigate]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus(null);

    const { firstName, lastName, age, email, password, confirm } = form;

    if (!firstName.trim() || !lastName.trim() || !age || !email.trim() || !password) {
      return setStatus({ type: "error", message: "Barcha maydonlarni to'ldiring!" });
    }
    if (Number(age) < 1 || Number(age) > 120) {
      return setStatus({ type: "error", message: "Yosh 1 dan 120 gacha bo'lishi kerak!" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setStatus({ type: "error", message: "Email formati noto'g'ri!" });
    }
    if (password.length < 6) {
      return setStatus({ type: "error", message: "Parol kamida 6 ta belgi bo'lishi kerak!" });
    }
    if (password !== confirm) {
      return setStatus({ type: "error", message: "Parollar mos kelmadi!" });
    }

    setLoading(true);
    socket.emit("register", {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: Number(age),
      email: email.trim(),
      password,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 py-8">
      <div className="card w-full max-w-lg bg-base-100 shadow-xl">
        <div className="card-body gap-4">
          <h2 className="card-title text-2xl font-bold justify-center">
            Ro'yxatdan o'tish
          </h2>

          {status && (
            <div className={`alert ${status.type === "success" ? "alert-success" : "alert-error"}`}>
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Ism</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Ismingiz"
                  className="input input-bordered w-full"
                  autoComplete="given-name"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Familiya</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Familiyangiz"
                  className="input input-bordered w-full"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Yosh</span>
              </label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                placeholder="Yoshingiz"
                className="input input-bordered w-full"
                min={1}
                max={120}
              />
            </div>

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
                placeholder="Kamida 6 ta belgi"
                className="input input-bordered w-full"
                autoComplete="new-password"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Parolni tasdiqlash</span>
              </label>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Parolni qaytaring"
                className="input input-bordered w-full"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full mt-2 ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? "Yuklanmoqda..." : "Ro'yxatdan o'tish"}
            </button>
          </form>

          <p className="text-center text-sm mt-2">
            Hisobingiz bormi?{" "}
            <Link to="/login" className="link link-primary font-semibold">
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
