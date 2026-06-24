import { BoltIcon } from "./icons";

// Shared centered card shell for auth pages (single primary CTA, one source of style).
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-base-200 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="card border border-base-300 bg-base-100 shadow-xl">
          <div className="card-body p-6 sm:p-8">
            <header className="mb-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-content">
                <BoltIcon className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-base-content">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-base-content/70">{subtitle}</p>
              )}
            </header>

            {children}
          </div>
        </div>

        {footer && (
          <p className="mt-6 text-center text-sm text-base-content/70">{footer}</p>
        )}
      </div>
    </div>
  );
}
