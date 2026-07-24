import {
  useRouteError,
  isRouteErrorResponse,
  Link,
  useNavigate,
} from "react-router-dom";

import { AlertIcon } from "../components/icons";

// Rendered by the router via `errorElement` whenever a route throws
// (loader/action errors, render errors, or thrown Responses).
export default function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let heading = "Something went wrong";
  let message = "An unexpected error occurred. Please try again.";

  if (isRouteErrorResponse(error)) {
    heading = `${error.status} ${error.statusText}`;
    message = error.data?.message || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <section className="flex min-h-dvh flex-col items-center justify-center bg-base-200 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10 text-error">
        <AlertIcon className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-base-content">{heading}</h1>
      <p className="mt-2 max-w-md text-base-content/70">{message}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button onClick={() => navigate(0)} className="btn btn-primary">
          Reload page
        </button>
        <Link to="/" className="btn btn-ghost">
          Back to home
        </Link>
      </div>
    </section>
  );
}
