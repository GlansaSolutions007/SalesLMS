import { useNavigate, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ROUTES, subscriptionRenewalPath } from "../router/routePaths.js";
import "./SubscriptionBanner.css";

// Shown on every page (mounted once in AppLayout) once a Company Admin's,
// Trainer's, or Employee's company subscription has lapsed. Super Admin
// never sees this — see AuthContext's `subscriptionExpired`.
export default function SubscriptionBanner() {
  const { subscriptionExpired, roleName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!subscriptionExpired) return null;
  // The Subscription Expired page already carries this message full-screen.
  if (location.pathname === ROUTES.SUBSCRIPTION_EXPIRED) return null;

  const renewalPath = subscriptionRenewalPath(roleName);

  return (
    <div className="subscription-banner" role="alert">
      <Icon name="warning" size={18} />
      <div className="subscription-banner-text">
        <strong>Subscription Expired.</strong> Your company&apos;s subscription has expired. Please contact your
        administrator to renew the subscription.
      </div>
      {renewalPath && (
        <button type="button" className="subscription-banner-action" onClick={() => navigate(renewalPath)}>
          Renew Subscription
        </button>
      )}
    </div>
  );
}
