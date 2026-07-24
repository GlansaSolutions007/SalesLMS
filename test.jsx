import { useState } from "react";
import axios from "axios";
import "../App.css";

const featureList = [
  ["▰", "Sales Training"],
  ["▶", "Video Learning"],
  ["✓", "Assessments & Certifications"],
  ["♟", "Lead Management"],
  ["⌁", "Daily Activity Tracking"],
  ["◎", "Target Achievement"],
  ["▥", "Performance Analytics"],
  ["★", "Rewards & Recognition"],
];

function Icon({ name, size = 20 }) {
  const icons = {
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),

    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
      </>
    ),

    eye: (
      <>
        <path d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="2.2" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),

    back: (
      <>
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function BrandMark() {
  return (
    <div className="brand-mark">
      <span className="bar one" />
      <span className="bar two" />
      <span className="bar three" />
      <span className="trend">↗</span>
    </div>
  );
}

function SidePanel() {
  return (
    <aside className="side-panel">
      <div className="dots top" />

      <header className="side-brand">
        <BrandMark />

        <div>
          <b>Sales LMS</b>

          <span>
            Learn. Practice. Perform. <i>Win.</i>
          </span>
        </div>
      </header>

      <div className="welcome">
        <h2>Welcome to</h2>

        <h1>
          Sales <em>LMS</em>
        </h1>

        <p>
          Empower your sales team with
          <br />
          the right skills for greater results
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
        <div className="up-arrow">↗</div>

        <div className="columns">
          <i />
          <i />
          <i />
          <i />
        </div>

        <div className="laptop">
          <div className="screen">
            <small>Dashboard</small>

            <div className="stat-row">
              <b>
                Courses
                <br />
                <strong>12</strong>
              </b>

              <b>
                In Progress
                <br />
                <strong>4</strong>
              </b>

              <b>
                Points
                <br />
                <strong>2,450</strong>
              </b>
            </div>

            <div className="chart">
              <span>Performance Overview</span>

              <svg viewBox="0 0 210 52">
                <path
                  d="M4 43 C23 40 26 29 42 36 S59 43 72 24 95 41 112 24 129 10 143 24 163 13 178 8 194 10 205 1"
                  fill="none"
                  stroke="#0d72e8"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="plant">
          <i />
          <i />
          <i />
          <b />
        </div>
      </div>

      <div className="dots bottom" />
    </aside>
  );
}

function Field({
  type,
  placeholder,
  showPassword,
  setShowPassword,
  label,
  value,
  onChange,
}) {
  return (
    <label className="field">
      <span>
        {label || (type === "password" ? "Password" : "Username")}
      </span>

      <div>
        <Icon name={type === "password" ? "lock" : "mail"} />

        <input
          type={
            type === "password" && !showPassword
              ? "password"
              : "text"
          }
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

function AuthCard({ view, setView, onLogin }) {
  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

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
    ? "Login to continue your learning journey"
    : isForgot
      ? "Enter your email and we’ll send you a reset link."
      : isReset
        ? "Create a secure new password for your account."
        : "Your password has been reset successfully.";

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Please enter your username");

      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");

      return;
    }

    try {
      setLoading(true);

      setError("");

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}auth/login`,
        {
          username: username.trim(),

          password: password,
        }
      );

      console.log("Login Response:", response.data);

      const data = response.data;

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.accessToken) {
        localStorage.setItem(
          "accessToken",
          data.accessToken
        );
      }

      if (data.refreshToken) {
        localStorage.setItem(
          "refreshToken",
          data.refreshToken
        );
      }

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      if (onLogin) {
        onLogin(data);
      }
    } catch (error) {
      console.error("Login Error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Invalid username or password";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-wrap">
      <section className={`auth-card ${view}`}>
        {!isLogin && (
          <button
            className="back"
            onClick={() => setView("login")}
          >
            <Icon name="back" size={18} />

            Back to login
          </button>
        )}

        <div className="card-brand">
          <div className="book-logo">◖◎</div>

          <b>Sales LMS</b>

          <span>
            Learning for Better Sales Performance
          </span>
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

            <button
              className="primary"
              onClick={() => setView("login")}
            >
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
                  type="text"
                  label="Username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                />

                <Field
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />

                {error && (
                  <p className="login-error">
                    {error}
                  </p>
                )}

                <div className="options">
                  <label>
                    <input
                      type="checkbox"
                      defaultChecked
                    />

                    <span>Remember Me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="primary"
                  disabled={loading}
                >
                  {loading
                    ? "LOGGING IN..."
                    : "LOGIN TO DASHBOARD"}

                  {!loading && <Icon name="arrow" />}
                </button>

                <div className="divider">
                  <span />

                  Or continue with

                  <span />
                </div>

                <button
                  type="button"
                  className="google"
                >
                  <b>G</b>

                  Continue with Google
                </button>
              </form>
            )}

            {isForgot && (
              <>
                <Field
                  type="email"
                  placeholder="Enter your registered email"
                />

                <button
                  className="primary"
                  onClick={() => setView("reset")}
                >
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

                <button
                  className="primary"
                  onClick={() => setView("success")}
                >
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

        <a href="#contact">
          Contact Administrator
        </a>
      </p>
    </main>
  );
}

export default function Login({ onLogin }) {
  const [view, setView] = useState("login");

  return (
    <div className="app">
      <SidePanel />

      <AuthCard
        view={view}
        setView={setView}
        onLogin={onLogin}
      />

      <footer>
        © 2024 Sales LMS. All rights reserved.

        <span />

        Version 1.0

        <span />

        <b>
          Empowering Sales. Driving Success.
        </b>
      </footer>
    </div>
  );
}