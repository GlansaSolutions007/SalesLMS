import { useState } from "react";
import "../App.css";

const featureList = [
  ["▣", "Booking Management"],
  ["◉", "Customer Management"],
  ["⚙", "Technician Management"],
  ["⌁", "Service Tracking"],
  ["✓", "Pickup & Delivery"],
  ["₹", "Payment Management"],
  ["▥", "Reports & Analytics"],
  ["★", "Business Growth"],
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

    car: (
      <>
        <path d="M5 17h14" />
        <path d="M6 17v-3l2-5h8l2 5v3" />
        <path d="M8 9h8" />
        <circle cx="8" cy="17" r="1.5" />
        <circle cx="16" cy="17" r="1.5" />
      </>
    ),
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
      <div className="car-icon">
        <Icon name="car" size={30} />
      </div>
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
          <b>MYCarBuddy</b>
          <span>Smart. Reliable. <i>Connected.</i></span>
        </div>
      </header>

      <div className="welcome">
        <h2>Welcome to</h2>

        <h1>
          MY<span>Car</span>
          <br />
          Buddy
        </h1>

        <p>
          Manage your complete automotive
          <br />
          service operations in one place.
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
            <small>Active Bookings</small>
            <strong>24</strong>
          </div>
        </div>

        <div className="floating-card service-card">
          <div className="service-progress">
            <span />
          </div>

          <div>
            <small>Service Completed</small>
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
                <small>Total Bookings</small>
                <strong>1,248</strong>
              </div>

              <div>
                <small>Active Services</small>
                <strong>86</strong>
              </div>

              <div>
                <small>Revenue</small>
                <strong>₹2.4L</strong>
              </div>
            </div>

            <div className="chart-box">
              <div className="chart-title">
                <span>Service Overview</span>
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

        <div className="road-line line-one" />
        <div className="road-line line-two" />

        <div className="car-illustration">
          <div className="car-body">
            <div className="car-window front-window" />
            <div className="car-window back-window" />

            <div className="car-light" />

            <div className="car-wheel wheel-one" />
            <div className="car-wheel wheel-two" />
          </div>
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
}) {
  return (
    <label className="field">
      <span>
        {label ||
          (type === "password" ? "Password" : "Email Address")}
      </span>

      <div className="input-wrapper">
        <Icon name={type === "password" ? "lock" : "mail"} />

        <input
          type={
            type === "password" && !showPassword
              ? "password"
              : "text"
          }
          placeholder={placeholder}
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
    ? "Login to manage your automotive service operations"
    : isForgot
      ? "Enter your registered email and we'll send you a reset link."
      : isReset
        ? "Create a secure new password for your account."
        : "Your password has been reset successfully.";

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
          <div className="card-logo">
            <Icon name="car" size={28} />
          </div>

          <div className="card-brand-text">
            <b>MYCarBuddy</b>
            <span>Automotive Service Management</span>
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
              <>
                <Field
                  type="email"
                  placeholder="Enter your email"
                  label="Email Address"
                />

                <Field
                  type="password"
                  placeholder="Enter your password"
                  label="Password"
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />

                <div className="options">
                  <label className="remember">
                    <input
                      type="checkbox"
                      defaultChecked
                    />

                    <span>Remember Me</span>
                  </label>

                  <button
                    onClick={() => setView("forgot")}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  className="primary"
                  onClick={onLogin}
                >
                  LOGIN TO DASHBOARD
                  <Icon name="arrow" />
                </button>

                <div className="divider">
                  <span />
                  Or continue with
                  <span />
                </div>

                <button className="google">
                  <b>G</b>
                  Continue with Google
                </button>
              </>
            )}

            {isForgot && (
              <>
                <Field
                  type="email"
                  placeholder="Enter your registered email"
                  label="Registered Email"
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
        <a href="#contact">Contact Administrator</a>
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
        © 2026 MYCarBuddy. All rights reserved.
        <span />
        Version 1.0
        <span />
        <b>Driving Better Service. Together.</b>
      </footer>
    </div>
  );
}