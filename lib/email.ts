// lib/email.ts
// Shared email service using Resend with SalonixPro branded templates

import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY!);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://salonixpro.com";
const FROM_EMAIL = "SalonixPro <noreply@salonixpro.com>";

// ─── Base Template ────────────────────────────────────────────────────────────

function baseTemplate(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</span>` : ""}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <!-- Logo -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #0d9488, #14b8a6); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle;">
            <span style="color: white; font-size: 24px; line-height: 48px;">&#9986;</span>
          </div>
          <span style="font-size: 24px; font-weight: bold; color: #1a1a1a; vertical-align: middle; margin-left: 12px;">SalonixPro</span>
        </div>
      </div>
      ${content}
    </div>
    <!-- Brand footer -->
    <p style="color: #999; font-size: 12px; text-align: center; margin: 24px 0 0;">
      SalonixPro &middot; One system. One salon. Total control.
    </p>
  </div>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="font-size: 24px; font-weight: bold; color: #1a1a1a; margin: 0 0 16px; text-align: center;">${text}</h1>`;
}

function paragraph(text: string, center = false): string {
  return `<p style="color: #666; margin: 0 0 16px;${center ? " text-align: center;" : ""}">${text}</p>`;
}

function button(text: string, url: string): string {
  return `<div style="text-align: center; margin: 32px 0;">
    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #14b8a6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">${text}</a>
  </div>`;
}

function divider(): string {
  return `<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">`;
}

function infoBox(label: string, value: string): string {
  return `<div style="background: #f0fdfa; border-radius: 8px; padding: 16px; margin: 8px 0; display: flex; justify-content: space-between;">
    <span style="color: #666; font-size: 14px;">${label}</span>
    <span style="color: #0d9488; font-weight: 600; font-size: 14px;">${value}</span>
  </div>`;
}

function detailsTable(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows
    .map(
      (r) =>
        `<tr><td style="padding: 10px 16px; color: #666; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${r.label}</td><td style="padding: 10px 16px; color: #1a1a1a; font-weight: 600; font-size: 14px; text-align: right; border-bottom: 1px solid #f0f0f0;">${r.value}</td></tr>`
    )
    .join("");
  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #fafafa; border-radius: 8px; overflow: hidden;">${rowsHtml}</table>`;
}

function warningBox(text: string): string {
  return `<div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">${text}</p>
  </div>`;
}

function successBox(text: string): string {
  return `<div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p style="color: #166534; font-size: 14px; margin: 0; font-weight: 500;">${text}</p>
  </div>`;
}

function footer(text: string): string {
  return `${divider()}<p style="color: #999; font-size: 13px; text-align: center; margin: 0;">${text}</p>`;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function fmtCurrency(amount: number, symbol: string = "EC$"): string {
  return `${symbol} ${Number(amount).toFixed(2)}`;
}

function fmtDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function fmtTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ─── Email Types ──────────────────────────────────────────────────────────────

// 1. Welcome Email (on signup)
export async function sendWelcomeEmail(params: {
  to: string;
  firstName: string;
  businessName: string;
  trialEndsAt: Date;
}) {
  const { to, firstName, businessName, trialEndsAt } = params;
  const trialDate = fmtDate(trialEndsAt);

  const html = baseTemplate(
    `${heading("Welcome to SalonixPro!")}
    ${paragraph(`Hi ${firstName},`, true)}
    ${paragraph(`Your salon <strong>${businessName}</strong> is now set up and ready to go. You have full access to all features during your free trial.`, true)}
    ${detailsTable([
      { label: "Salon", value: businessName },
      { label: "Free trial ends", value: trialDate },
    ])}
    ${successBox("Your trial includes unlimited appointments, clients, staff, products, and full financial reporting.")}
    ${button("Go to Dashboard", `${APP_URL}/dashboard`)}
    ${paragraph("Here's what to do next:", false)}
    <ol style="color: #666; font-size: 14px; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Add your services and set your prices</li>
      <li style="margin-bottom: 8px;">Add your stylists and their schedules</li>
      <li style="margin-bottom: 8px;">Share your booking page with clients</li>
    </ol>
    ${footer("Questions? Reply to this email and we'll help you get set up.")}`,
    `Welcome to SalonixPro! Your salon ${businessName} is ready.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `Welcome to SalonixPro, ${firstName}!`, html });
}

// 2. Appointment Confirmation (to client)
export async function sendAppointmentConfirmation(params: {
  to: string;
  clientName: string;
  businessName: string;
  stylistName: string;
  date: Date | string;
  duration: number;
  services: string[];
  totalPrice: number;
  currencySymbol: string;
  bookingReference?: string;
  notes?: string;
}) {
  const { to, clientName, businessName, stylistName, date, duration, services, totalPrice, currencySymbol, bookingReference, notes } = params;

  const html = baseTemplate(
    `${heading("Appointment Confirmed")}
    ${paragraph(`Hi ${clientName},`, true)}
    ${paragraph(`Your appointment at <strong>${businessName}</strong> has been confirmed.`, true)}
    ${detailsTable([
      { label: "Date", value: fmtDate(date) },
      { label: "Time", value: fmtTime(date) },
      { label: "Duration", value: fmtDuration(duration) },
      { label: "Stylist", value: stylistName },
      { label: "Services", value: services.join(", ") },
      { label: "Total", value: fmtCurrency(totalPrice, currencySymbol) },
      ...(bookingReference ? [{ label: "Reference", value: bookingReference }] : []),
    ])}
    ${notes ? warningBox(`Note: ${notes}`) : ""}
    ${footer(`Need to cancel or reschedule? Contact ${businessName} directly.`)}`,
    `Your appointment at ${businessName} on ${fmtDate(date)} is confirmed.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `Appointment Confirmed - ${businessName}`, html });
}

