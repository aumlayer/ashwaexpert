"""In-code notification templates. Keys: payment_success, payment_failed, invoice_generated, due_reminder, overdue_reminder."""

TEMPLATES = {
    "payment_success": {
        "sms": "Payment of INR {amount} received. Ref: {reference}. Thank you!",
        "email_subject": "Payment Received - INR {amount}",
        "email_body": "Your payment of INR {amount} has been received. Reference: {reference}. Thank you for your business.",
    },
    "payment_failed": {
        "sms": "Payment of INR {amount} could not be processed. Ref: {reference}. Please retry or contact support.",
        "email_subject": "Payment Failed - INR {amount}",
        "email_body": "We could not process your payment of INR {amount}. Reference: {reference}. Please try again or contact support.",
    },
    "invoice_generated": {
        "sms": "Invoice {invoice_number} for INR {total_amount} has been generated. Please find it in your account.",
        "email_subject": "Invoice {invoice_number} Generated",
        "email_body": "Your invoice {invoice_number} for INR {total_amount} has been generated. You can download it from your account.",
    },
    "due_reminder": {
        "sms": "Reminder: Invoice {invoice_number} for INR {total_amount} is due on {due_date}. Please pay to avoid late fees.",
        "email_subject": "Payment Reminder - Invoice {invoice_number}",
        "email_body": "This is a reminder that invoice {invoice_number} for INR {total_amount} is due on {due_date}. Please pay to avoid late fees.",
    },
    "overdue_reminder": {
        "sms": "Overdue: Invoice {invoice_number} for INR {total_amount} is overdue. Please pay at the earliest.",
        "email_subject": "Overdue Notice - Invoice {invoice_number}",
        "email_body": "Invoice {invoice_number} for INR {total_amount} is overdue. Please pay at the earliest to avoid further action.",
    },
    "ticket_created": {
        "sms": "Your service request {ticket_number} has been created. We will contact you shortly.",
        "email_subject": "Service Request Created - {ticket_number}",
        "email_body": "Your service request {ticket_number} ({ticket_type}) has been created. We will assign a technician and contact you shortly.",
    },
    "job_assigned": {
        "sms": "New job assigned: Ticket {ticket_number} - {title}. Please check your app for details.",
        "email_subject": "New Job Assigned - {ticket_number}",
        "email_body": "You have been assigned a new job: Ticket {ticket_number} - {title}. Please check your app for details and accept the assignment.",
    },
    "job_completed": {
        "sms": "Your service request {ticket_number} has been completed. Thank you for choosing us!",
        "email_subject": "Service Request Completed - {ticket_number}",
        "email_body": "Your service request {ticket_number} has been completed by our technician. Thank you for choosing us!",
    },
    "sla_breach": {
        "sms": "Alert: Ticket {ticket_number} SLA deadline has passed. Please escalate.",
        "email_subject": "SLA Breach Alert - {ticket_number}",
        "email_body": "Ticket {ticket_number} has exceeded its SLA deadline. Please review and escalate if needed.",
    },
    "subscription_plan_change_requested": {
        "sms": "Your subscription plan change request has been received. It will be applied on {effective_at}.",
        "email_subject": "Subscription Plan Change Requested",
        "email_body": "Your subscription plan change request has been received. The new plan will be applied on {effective_at}. You will receive a confirmation once the change is processed.",
    },
    "subscription_plan_changed": {
        "sms": "Your subscription plan has been changed successfully. New plan is now active.",
        "email_subject": "Subscription Plan Changed",
        "email_body": "Your subscription plan has been changed successfully. Your new plan is now active. If you have any questions, please contact support.",
    },
    "subscription_cancellation_requested": {
        "sms": "Your subscription cancellation request has been received. It will be effective on {effective_at}.",
        "email_subject": "Subscription Cancellation Requested",
        "email_body": "Your subscription cancellation request has been received. Your subscription will be cancelled on {effective_at}. You will continue to have access until then.",
    },
    "subscription_cancelled": {
        "sms": "Your subscription has been cancelled as requested. Thank you for being with us.",
        "email_subject": "Subscription Cancelled",
        "email_body": "Your subscription has been cancelled as requested. We're sorry to see you go. If you change your mind, you can reactivate your subscription anytime.",
    },
    "lead_created": {
        "sms": "Thanks {name}! We received your request for {service_category}. Our team will contact you soon.",
        "email_subject": "We received your request",
        "email_body": "Thanks {name}! We received your request for {service_category}. Our team will contact you soon.",
    },
    "lead_created_internal": {
        "sms": "New lead: {name}, {phone}, {city}, {service_category}. LeadID: {lead_id}",
        "email_subject": "New lead created - {name}",
        "email_body": "New lead created.\n\nName: {name}\nPhone: {phone}\nEmail: {email}\nCity: {city}\nService: {service_category}\nSource: {source}\nLeadID: {lead_id}\n",
    },
}


def get_template(template_key: str, channel: str) -> str | None:
    t = TEMPLATES.get(template_key)
    if not t:
        return None
    if channel == "sms":
        return t.get("sms")
    if channel == "email":
        return t.get("email_body")
    return None


def get_email_subject(template_key: str) -> str | None:
    t = TEMPLATES.get(template_key)
    if not t:
        return None
    return t.get("email_subject")
