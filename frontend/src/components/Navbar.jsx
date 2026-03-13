import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import BrandLockup from "./BrandLockup";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

const NAV_ITEMS = [
  { label: "Home", to: "/", end: true },
  { label: "Archive", to: "/blogs" },
  {
    label: "Write",
    to: "/create",
    icon: HiOutlinePencilSquare,
    className: "navbar__link--cta",
  },
];

function getUserIdentity(user) {
  return user?.name || user?.username || user?.email || "";
}

function getUserInitials(value) {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "AJ";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function Navbar() {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get("q") || "");
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    navigate(trimmedQuery ? `/blogs?q=${encodeURIComponent(trimmedQuery)}` : "/blogs");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userIdentity = getUserIdentity(user);
  const userInitials = getUserInitials(userIdentity);

  return (
    <header className="navbar-wrap">
      <nav className="navbar" aria-label="Primary">
        <Link to="/" className="navbar__brand" aria-label="Go to homepage">
          <BrandLockup variant="nav" />
        </Link>

        <div
          id="navbar-panel"
          className={`navbar__panel ${menuOpen ? "is-open" : ""}`}
        >
          <div className="navbar__links">
            {NAV_ITEMS.map(({ label, to, end, icon: Icon, className = "" }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `navbar__link ${className}${isActive ? " active" : ""}`
                }
              >
                {Icon ? <Icon aria-hidden="true" /> : null}
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          <form className="navbar__search" onSubmit={handleSearch} role="search">
            <HiOutlineMagnifyingGlass className="navbar__search-icon" />
            <input
              type="text"
              placeholder="Search stories, topics, or authors"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search stories"
            />
            <button type="submit" className="navbar__search-submit">
              Find
            </button>
          </form>

          <div className="navbar__actions">
            <ThemeToggle compact />

            {user ? (
              <div className="navbar__session">
                <div className="navbar__account">
                  <span className="navbar__avatar" aria-hidden="true">
                    {userInitials}
                  </span>

                  <div className="navbar__user">
                    <span className="navbar__user-label">Active account</span>
                    <strong>{userIdentity}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="navbar__logout"
                  onClick={handleLogout}
                  aria-label="Log out"
                  title="Log out"
                >
                  <HiOutlineArrowRightOnRectangle />
                </button>
              </div>
            ) : (
              <div className="navbar__guest-actions">
                <Link to="/login" className="button-ghost">
                  Sign in
                </Link>
                <Link to="/register" className="button-primary">
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          className="navbar__toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="navbar-panel"
        >
          {menuOpen ? <HiOutlineXMark /> : <HiOutlineBars3 />}
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