// 3. Appointment Reminder (24hrs before)
export async function sendAppointmentReminder(params: {
  to: string;
  clientName: string;
  businessName: string;
  stylistName: string;
  date: Date | string;
  duration: number;
  services: string[];
  totalPrice: number;
  currencySymbol: string;
  businessAddress?: string;
}) {
  const { to, clientName, businessName, stylistName, date, duration, services, totalPrice, currencySymbol, businessAddress } = params;

  const html = baseTemplate(
    `${heading("Appointment Reminder")}
    ${paragraph(`Hi ${clientName},`, true)}
    ${paragraph(`Just a reminder that your appointment at <strong>${businessName}</strong> is <strong>tomorrow</strong>.`, true)}
    ${detailsTable([
      { label: "Date", value: fmtDate(date) },
      { label: "Time", value: fmtTime(date) },
      { label: "Duration", value: fmtDuration(duration) },
      { label: "Stylist", value: stylistName },
      { label: "Services", value: services.join(", ") },
      { label: "Total", value: fmtCurrency(totalPrice, currencySymbol) },
    ])}
    ${businessAddress ? paragraph(`<strong>Location:</strong> ${businessAddress}`) : ""}
    ${warningBox("Please arrive 5-10 minutes early. If you need to cancel or reschedule, please contact us as soon as possible.")}
    ${footer(`See you tomorrow! - ${businessName}`)}`,
    `Reminder: Your appointment at ${businessName} is tomorrow at ${fmtTime(date)}.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `Reminder: Appointment Tomorrow - ${businessName}`, html });
}

// 4. Appointment Cancellation (to client)
export async function sendAppointmentCancellation(params: {
  to: string;
  clientName: string;
  businessName: string;
  date: Date | string;
  services: string[];
  cancelReason?: string;
  bookingReference?: string;
}) {
  const { to, clientName, businessName, date, services, cancelReason, bookingReference } = params;

  const html = baseTemplate(
    `${heading("Appointment Cancelled")}
    ${paragraph(`Hi ${clientName},`, true)}
    ${paragraph(`Your appointment at <strong>${businessName}</strong> has been cancelled.`, true)}
    ${detailsTable([
      { label: "Date", value: fmtDate(date) },
      { label: "Time", value: fmtTime(date) },
      { label: "Services", value: services.join(", ") },
      ...(bookingReference ? [{ label: "Reference", value: bookingReference }] : []),
    ])}
    ${cancelReason ? warningBox(`Reason: ${cancelReason}`) : ""}
    ${paragraph("Would you like to rebook? Contact us or visit our booking page to schedule a new appointment.", true)}
    ${button("Book Again", `${APP_URL}`)}
    ${footer(`We hope to see you again soon! - ${businessName}`)}`,
    `Your appointment at ${businessName} on ${fmtDate(date)} has been cancelled.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `Appointment Cancelled - ${businessName}`, html });
}

