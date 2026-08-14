import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import SystemSettingsPanel from "./SystemSettingsPanel.jsx";
import PaymentGatewaySettingsPanel from "./PaymentGatewaySettingsPanel.jsx";
import "../company/CompanyList.css";
import "./Settings.css";

// Company Settings (timezone/language/office hours) is hidden from this
// page per request — CompanySettingsPanel.jsx and its API are untouched,
// just no longer reachable from this tab bar. Note this also removes a
// Company Admin's only tab here (they previously saw just "Company
// Settings"), so a Company Admin now sees the empty state below.
const TAB_DEFS = [
  {
    key: "system",
    label: "System Settings",
    icon: "settings",
    description: "Platform-wide configuration used across the LMS — branding, security, uploads, and more.",
    roles: ["Super Admin"],
  },
  {
    key: "payment-gateway",
    label: "Payment Gateway",
    icon: "coin",
    description: "Configure the Razorpay credentials used for subscription checkout, seat purchases, and refunds.",
    roles: ["Super Admin"],
  },
];

export default function Settings() {
  const { toggleCollapsed } = useOutletContext();
  const { roleName } = useAuth();

  const tabs = TAB_DEFS.filter((tab) => tab.roles.includes(roleName));
  const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? "");
  const active = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body settings-shell">
        <div className="cl-header">
          <div>
            <h1>Settings</h1>
            <Breadcrumb current="Settings" />
          </div>
        </div>

        {!active ? (
          <div className="settings-empty">
            <Icon name="settings" size={26} />
            <p>No settings are available for your role.</p>
          </div>
        ) : (
          <>
            {tabs.length > 1 && (
              <div className="settings-tabbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`settings-tab${active.key === tab.key ? " is-active" : ""}`}
                    onClick={() => setActiveKey(tab.key)}
                  >
                    <Icon name={tab.icon} size={15} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="settings-panel-intro">
              <span className="settings-panel-intro-icon">
                <Icon name={active.icon} size={20} />
              </span>
              <div>
                <h2>{active.label}</h2>
                <p>{active.description}</p>
              </div>
            </div>

            {active.key === "payment-gateway" ? <PaymentGatewaySettingsPanel /> : <SystemSettingsPanel />}
          </>
        )}
      </div>
    </>
  );
}
