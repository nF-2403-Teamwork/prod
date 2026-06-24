import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Home() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center">
      <span className="badge badge-primary badge-outline mb-4">React · Redux · Router</span>
      <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
        WebSocket App Frontend
      </h1>
      <p className="mt-4 max-w-xl text-base-content/70">
        Vite + React with Tailwind &amp; DaisyUI, a React Router v6 router, and a
        Redux store persisted to local storage.
      </p>

      {isAuthenticated ? (
        <div className="mt-8 w-full max-w-md">
          <div className="alert alert-success">
            <span>
              Signed in as{" "}
              <strong>{user?.name || user?.email}</strong>. Your session is
              persisted across reloads.
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/login" className="btn btn-primary">
            Sign in
          </Link>
          <Link to="/register" className="btn btn-outline">
            Create account
          </Link>
        </div>
      )}
    </section>
  );
}