// 5. New Booking Notification (to salon owner/staff)
export async function sendNewBookingNotification(params: {
  to: string;
  businessName: string;
  clientName: string;
  clientPhone?: string;
  stylistName: string;
  date: Date | string;
  services: string[];
  totalPrice: number;
  currencySymbol: string;
  bookingReference?: string;
  requiresDeposit: boolean;
  depositAmount?: number;
}) {
  const { to, businessName, clientName, clientPhone, stylistName, date, services, totalPrice, currencySymbol, bookingReference, requiresDeposit, depositAmount } = params;

  const html = baseTemplate(
    `${heading("New Booking Received")}
    ${successBox(`A new appointment has been booked at ${businessName}.`)}
    ${detailsTable([
      { label: "Client", value: clientName },
      ...(clientPhone ? [{ label: "Phone", value: clientPhone }] : []),
      { label: "Date", value: fmtDate(date) },
      { label: "Time", value: fmtTime(date) },
      { label: "Stylist", value: stylistName },
      { label: "Services", value: services.join(", ") },
      { label: "Total", value: fmtCurrency(totalPrice, currencySymbol) },
      ...(bookingReference ? [{ label: "Reference", value: bookingReference }] : []),
    ])}
    ${requiresDeposit && depositAmount ? warningBox(`Deposit required: ${fmtCurrency(depositAmount, currencySymbol)}. Awaiting client payment.`) : ""}
    ${button("View Appointments", `${APP_URL}/appointments`)}
    ${footer("You received this because a new booking was made.")}`,
    `New booking from ${clientName} on ${fmtDate(date)}.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `New Booking: ${clientName} - ${fmtDate(date)}`, html });
}

// 6. Deposit Submitted (to salon - client says they paid)
export async function sendDepositSubmittedNotification(params: {
  to: string;
  businessName: string;
  clientName: string;
  depositAmount: number;
  currencySymbol: string;
  bookingReference: string;
  date: Date | string;
}) {
  const { to, businessName, clientName, depositAmount, currencySymbol, bookingReference, date } = params;

  const html = baseTemplate(
    `${heading("Payment Submitted")}
    ${warningBox("A client has submitted payment confirmation. Please verify and confirm.")}
    ${detailsTable([
      { label: "Client", value: clientName },
      { label: "Amount", value: fmtCurrency(depositAmount, currencySymbol) },
      { label: "Booking Ref", value: bookingReference },
      { label: "Appointment", value: `${fmtDate(date)} at ${fmtTime(date)}` },
    ])}
    ${paragraph("Please check your bank account and confirm or reject the payment in SalonixPro.", true)}
    ${button("Review Payment", `${APP_URL}/appointments`)}
    ${footer("Action required: Verify this payment.")}`,
    `${clientName} submitted deposit payment for ${bookingReference}.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `Payment Submitted: ${bookingReference} - Review Required`, html });
}

// 7. Deposit Confirmed (to client)
export async function sendDepositConfirmed(params: {
  to: string;
  clientName: string;
  businessName: string;
  depositAmount: number;
  currencySymbol: string;
  bookingReference: string;
  date: Date | string;
}) {
  const { to, clientName, businessName, depositAmount, currencySymbol, bookingReference, date } = params;

  const html = baseTemplate(
    `${heading("Payment Confirmed")}
    ${paragraph(`Hi ${clientName},`, true)}
    ${successBox(`Your deposit of ${fmtCurrency(depositAmount, currencySymbol)} has been confirmed by ${businessName}.`)}
    ${detailsTable([
      { label: "Amount", value: fmtCurrency(depositAmount, currencySymbol) },
      { label: "Booking Ref", value: bookingReference },
      { label: "Appointment", value: `${fmtDate(date)} at ${fmtTime(date)}` },
    ])}
    ${paragraph("Your appointment is confirmed. We look forward to seeing you!", true)}
    ${footer(`Thank you! - ${businessName}`)}`,
    `Your deposit for ${bookingReference} has been confirmed.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `Payment Confirmed - ${businessName}`, html });
}

// 8. Deposit Rejected (to client)
export async function sendDepositRejected(params: {
  to: string;
  clientName: string;
  businessName: string;
  depositAmount: number;
  currencySymbol: string;
  bookingReference: string;
  date: Date | string;
  paymentDeadline?: Date | string;
}) {
  const { to, clientName, businessName, depositAmount, currencySymbol, bookingReference, date, paymentDeadline } = params;

  const html = baseTemplate(
    `${heading("Payment Not Confirmed")}
    ${paragraph(`Hi ${clientName},`, true)}
    ${warningBox(`${businessName} was unable to verify your deposit of ${fmtCurrency(depositAmount, currencySymbol)}.`)}
    ${detailsTable([
      { label: "Amount Due", value: fmtCurrency(depositAmount, currencySymbol) },
      { label: "Booking Ref", value: bookingReference },
      { label: "Appointment", value: `${fmtDate(date)} at ${fmtTime(date)}` },
      ...(paymentDeadline ? [{ label: "Payment Deadline", value: `${fmtDate(paymentDeadline)} at ${fmtTime(paymentDeadline)}` }] : []),
    ])}
    ${paragraph("Please re-submit your payment or contact the salon directly to resolve this. Your appointment may be cancelled if payment is not received by the deadline.", true)}
    ${footer(`Questions? Contact ${businessName} directly.`)}`,
    `Your deposit for ${bookingReference} could not be verified.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `Payment Issue - ${businessName}`, html });
}

