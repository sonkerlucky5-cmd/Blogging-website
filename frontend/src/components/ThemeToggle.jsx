import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { useTheme } from "../context/ThemeContext";
import "./ThemeToggle.css";

function ThemeToggle({ floating = false, compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle${floating ? " theme-toggle--floating" : ""}${
        compact ? " theme-toggle--compact" : ""
      }`}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className={`theme-toggle__icon${isDark ? " is-dark" : " is-light"}`} aria-hidden="true">
        {isDark ? <HiOutlineMoon /> : <HiOutlineSun />}
      </span>
    </button>
  );
}

export default ThemeToggle;
