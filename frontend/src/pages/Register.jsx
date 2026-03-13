import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import BrandLockup from "../components/BrandLockup";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

function Register() {
  const { login, loading, user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState(null);

  if (!loading && user) {
    return (
      <Navigate
        to={redirectTarget?.pathname || "/"}
        state={redirectTarget?.state}
        replace
      />
    );
  }

  const updateField = (field) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError("All fields are required.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);

      const { data } = await api.post("/auth/register", {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      login(data);
      setRedirectTarget({
        pathname: "/create",
        state: {
          fromSignup: true,
          firstName: data.user?.name?.trim().split(/\s+/)[0] || "Writer",
        },
      });
    } catch (err) {
      console.error("Register error:", err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-showcase">
        <div className="auth-showcase__inner">
          <BrandLockup variant="hero" inverted />

          <div>
            <p className="eyebrow">Create account</p>
            <h1>Open your account and step straight into your writer studio.</h1>
            <p>
              Signup now feels more intentional: create your profile, get signed
              in instantly, and land directly inside a cleaner onboarding flow.
            </p>
          </div>

          <div className="auth-showcase__stats">
            <div>
              <strong>Instant</strong>
              <span>access after signup</span>
            </div>
            <div>
              <strong>Structured</strong>
              <span>writer onboarding</span>
            </div>
            <div>
              <strong>Ready</strong>
              <span>to publish faster</span>
            </div>
          </div>

          <div className="auth-showcase__panel">
            <span className="auth-showcase__panel-label">After signup</span>
            <strong>You land inside the writer studio, not a dead-end screen.</strong>
            <p>
              The next step now feels guided: your author identity is ready,
              your workspace opens immediately, and the first article flow is
              easier to start.
            </p>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <p className="eyebrow">Register</p>
        <h2>Create your account</h2>
        <p>Set up your author profile and start publishing.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__row">
            <label>
              <span>Full name</span>
              <input
                type="text"
                value={form.name}
                onChange={updateField("name")}
                placeholder="Your full name"
              />
            </label>

            <label>
              <span>Username</span>
              <input
                type="text"
                value={form.username}
                onChange={updateField("username")}
                placeholder="Choose a username"
              />
            </label>
          </div>

          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={updateField("email")}
              placeholder="you@example.com"
            />
          </label>

          <div className="auth-form__row">
            <label>
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={updateField("password")}
                placeholder="Create a password"
              />
            </label>

            <label>
              <span>Confirm password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={updateField("confirmPassword")}
                placeholder="Repeat password"
              />
            </label>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="button-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}

export default Register;
