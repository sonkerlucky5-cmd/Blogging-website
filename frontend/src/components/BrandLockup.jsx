import "./BrandLockup.css";
import { BRAND_NAME, BRAND_SUBTITLE } from "../lib/brand";

function BrandLockup({
  variant = "nav",
  inverted = false,
  title = BRAND_NAME,
  subtitle = BRAND_SUBTITLE,
}) {
  return (
    <div
      className={`brand-lockup brand-lockup--${variant}${
        inverted ? " is-inverted" : ""
      }`}
    >
      <img
        src="/brand-mark.svg"
        alt={`${title} logo`}
        className="brand-lockup__mark"
      />

      <div className="brand-lockup__copy">
        <span className="brand-lockup__title">{title}</span>
        <span className="brand-lockup__subtitle">{subtitle}</span>
      </div>
    </div>
  );
}

export default BrandLockup;
