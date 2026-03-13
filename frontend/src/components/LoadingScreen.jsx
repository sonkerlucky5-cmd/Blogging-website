import BrandLockup from "./BrandLockup";
import "./LoadingScreen.css";

function LoadingScreen({
  title = "Loading workspace",
  message = "Preparing your editorial experience.",
  compact = false,
}) {
  return (
    <div className={`loading-screen${compact ? " loading-screen--compact" : ""}`}>
      {!compact && (
        <BrandLockup variant="compact" />
      )}

      <div className="loading-screen__spinner" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="loading-screen__copy">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
