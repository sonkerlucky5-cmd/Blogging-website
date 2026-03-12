import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import BrandLockup from "../components/BrandLockup";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

function Login() {
  const navigate = useNavigate();
  const { login, loading, user } = useAuth();
  const [form, setForm] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.emailOrUsername.trim() || !form.password.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      const { data } = await api.post("/auth/login", {
        emailOrUsername: form.emailOrUsername.trim(),
        password: form.password,
      });

      login(data);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
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
            <p className="eyebrow">Member access</p>
            <h1>Return to your editorial workspace.</h1>
            <p>
              Sign in to manage publishing with cleaner navigation, refined
              screens, and stronger layout consistency across the app.
            </p>
          </div>

          <div className="auth-showcase__stats">
            <div>
              <strong>Clean</strong>
              <span>auth flow</span>
            </div>
            <div>
              <strong>Fast</strong>
              <span>redirects</span>
            </div>
            <div>
              <strong>Real</strong>
              <span>profile context</span>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <p className="eyebrow">Sign in</p>
        <h2>Welcome back</h2>
        <p>Use your email or username to continue.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email or username</span>
            <input
              type="text"
              value={form.emailOrUsername}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  emailOrUsername: event.target.value,
                }))
              }
              placeholder="Enter email or username"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  password: event.target.value,
                }))
              }
              placeholder="Enter password"
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="button-primary" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </div>
  );
}

export default Login;
