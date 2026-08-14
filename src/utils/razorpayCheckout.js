// Thin wrapper around the Razorpay Checkout.js widget (loaded via a
// <script> tag in index.html — window.Razorpay). The amount/currency shown
// inside the widget itself come straight from the backend-created order
// (order.amount below), not anything computed client-side, so even the
// payment screen the user actually pays from is showing a backend-verified
// number.
export function openRazorpayCheckout({
  keyId,
  orderId,
  amount,
  currency = "INR",
  name = "Sales LMS",
  description,
  prefill = {},
  onSuccess,
  onFailure,
  onDismiss,
}) {
  if (typeof window === "undefined" || !window.Razorpay) {
    onFailure?.(new Error("Razorpay Checkout could not be loaded. Please check your internet connection and try again."));
    return;
  }

  const rzp = new window.Razorpay({
    key: keyId,
    order_id: orderId,
    amount: Math.round(amount * 100),
    currency,
    name,
    description,
    prefill,
    theme: { color: "#1a2b4c" },
    handler: (response) => {
      onSuccess?.({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
    modal: {
      ondismiss: () => onDismiss?.(),
    },
  });

  rzp.on("payment.failed", (response) => {
    onFailure?.(new Error(response?.error?.description || "Payment failed. Please try again."));
  });

  rzp.open();
}
