import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import BrandLockup from "../components/BrandLockup";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

function Register() {
  const navigate = useNavigate();
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

  if (!loading && user) {
    return <Navigate to="/" replace />;
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
      navigate("/");
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
            <h1>Launch your own modern publishing identity.</h1>
            <p>
              Registration now connects to the real backend flow, signs the user
              in immediately, and drops them into a much cleaner product surface.
            </p>
          </div>

          <div className="auth-showcase__stats">
            <div>
              <strong>1 step</strong>
              <span>signup to publish</span>
            </div>
            <div>
              <strong>Better</strong>
              <span>author identity</span>
            </div>
            <div>
              <strong>Sharper</strong>
              <span>experience</span>
            </div>
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
