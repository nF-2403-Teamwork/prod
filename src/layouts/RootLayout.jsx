import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import { logout } from "../store/authSlice";
import { BoltIcon } from "../components/icons";

export default function RootLayout() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `btn btn-ghost btn-sm ${isActive ? "btn-active" : ""}`;

  return (
    <div className="flex min-h-dvh flex-col bg-base-200">
      <header className="navbar border-b border-base-300 bg-base-100 px-4">
        <div className="flex-1">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-content">
              <BoltIcon className="h-4 w-4" />
            </span>
            WebSocket App
          </Link>
        </div>

        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/chat" className={navLinkClass}>
                Live
              </NavLink>
              <span className="hidden px-2 text-sm text-base-content/70 sm:inline">
                {user?.name || user?.email}
              </span>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Sign in
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
