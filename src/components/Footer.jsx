import { Link } from "react-router-dom";
import BrandLockup from "./BrandLockup";
import { BRAND_NAME, BRAND_SHORT_NAME } from "../lib/brand";
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner glass-panel">
        <div className="site-footer__brand">
          <BrandLockup variant="compact" />
          <p>
            Built for teams and creators who want a cleaner publishing surface,
            stronger reading experience, and a brand that feels intentional.
          </p>
        </div>

        <div className="site-footer__group">
          <span className="site-footer__label">Navigate</span>
          <Link to="/">Home</Link>
          <Link to="/blogs">Archive</Link>
          <Link to="/create">Write</Link>
        </div>

        <div className="site-footer__group">
          <span className="site-footer__label">Account</span>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create account</Link>
        </div>

        <div className="site-footer__meta">
          <span className="site-footer__label">{BRAND_SHORT_NAME}</span>
          <strong>Journal platform</strong>
          <p>Professional publishing experience with a sharper editorial identity.</p>
          <span className="site-footer__copyright">
            {currentYear} {BRAND_NAME}
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
