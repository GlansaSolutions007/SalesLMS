import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ROUTES } from "../router/routePaths.js";
import { consumeSessionExpiredFlag } from "../utils/storage.js";
import { forgotPassword, resetPassword } from "../services/authService.js";
import { ApiValidationError } from "../services/axios.js";
import "../App.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const featureList = [
  ["▣", "Training Programs"],
  ["◉", "Sales Coaching"],
  ["⚙", "Performance Tracking"],
  ["⌁", "Learning Plans"],
  ["▥", "Skill Analytics"],
  ["★", "Growth Focus"],
];

function BrandMark() {
  return (
    <div className="brand-mark">
      <Icon name="car" size={28} /> 
    </div>
  );
}

function SidePanel() {
  return (
    <aside className="side-panel">
      <div className="blue-circle circle-one" />
      <div className="blue-circle circle-two" />
      <div className="dots top" />

      <header className="side-brand">
        <BrandMark />

        <div>
          <b>Sales LMS</b>
          <span>Training. Tracking. Growth.</span>
        </div>
      </header>

      <div className="welcome">
        <p className="eyebrow">Sales Enablement Platform</p>
        <h1>
          Welcome to
         
           <span> Sales LMS</span>
        </h1>

        <p>
          Give your sales team a clear path to excellence with structured learning,
          intelligent coaching, and real-time performance visibility.
        </p>
      </div>

      <div className="features">
        {featureList.map(([symbol, label]) => (
          <div className="feature" key={label}>
            <span>{symbol}</span>
            <p>{label}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-art">
        <div className="floating-card booking-card">
          <div className="floating-icon">
            <Icon name="car" size={18} />
          </div>

          <div>
            <small>Active Courses</small>
            <strong>24</strong>
          </div>
        </div>

        <div className="floating-card service-card">
          <div className="service-progress">
            <span />
          </div>

          <div>
            <small>Completion Rate</small>
            <strong>86%</strong>
          </div>
        </div>

        <div className="dashboard-window">
          <div className="window-top">
            <div className="window-logo">
              <Icon name="car" size={15} />
            </div>

            <div className="window-lines">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="window-content">
            <div className="window-heading">
              <div>
                <small>Dashboard</small>
                <b>Good Morning!</b>
              </div>

              <div className="profile-circle" />
            </div>

            <div className="stats">
              <div>
                <small>Enrolled</small>
                <strong>1,248</strong>
              </div>

              <div>
                <small>Active Goals</small>
                <strong>86</strong>
              </div>

              <div>
                <small>Revenue</small>
                <strong>₹2.4L</strong>
              </div>
            </div>

            <div className="chart-box">
              <div className="chart-title">
                <span>Performance Overview</span>
                <b>+18.4%</b>
              </div>

              <svg viewBox="0 0 300 100">
                <path
                  d="M5 82 C25 72 35 80 52 60 S78 75 96 52 120 65 142 42 165 50 185 28 210 44 230 20 260 30 295 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <path
                  d="M5 82 C25 72 35 80 52 60 S78 75 96 52 120 65 142 42 165 50 185 28 210 44 230 20 260 30 295 5 V100 H5Z"
                  fill="currentColor"
                  opacity="0.08"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="dots bottom" />
    </aside>
  );
}

function Field({ type, placeholder, showPassword, setShowPassword, label, value, onChange, onBlur, error, icon }) {
  return (
    <label className="field">
      <span>{label || (type === "password" ? "Password" : "Email Address")}</span>

      <div className="input-wrapper">
        <Icon name={icon || (type === "password" ? "lock" : "mail")} />

        <input
          type={type === "password" && !showPassword ? "password" : "text"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />

        {type === "password" && (
          <button
            type="button"
            className="eye"
            onClick={() => setShowPassword(!showPassword)}
          >
            <Icon name="eye" />
          </button>
        )}
      </div>

      {error && <p className="field-error">{error}</p>}
    </label>
  );
}

function AuthCard({ view, setView }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [usernameError, setUsernameError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotApiError, setForgotApiError] = useState("");

  const [resetToken, setResetToken] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetConfirmValue, setResetConfirmValue] = useState("");
  const [resetErrors, setResetErrors] = useState({});
  const [resetLoading, setResetLoading] = useState(false);
  const [resetApiError, setResetApiError] = useState("");

  useEffect(() => {
    if (consumeSessionExpiredFlag()) setSessionExpired(true);
  }, []);

  function validateUsername(value) {
    if (!value.trim()) return "Email is required.";
    if (!EMAIL_RE.test(value.trim())) return "Enter a valid email address.";
    return "";
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    const validationError = validateUsername(forgotEmail);
    setForgotEmailError(validationError);
    if (validationError) return;

    setForgotLoading(true);
    setForgotApiError("");
    try {
      await forgotPassword({ email: forgotEmail.trim() });
      setView("reset");
    } catch (err) {
      setForgotApiError(err.message ?? "Could not send reset instructions. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault();

    const nextErrors = {};
    if (!resetToken.trim()) nextErrors.token = "Reset token is required.";
    if (!resetPasswordValue) nextErrors.password = "New password is required.";
    else if (resetPasswordValue.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (!resetConfirmValue) nextErrors.confirm = "Please confirm your new password.";
    else if (resetConfirmValue !== resetPasswordValue) nextErrors.confirm = "Passwords do not match.";

    setResetErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setResetLoading(true);
    setResetApiError("");
    try {
      await resetPassword({
        email: forgotEmail.trim(),
        token: resetToken.trim(),
        password: resetPasswordValue,
        password_confirmation: resetConfirmValue,
      });
      setView("success");
    } catch (err) {
      if (err instanceof ApiValidationError) {
        const fieldErrors = {};
        Object.entries(err.errors ?? {}).forEach(([field, messages]) => {
          const message = Array.isArray(messages) ? messages[0] : messages;
          if (field === "token") fieldErrors.token = message;
          else if (field === "password" || field === "password_confirmation") fieldErrors.password = message;
          else if (field === "email") fieldErrors.token = message;
        });
        setResetErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      setResetApiError(err.message ?? "Could not reset your password. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleLogin(e) {
    e?.preventDefault();
    const validationError = validateUsername(username);
    setUsernameError(validationError);
    if (validationError || !password) return;

    try {
      setSessionExpired(false);
      await login({ username, password }, remember);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch {
      /* error message is already surfaced via auth context state */
    }
  }

  const isLogin = view === "login";
  const isForgot = view === "forgot";
  const isReset = view === "reset";

  const heading = isLogin
    ? "Welcome back!"
    : isForgot
      ? "Forgot password?"
      : isReset
        ? "Reset password"
        : "Password updated!";

  const subheading = isLogin
    ? "Sign in to continue your sales learning journey."
    : isForgot
      ? "Enter your registered email and we’ll send you a reset token."
      : isReset
        ? `Enter the reset token sent to ${forgotEmail || "your email"} along with your new password.`
        : "Your password has been reset successfully.";

  return (
    <main className="auth-wrap">
      <section className={`auth-card ${view}`}>
        {!isLogin && (
          <button className="back" onClick={() => setView("login")}>
            <Icon name="back" size={18} />
            Back to login
          </button>
        )}

        <div className="card-brand">
          <div className="card-logo">
            <Icon name="car" size={28} />
          </div>

          <div className="card-brand-text">
            <b>Sales LMS</b>
            <span>Learning for Better Sales Performance</span>
          </div>
        </div>

        {view === "success" ? (
          <>
            <div className="success-icon">
              <Icon name="check" size={35} />
            </div>

            <div className="card-title">
              <h2>{heading}</h2>
              <p>{subheading}</p>
            </div>

            <button className="primary" onClick={() => setView("login")}>
              BACK TO LOGIN
              <Icon name="arrow" />
            </button>
          </>
        ) : (
          <>
            <div className="card-title">
              <h2>{heading}</h2>
              <p>{subheading}</p>
            </div>

            {isLogin && (
              <form onSubmit={handleLogin}>
                {sessionExpired && (
                  <p className="form-error">Your session has expired. Please sign in again.</p>
                )}

                <Field
                  type="email"
                  placeholder="Enter your email"
                  label="Email Address"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameError) setUsernameError("");
                  }}
                  onBlur={(e) => setUsernameError(validateUsername(e.target.value))}
                  error={usernameError}
                />

                <Field
                  type="password"
                  placeholder="Enter your password"
                  label="Password"
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p className="form-error">{error}</p>}

                <div className="options">
                  <label className="remember">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    <span>Remember Me</span>
                  </label>

                  <button type="button" onClick={() => setView("forgot")}>
                    Forgot Password?
                  </button>
                </div>

                <button className="primary" type="submit" disabled={isLoading || !username.trim() || !password}>
                  {isLoading ? "SIGNING IN…" : "LOGIN TO DASHBOARD"}
                  <Icon name="arrow" />
                </button>

                <div className="divider">
                  <span />
                  Or continue with
                  <span />
                </div>

                <button className="google" type="button">
                  <b>G</b>
                  Continue with Google
                </button>
              </form>
            )}

            {isForgot && (
              <form onSubmit={handleForgotSubmit}>
                <Field
                  type="email"
                  placeholder="Enter your registered email"
                  label="Registered Email"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (forgotEmailError) setForgotEmailError("");
                  }}
                  onBlur={(e) => setForgotEmailError(validateUsername(e.target.value))}
                  error={forgotEmailError}
                />

                {forgotApiError && <p className="form-error">{forgotApiError}</p>}

                <button className="primary" type="submit" disabled={forgotLoading || !forgotEmail.trim()}>
                  {forgotLoading ? "SENDING…" : "SEND RESET TOKEN"}
                  <Icon name="arrow" />
                </button>
              </form>
            )}

            {isReset && (
              <form onSubmit={handleResetSubmit}>
                <Field
                  type="text"
                  icon="shield"
                  placeholder="Paste the token from your email"
                  label="Reset Token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  error={resetErrors.token}
                />

                <Field
                  type="password"
                  placeholder="Enter new password"
                  label="New Password"
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  error={resetErrors.password}
                />

                <Field
                  type="password"
                  placeholder="Confirm new password"
                  label="Confirm Password"
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  value={resetConfirmValue}
                  onChange={(e) => setResetConfirmValue(e.target.value)}
                  error={resetErrors.confirm}
                />

                {resetApiError && <p className="form-error">{resetApiError}</p>}

                <button
                  className="primary"
                  type="submit"
                  disabled={resetLoading || !resetToken.trim() || !resetPasswordValue || !resetConfirmValue}
                >
                  {resetLoading ? "RESETTING…" : "RESET PASSWORD"}
                  <Icon name="arrow" />
                </button>
              </form>
            )}
          </>
        )}
      </section>

      <p className="help">
        <b>i</b>
        Need Help?
        <a href="#contact">Contact Administrator</a>
      </p>
    </main>
  );
}

export default function Login() {
  const [view, setView] = useState("login");

  return (
    <div className="app">
      <SidePanel />

      <AuthCard view={view} setView={setView} />

      {/* <footer>
        © 2026 Sales LMS. All rights reserved.
        <span />
        Version 1.0
        <span />
        <b>Learning that scales your sales team.</b>
      </footer> */}
    </div>
  );
}
