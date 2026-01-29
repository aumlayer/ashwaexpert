type AnalyticsEvent =
  // Funnel events
  | "pincode_check_started"
  | "pincode_check_success"
  | "quiz_started"
  | "quiz_completed"
  | "plan_viewed"
  | "plan_selected"
  | "checkout_started"
  | "slot_selected"
  | "payment_initiated"
  | "payment_success"
  | "payment_failed"
  // Lead events
  | "lead_captured"
  | "whatsapp_clicked"
  | "callback_requested"
  // Addon events
  | "addon_viewed"
  | "addon_added"
  // Service events
  | "ticket_created"
  | "ticket_resolved"
  | "csat_submitted"
  // Auth events
  | "login_otp_requested"
  | "login_otp_sent"
  | "login_otp_verify_started"
  | "login_success"
  | "login_otp_invalid"
  | "login_otp_resent"
  | "signup_started"
  | "signup_otp_requested"
  | "signup_otp_sent"
  | "signup_completed"
  | "logout"
  // Portal events
  | "subscription_viewed"
  | "payment_retry_clicked"
  | "invoice_downloaded"
  | "service_request_started"
  | "profile_updated"
  // Corporate/Business events
  | "corporate_inquiry_submitted"
  // Referral events
  | "referral_shared"
  | "referral_copied";

type EventPayload = Record<string, string | number | boolean | undefined>;

export function track(event: AnalyticsEvent, payload?: EventPayload): void {
  // Development logging
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${event}`, payload);
  }

  // Google Analytics (if configured)
  if (typeof window !== "undefined" && "gtag" in window) {
    (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag(
      "event",
      event,
      payload
    );
  }

  // Meta Pixel (if configured)
  if (typeof window !== "undefined" && "fbq" in window) {
    (window as typeof window & { fbq: (...args: unknown[]) => void }).fbq(
      "trackCustom",
      event,
      payload
    );
  }
}
