import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { DEMO_ACCOUNTS } from "../services/authService.js";
import { ROUTES } from "../router/routePaths.js";
import "../App.css";

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

function Field({ type, placeholder, showPassword, setShowPassword, label, value, onChange }) {
  return (
    <label className="field">
      <span>{label || (type === "password" ? "Password" : "Email Address")}</span>

      <div className="input-wrapper">
        <Icon name={type === "password" ? "lock" : "mail"} />

        <input
          type={type === "password" && !showPassword ? "password" : "text"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
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
    </label>
  );
}

function AuthCard({ view, setView }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e?.preventDefault();
    try {
      await login({ username, password });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch {
      /* error message is already surfaced via auth context state */
    }
  }

  async function handleDemoLogin(demoUsername) {
    setUsername(demoUsername);
    try {
      await login({ username: demoUsername, password: "demo" });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch {
      /* ignore — demo accounts always exist */
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
      ? "Enter your registered email and we’ll send you a reset link."
      : isReset
        ? "Create a secure new password for your account."
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
                <Field
                  type="email"
                  placeholder="Username or email"
                  label="Username or Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                    <input type="checkbox" defaultChecked />
                    <span>Remember Me</span>
                  </label>

                  <button type="button" onClick={() => setView("forgot")}>
                    Forgot Password?
                  </button>
                </div>

                <button className="primary" type="submit" disabled={isLoading}>
                  {isLoading ? "SIGNING IN…" : "LOGIN TO DASHBOARD"}
                  <Icon name="arrow" />
                </button>

                <div className="demo-accounts">
                  <span>Demo accounts</span>
                  <div className="demo-accounts-list">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        type="button"
                        key={acc.username}
                        className="demo-account-pill"
                        onClick={() => handleDemoLogin(acc.username)}
                        disabled={isLoading}
                      >
                        {acc.roleName}
                      </button>
                    ))}
                  </div>
                </div>

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
              <>
                <Field type="email" placeholder="Enter your registered email" label="Registered Email" />

                <button className="primary" onClick={() => setView("reset")}>
                  SEND RESET LINK
                  <Icon name="arrow" />
                </button>
              </>
            )}

            {isReset && (
              <>
                <Field
                  type="password"
                  placeholder="Enter new password"
                  label="New Password"
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />

                <Field
                  type="password"
                  placeholder="Confirm new password"
                  label="Confirm Password"
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />

                <button className="primary" onClick={() => setView("success")}>
                  RESET PASSWORD
                  <Icon name="arrow" />
                </button>
              </>
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