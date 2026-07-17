import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center gap-4 text-center">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-16">
              <span className="text-2xl font-bold">{initials}</span>
            </div>
          </div>
          <h2 className="card-title text-2xl">Xush kelibsiz!</h2>
          <p className="text-base-content/70 text-lg font-semibold text-primary">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-base-content/50 text-sm">{user?.email}</p>
          <div className="badge badge-success gap-1 py-3 px-4">
            Kirish muvaffaqiyatli
          </div>
          <button onClick={handleLogout} className="btn btn-outline btn-error w-full mt-2">
            Chiqish
          </button>
        </div>
      </div>
    </div>
  );
}
