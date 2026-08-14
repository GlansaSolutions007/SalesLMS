import api from "./axios.js";

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Checkout / Payment (Company Admin self-service, or Super Admin for any
// company) ───────────────────────────────────────────────────────────────

// POST /companies/{company}/subscriptions/checkout
// body: { plan_id, employee_count, start_date? } — amount is NEVER sent;
// the backend computes it from the plan's price_per_employee.
// Response: { transaction_id, transaction_no, razorpay_order_id,
//             razorpay_key_id, amount, currency, payment_type, status }
export function createSubscriptionCheckout(companyId, data, token) {
  return api.post(`companies/${companyId}/subscriptions/checkout`, data, { headers: authHeader(token) });
}

// POST /companies/{company}/subscriptions/{subscription}/seats/checkout
// body: { additional_employees }
export function createSeatCheckout(companyId, subscriptionId, data, token) {
  return api.post(`companies/${companyId}/subscriptions/${subscriptionId}/seats/checkout`, data, { headers: authHeader(token) });
}

// POST /companies/{company}/payment-transactions/{transaction}/verify
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature } —
// exactly what Razorpay's Checkout success handler hands back.
export function verifyPayment(companyId, transactionId, data, token) {
  return api.post(`companies/${companyId}/payment-transactions/${transactionId}/verify`, data, { headers: authHeader(token) });
}

// POST /companies/{company}/payment-transactions/{transaction}/retry
// Only valid when the transaction's status is "Failed" — creates a new
// attempt (new Razorpay order), the original stays Failed untouched.
export function retryPayment(companyId, transactionId, token) {
  return api.post(`companies/${companyId}/payment-transactions/${transactionId}/retry`, {}, { headers: authHeader(token) });
}

// ── Payment History ─────────────────────────────────────────────────────

// GET /companies/{company}/payment-transactions?status=&payment_type=&per_page=&page=
export function getPaymentTransactions(companyId, params, token) {
  return api.get(`companies/${companyId}/payment-transactions`, { params, headers: authHeader(token) });
}

export function getPaymentTransaction(companyId, transactionId, token) {
  return api.get(`companies/${companyId}/payment-transactions/${transactionId}`, { headers: authHeader(token) });
}

// GET /companies/{company}/payment-transactions/{transaction}/refunds
export function getRefunds(companyId, transactionId, token) {
  return api.get(`companies/${companyId}/payment-transactions/${transactionId}/refunds`, { headers: authHeader(token) });
}

// POST /admin/companies/{company}/payment-transactions/{transaction}/refunds — Super Admin only
// body: { amount?, reason? } — omitted amount = refund whatever remains.
export function requestRefund(companyId, transactionId, data, token) {
  return api.post(`admin/companies/${companyId}/payment-transactions/${transactionId}/refunds`, data, { headers: authHeader(token) });
}

// ── Invoices ─────────────────────────────────────────────────────────────

// GET /companies/{company}/invoices?per_page=&page=
export function getInvoices(companyId, params, token) {
  return api.get(`companies/${companyId}/invoices`, { params, headers: authHeader(token) });
}

export function getInvoice(companyId, invoiceId, token) {
  return api.get(`companies/${companyId}/invoices/${invoiceId}`, { headers: authHeader(token) });
}

// GET /companies/{company}/invoices/{invoice}/download — an authenticated,
// company-scoped download (not a public storage URL, unlike certificates),
// so this fetches the PDF as a blob (carrying the Bearer token via the
// shared axios instance) rather than a plain <a href> which can't attach
// an Authorization header.
export async function downloadInvoice(companyId, invoiceId, token) {
  const res = await api.get(`companies/${companyId}/invoices/${invoiceId}/download`, {
    headers: authHeader(token),
    responseType: "blob",
  });
  return res.data;
}

// ── Payment Gateway Settings (Settings > Payment Gateway, Super Admin) ───

// GET /admin/payment-gateway-settings
// Response: { key_id, key_secret: "**************" | "", webhook_secret: "**************" | "", mode, currency, status }
export function getPaymentGatewaySettings(token) {
  return api.get("admin/payment-gateway-settings", { headers: authHeader(token) });
}

// PUT /admin/payment-gateway-settings — leave key_secret/webhook_secret
// blank (or unchanged from the masked value) to keep the stored secret.
export function updatePaymentGatewaySettings(data, token) {
  return api.put("admin/payment-gateway-settings", data, { headers: authHeader(token) });
}

// POST /admin/payment-gateway-settings/test — validates credentials with a
// side-effect-free Razorpay API call; works against unsaved form values too.
export function testPaymentGatewaySettings(data, token) {
  return api.post("admin/payment-gateway-settings/test", data, { headers: authHeader(token) });
}
