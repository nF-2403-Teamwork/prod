import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center bg-base-200 px-4 text-center">
      <p className="text-7xl font-black text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold text-base-content">Page not found</h1>
      <p className="mt-2 max-w-md text-base-content/70">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link to="/" className="btn btn-primary mt-8">
        Back to home
      </Link>
    </section>
  );
}