// 9. Deposit Expired / Auto-Cancelled (to client)
export async function sendDepositExpired(params: {
  to: string;
  clientName: string;
  businessName: string;
  bookingReference: string;
  date: Date | string;
}) {
  const { to, clientName, businessName, bookingReference, date } = params;

  const html = baseTemplate(
    `${heading("Booking Cancelled")}
    ${paragraph(`Hi ${clientName},`, true)}
    ${warningBox("Your booking has been automatically cancelled because the deposit payment deadline has passed.")}
    ${detailsTable([
      { label: "Booking Ref", value: bookingReference },
      { label: "Appointment", value: `${fmtDate(date)} at ${fmtTime(date)}` },
    ])}
    ${paragraph("If this was a mistake, please rebook or contact the salon directly.", true)}
    ${button("Book Again", `${APP_URL}`)}
    ${footer(`We hope to see you soon! - ${businessName}`)}`,
    `Your booking ${bookingReference} was cancelled due to missed payment deadline.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `Booking Cancelled - Payment Deadline Passed`, html });
}

// 10. Payment Deadline Warning (to client)
export async function sendPaymentDeadlineWarning(params: {
  to: string;
  clientName: string;
  businessName: string;
  depositAmount: number;
  currencySymbol: string;
  bookingReference: string;
  date: Date | string;
  paymentDeadline: Date | string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  paymentInstructions?: string;
}) {
  const { to, clientName, businessName, depositAmount, currencySymbol, bookingReference, date, paymentDeadline, bankName, bankAccountName, bankAccountNumber, paymentInstructions } = params;

  const bankDetails = bankName
    ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="font-weight: 600; color: #1a1a1a; margin: 0 0 8px;">Bank Transfer Details:</p>
        <p style="color: #666; font-size: 14px; margin: 0;">
          Bank: ${bankName}<br>
          Account Name: ${bankAccountName || ""}<br>
          Account Number: ${bankAccountNumber || ""}<br>
          ${paymentInstructions ? `Instructions: ${paymentInstructions}` : ""}
        </p>
      </div>`
    : "";

  const html = baseTemplate(
    `${heading("Payment Deadline Approaching")}
    ${paragraph(`Hi ${clientName},`, true)}
    ${warningBox(`Your deposit payment for booking ${bookingReference} is due soon. Your booking will be automatically cancelled if payment is not received.`)}
    ${detailsTable([
      { label: "Amount Due", value: fmtCurrency(depositAmount, currencySymbol) },
      { label: "Deadline", value: `${fmtDate(paymentDeadline)} at ${fmtTime(paymentDeadline)}` },
      { label: "Appointment", value: `${fmtDate(date)} at ${fmtTime(date)}` },
    ])}
    ${bankDetails}
    ${paragraph("After making the payment, please confirm it through the booking page.", true)}
    ${footer(`Don't lose your spot! - ${businessName}`)}`,
    `Urgent: Payment deadline approaching for your ${businessName} booking.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `Urgent: Payment Due Soon - ${businessName}`, html });
}

// 11. Order Confirmation (to customer)
export async function sendOrderConfirmation(params: {
  to: string;
  customerName: string;
  businessName: string;
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  currencySymbol: string;
  paymentMethod?: string;
  pickupDate?: Date | string;
}) {
  const { to, customerName, businessName, orderNumber, items, subtotal, discount, total, currencySymbol, paymentMethod, pickupDate } = params;

  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 16px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${item.name}</td>
          <td style="padding: 10px 16px; color: #666; font-size: 14px; text-align: center; border-bottom: 1px solid #f0f0f0;">x${item.quantity}</td>
          <td style="padding: 10px 16px; color: #1a1a1a; font-weight: 600; font-size: 14px; text-align: right; border-bottom: 1px solid #f0f0f0;">${fmtCurrency(item.price, currencySymbol)}</td>
        </tr>`
    )
    .join("");

  const html = baseTemplate(
    `${heading("Order Confirmation")}
    ${paragraph(`Hi ${customerName},`, true)}
    ${paragraph(`Thank you for your order at <strong>${businessName}</strong>!`, true)}
    ${successBox(`Order #${orderNumber} has been placed.`)}
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #fafafa; border-radius: 8px; overflow: hidden;">
      <tr style="background: #f0f0f0;">
        <th style="padding: 10px 16px; text-align: left; font-size: 13px; color: #666;">Item</th>
        <th style="padding: 10px 16px; text-align: center; font-size: 13px; color: #666;">Qty</th>
        <th style="padding: 10px 16px; text-align: right; font-size: 13px; color: #666;">Price</th>
      </tr>
      ${itemRows}
    </table>
    ${detailsTable([
      { label: "Subtotal", value: fmtCurrency(subtotal, currencySymbol) },
      ...(discount > 0 ? [{ label: "Discount", value: `-${fmtCurrency(discount, currencySymbol)}` }] : []),
      { label: "Total", value: fmtCurrency(total, currencySymbol) },
      ...(paymentMethod ? [{ label: "Payment", value: paymentMethod }] : []),
      ...(pickupDate ? [{ label: "Pickup Date", value: fmtDate(pickupDate) }] : []),
    ])}
    ${footer(`Thank you for shopping with us! - ${businessName}`)}`,
    `Order #${orderNumber} confirmed at ${businessName}.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `Order Confirmed #${orderNumber} - ${businessName}`, html });
}

// 12. Password Reset (refactored from inline)
export async function sendPasswordReset(params: {
  to: string;
  firstName: string;
  tempPassword: string;
}) {
  const { to, firstName, tempPassword } = params;

  const html = baseTemplate(
    `${heading("Your temporary password")}
    ${paragraph(`Hi ${firstName || "there"},<br>We received a request to reset your password. Here's your temporary password:`, true)}
    <div style="background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="color: #666; font-size: 14px; margin: 0 0 8px;">Your temporary password:</p>
      <p style="font-size: 32px; font-weight: bold; color: #0d9488; margin: 0; letter-spacing: 4px; font-family: monospace;">${tempPassword}</p>
    </div>
    ${warningBox("&#9888;&#65039; Important: You will be required to change this password when you log in.")}
    ${button("Sign In Now", `${APP_URL}/login`)}
    ${footer("If you didn't request this, please contact support immediately.<br>Someone may have access to your account.")}`,
    `Your temporary password for SalonixPro.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: "Your temporary password - SalonixPro", html });
}

// 13. Portal Verification Code (to client)
export async function sendPortalVerificationCode(params: {
  to: string;
  code: string;
  clientName: string;
}) {
  const { to, code, clientName } = params;

  const html = baseTemplate(
    `${heading("Your Verification Code")}
    ${paragraph(`Hi ${clientName},`, true)}
    ${paragraph("Use the code below to access your SalonixPro client portal.", true)}
    <div style="background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="color: #666; font-size: 14px; margin: 0 0 8px;">Your verification code:</p>
      <p style="font-size: 40px; font-weight: bold; color: #0d9488; margin: 0; letter-spacing: 8px; font-family: monospace;">${code}</p>
    </div>
    ${warningBox("This code expires in 10 minutes.")}
    ${footer("If you didn't request this code, you can safely ignore this email.")}`,
    `Your SalonixPro verification code is ${code}.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `${code} - Your SalonixPro Verification Code`, html });
}

// 14. Team Member Invite
export async function sendTeamInvite(params: {
  to: string;
  firstName: string;
  businessName: string;
  username: string;
  tempPassword: string;
  role: string;
}) {
  const { to, firstName, businessName, username, tempPassword, role } = params;

  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  const html = baseTemplate(
    `${heading("You're invited to SalonixPro!")}
    ${paragraph(`Hi ${firstName},<br>You've been added as a <strong>${roleLabel}</strong> at <strong>${businessName}</strong>. Use the credentials below to sign in:`, true)}
    ${detailsTable([
      { label: "Username", value: username },
      { label: "Temporary Password", value: tempPassword },
      { label: "Role", value: roleLabel },
    ])}
    ${warningBox("&#9888;&#65039; You will be asked to change your password on first login.")}
    ${button("Sign In Now", `${APP_URL}/login`)}
    ${footer("If you weren't expecting this invite, you can safely ignore this email.")}`,
    `You've been invited to join ${businessName} on SalonixPro.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `You're invited to ${businessName} on SalonixPro`, html });
}

// 15. Beta Signup Confirmation (to applicant)
export async function sendBetaConfirmation(params: {
  to: string;
  name: string;
  salonName: string;
}) {
  const { to, name, salonName } = params;

  const html = baseTemplate(
    `${heading("Beta Application Received!")}
    ${paragraph(`Hi ${name},`, true)}
    ${successBox("Thank you for signing up for the SalonixPro beta program!")}
    ${paragraph(`We've received your application for <strong>${salonName}</strong>. Our team will review it and get back to you shortly.`, true)}
    ${detailsTable([
      { label: "Salon", value: salonName },
      { label: "Status", value: "Under Review" },
    ])}
    ${paragraph("As a beta tester, you'll get:", false)}
    <ul style="color: #666; font-size: 14px; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Free access during the beta period</li>
      <li style="margin-bottom: 8px;">Discounted pricing at launch</li>
      <li style="margin-bottom: 8px;">Direct input on features</li>
      <li style="margin-bottom: 8px;">Priority support</li>
    </ul>
    ${footer("We'll email you when your application is approved. Stay tuned!")}`,
    `Thanks for signing up for the SalonixPro beta, ${name}!`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: "Beta Application Received - SalonixPro", html });
}

// 16. Beta Admin Notification (to admin)
export async function sendBetaAdminNotification(params: {
  to: string;
  applicantName: string;
  applicantEmail: string;
  salonName: string;
  phone: string | null;
  country: string | null;
  salonSize: string | null;
  message: string | null;
}) {
  const { to, applicantName, applicantEmail, salonName, phone, country, salonSize, message } = params;

  const html = baseTemplate(
    `${heading("New Beta Signup")}
    ${warningBox("A new beta application has been submitted. Review and approve or reject.")}
    ${detailsTable([
      { label: "Name", value: applicantName },
      { label: "Email", value: applicantEmail },
      { label: "Salon", value: salonName },
      ...(phone ? [{ label: "Phone", value: phone }] : []),
      ...(country ? [{ label: "Country", value: country }] : []),
      ...(salonSize ? [{ label: "Salon Size", value: `${salonSize} staff` }] : []),
    ])}
    ${message ? `${paragraph("<strong>Message:</strong>")}${paragraph(message)}` : ""}
    ${button("Review Application", `${APP_URL}/admin/beta`)}
    ${footer("You received this because a new beta signup was submitted.")}`,
    `New beta signup from ${applicantName} (${salonName}).`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `New Beta Signup: ${applicantName} - ${salonName}`, html });
}

// 17. Beta Approved (to applicant)
export async function sendBetaApproved(params: {
  to: string;
  name: string;
  salonName: string;
}) {
  const { to, name, salonName } = params;

  const html = baseTemplate(
    `${heading("You're In! Welcome to the Beta")}
    ${paragraph(`Hi ${name},`, true)}
    ${successBox("Your beta application has been approved! You now have access to the full SalonixPro platform.")}
    ${paragraph(`Your salon <strong>${salonName}</strong> is ready to get started. Create your account to begin setting up your salon.`, true)}
    ${button("Create Your Account", `${APP_URL}/signup`)}
    ${paragraph("As a beta tester, you enjoy:", false)}
    <ul style="color: #666; font-size: 14px; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Full access to all features — completely free</li>
      <li style="margin-bottom: 8px;">Special pricing when we launch publicly</li>
      <li style="margin-bottom: 8px;">Priority support from our team</li>
    </ul>
    ${footer("Questions? Reply to this email and we'll help you get started.")}`,
    `You're approved for the SalonixPro beta, ${name}!`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: "You're Approved! Welcome to SalonixPro Beta", html });
}

// 18. Beta Auto-Approved Welcome (to applicant - account created)
export async function sendBetaWelcome(params: {
  to: string;
  name: string;
  salonName: string;
  username: string;
  tempPassword: string;
  bookingUrl: string;
  trialEndsAt: Date;
}) {
  const { to, name, salonName, username, tempPassword, bookingUrl, trialEndsAt } = params;

  const html = baseTemplate(
    `${heading("Welcome to SalonixPro!")}
    ${paragraph(`Hi ${name},`, true)}
    ${successBox("Your beta application has been approved and your salon account is ready!")}
    ${paragraph(`Your salon <strong>${salonName}</strong> has been set up with a <strong>1-month free beta</strong> period. Here are your login credentials:`, true)}
    ${detailsTable([
      { label: "Login URL", value: `<a href="${APP_URL}/login" style="color: #0d9488;">${APP_URL}/login</a>` },
      { label: "Username", value: username },
      { label: "Temporary Password", value: tempPassword },
      { label: "Booking Page", value: `<a href="${bookingUrl}" style="color: #0d9488;">${bookingUrl}</a>` },
      { label: "Beta Ends", value: fmtDate(trialEndsAt) },
    ])}
    ${warningBox("&#9888;&#65039; You must change your password on first login.")}
    ${button("Sign In Now", `${APP_URL}/login`)}
    ${paragraph("What's included in your beta:", false)}
    <ul style="color: #666; font-size: 14px; padding-left: 20px;">
      <li style="margin-bottom: 8px;"><strong>1 month free</strong> — all features unlocked</li>
      <li style="margin-bottom: 8px;">Appointments, clients, services, and team management</li>
      <li style="margin-bottom: 8px;">Online booking page for your clients</li>
      <li style="margin-bottom: 8px;">Financial reporting (expenses, payroll, P&L)</li>
      <li style="margin-bottom: 8px;">Priority support from our team</li>
    </ul>
    ${footer("Questions? Reply to this email and we'll help you get started.")}`,
    `Welcome to SalonixPro! Your salon ${salonName} is ready.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `Welcome to SalonixPro, ${name}! Your account is ready`, html });
}

// 19. Beta Rejected (to applicant)
export async function sendBetaRejected(params: {
  to: string;
  name: string;
  salonName: string;
}) {
  const { to, name, salonName } = params;

  const html = baseTemplate(
    `${heading("Beta Application Update")}
    ${paragraph(`Hi ${name},`, true)}
    ${paragraph(`Thank you for your interest in SalonixPro for <strong>${salonName}</strong>.`, true)}
    ${paragraph("Unfortunately, we're unable to include you in this round of our beta program. We have limited spots and had to make difficult decisions.", true)}
    ${paragraph("Don't worry — we'll keep your information on file and notify you when SalonixPro launches publicly. You'll still be eligible for early-bird pricing.", true)}
    ${button("Visit SalonixPro", `${APP_URL}`)}
    ${footer("Thank you for your interest. We hope to welcome you soon!")}`,
    `Update on your SalonixPro beta application.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: "Beta Application Update - SalonixPro", html });
}

// 20. Beta Admin Invite (to new salon owner - invited by admin)
export async function sendBetaInvite(params: {
  to: string;
  name: string;
  salonName: string;
  username: string;
  tempPassword: string;
  bookingUrl: string;
  trialEndsAt: Date;
  betaDays: number;
  personalMessage: string | null;
}) {
  const { to, name, salonName, username, tempPassword, bookingUrl, trialEndsAt, betaDays, personalMessage } = params;

  const html = baseTemplate(
    `${heading("You've Been Invited to SalonixPro!")}
    ${paragraph(`Hi ${name},`, true)}
    ${successBox("You've been personally invited to try SalonixPro — the all-in-one salon management platform.")}
    ${personalMessage ? `<div style="background: #f0f9ff; border-left: 4px solid #0d9488; border-radius: 0 8px 8px 0; padding: 16px; margin: 16px 0;">
      <p style="color: #666; font-size: 14px; margin: 0; font-style: italic;">"${personalMessage}"</p>
      <p style="color: #999; font-size: 12px; margin: 8px 0 0;">— SalonixPro Team</p>
    </div>` : ""}
    ${paragraph(`Your salon <strong>${salonName}</strong> has been set up with <strong>${betaDays} days of free access</strong>. Here are your login credentials:`, true)}
    ${detailsTable([
      { label: "Login URL", value: `<a href="${APP_URL}/login" style="color: #0d9488;">${APP_URL}/login</a>` },
      { label: "Username", value: username },
      { label: "Temporary Password", value: tempPassword },
      { label: "Booking Page", value: `<a href="${bookingUrl}" style="color: #0d9488;">${bookingUrl}</a>` },
      { label: "Free Access Until", value: fmtDate(trialEndsAt) },
    ])}
    ${warningBox("&#9888;&#65039; You must change your password on first login.")}
    ${button("Sign In Now", `${APP_URL}/login`)}
    ${paragraph("What's included:", false)}
    <ul style="color: #666; font-size: 14px; padding-left: 20px;">
      <li style="margin-bottom: 8px;"><strong>All features unlocked</strong> — appointments, clients, services, team management</li>
      <li style="margin-bottom: 8px;">Online booking page for your clients</li>
      <li style="margin-bottom: 8px;">Financial reporting (expenses, payroll, P&L)</li>
      <li style="margin-bottom: 8px;">Product inventory and POS</li>
      <li style="margin-bottom: 8px;">Priority support from our team</li>
    </ul>
    ${footer("Questions? Reply to this email and we'll help you get started.")}`,
    `You've been invited to try SalonixPro! Your salon ${salonName} is ready.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `You're invited to SalonixPro, ${name}!`, html });
}

// 21. Review Request (to client after completed appointment)
export async function sendReviewRequest(params: {
  to: string;
  clientName: string;
  businessName: string;
  stylistName: string;
  services: string[];
  date: Date | string;
  token: string;
}) {
  const { to, clientName, businessName, stylistName, services, date, token } = params;
  const reviewBaseUrl = `${APP_URL}/review/${token}`;

  // Build 5 clickable star icons
  const stars = [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<a href="${reviewBaseUrl}?rating=${n}" style="text-decoration: none; font-size: 32px; color: #f59e0b; padding: 0 4px;">&#9733;</a>`
    )
    .join("");

  const html = baseTemplate(
    `${heading("How was your visit?")}
    ${paragraph(`Hi ${clientName},`, true)}
    ${paragraph(`Thank you for visiting <strong>${businessName}</strong>! We'd love to hear about your experience.`, true)}
    ${detailsTable([
      { label: "Date", value: fmtDate(date) },
      { label: "Services", value: services.join(", ") },
      { label: "Stylist", value: stylistName },
    ])}
    <div style="text-align: center; margin: 32px 0;">
      <p style="color: #666; font-size: 14px; margin: 0 0 12px;">Tap a star to rate your experience:</p>
      <div style="display: inline-block;">${stars}</div>
    </div>
    ${button("Leave a Review", reviewBaseUrl)}
    ${footer(`Thank you for choosing ${businessName}! Your feedback helps us improve.`)}`,
    `How was your visit to ${businessName}? Leave a quick review.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `How was your visit to ${businessName}?`, html });
}

// 22. Trial Extended Notification (to business owner)
export async function sendTrialExtended(params: {
  to: string;
  name: string;
  salonName: string;
  newTrialEnd: Date;
}) {
  const { to, name, salonName, newTrialEnd } = params;

  const html = baseTemplate(
    `${heading("Your Trial Has Been Extended!")}
    ${paragraph(`Hi ${name},`, true)}
    ${successBox(`Great news! Your free trial for <strong>${salonName}</strong> has been extended.`)}
    ${detailsTable([
      { label: "Salon", value: salonName },
      { label: "New Trial End Date", value: fmtDate(newTrialEnd) },
    ])}
    ${paragraph("You continue to have full access to all SalonixPro features. Make the most of your extended trial!", true)}
    ${button("Go to Dashboard", `${APP_URL}/dashboard`)}
    ${footer("Questions? Reply to this email and we'll help you out.")}`,
    `Your SalonixPro trial for ${salonName} has been extended.`
  );

  return getResend().emails.send({ from: FROM_EMAIL, to, subject: `Trial Extended - ${salonName}`, html });
}
