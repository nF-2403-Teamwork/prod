import { useEffect } from "react";
import { useSelector } from "react-redux";

// Reflects the persisted UI theme onto <html data-theme> so daisyUI restyles
// the whole app (night mode toggle lives in the account drawer).
export default function ThemeApplier() {
  const theme = useSelector((s) => s.ui.theme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return null;
}
