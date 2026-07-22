import { useEffect } from "react";

// Shared centered card shell for the auth pages.
// Fixed dark "glassmorphism" look (Stitch "Sign In" design) — intentionally
// theme-independent so it renders identically regardless of the app data-theme.

// Gradient chat/pulse brand mark with a soft glow behind it.
function LogoMark() {
  return (
    <div className="relative mx-auto h-[72px] w-[72px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-3"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(150,110,245,.65), transparent 66%)",
          filter: "blur(13px)",
        }}
      />
      <svg viewBox="0 0 48 48" fill="none" className="relative h-full w-full">
        <defs>
          <linearGradient
            id="logo-grad"
            x1="8"
            y1="6"
            x2="40"
            y2="42"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#dcccff" />
            <stop offset="0.5" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#7c5cf5" />
          </linearGradient>
        </defs>
        {/* chat bubble / leaf outline */}
        <path
          d="M24 7C15.7 7 9 13.4 9 21.2c0 3 1 5.8 2.8 8L9 41l9.6-3.1c1.7.6 3.5 1 5.4 1 8.3 0 15-6.4 15-14.2S32.3 7 24 7Z"
          stroke="url(#logo-grad)"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {/* pulse / heartbeat line through the bubble */}
        <path
          d="M14.5 24.5l4.2-7.4 4 8 3.2-5.4 3.6 4.8h4"
          stroke="url(#logo-grad)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children }) {
  // Load Inter once (design typeface) without touching index.html.
  useEffect(() => {
    const id = "auth-inter-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  return (
    <div
      className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background: "#0f0e17",
        fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      {/* purple + cyan radial glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(680px circle at 40% 38%, rgba(124,92,245,.42), transparent 62%)," +
            "radial-gradient(560px circle at 62% 74%, rgba(90,200,245,.24), transparent 62%)," +
            "#0f0e17",
        }}
      />

      <div className="relative w-full max-w-[440px]">
        <div
          className="rounded-[24px] px-8 py-10 sm:px-10"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 50px -20px rgba(0,0,0,0.6)",
          }}
        >
          <header className="mb-7 text-center">
            <LogoMark />
            <h1 className="mt-5 text-[2.5rem] font-bold leading-none tracking-tight text-[#f4f2fb]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-[#c7c4d8]">{subtitle}</p>
            )}
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
