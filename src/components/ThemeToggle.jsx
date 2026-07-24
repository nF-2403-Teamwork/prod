import { useDispatch, useSelector } from "react-redux";

import { toggleTheme } from "../store/uiSlice";
import { SunIcon, MoonIcon } from "./icons";

// Sun/Moon light-dark switch. Shows the moon in light mode (tap → go dark) and
// the sun in dark mode (tap → go light).
export default function ThemeToggle({ className = "" }) {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      className={`btn btn-ghost btn-sm btn-square ${className}`}
      aria-label={dark ? "Светлая тема" : "Тёмная тема"}
      title={dark ? "Светлая тема" : "Тёмная тема"}
    >
      {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}
