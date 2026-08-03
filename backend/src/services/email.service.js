const axios = require("axios");

/**
 * Thin wrapper around the Resend API (https://resend.com). No SDK dependency —
 * it's a single POST endpoint, so a direct axios call keeps this consistent
 * with the rest of the codebase (see partnerAuth.service.js).
 */
function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

async function sendEmail({ to, subject, html }) {
  if (!isConfigured()) {
    console.warn(`[email] RESEND_API_KEY not set — skipping send. Would have sent to ${to}: "${subject}"`);
    return { skipped: true };
  }

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  try {
    const { data } = await axios.post(
      "https://api.resend.com/emails",
      { from, to, subject, html },
      { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" } }
    );
    return data;
  } catch (err) {
    // Surface Resend's actual error message (e.g. "You can only send testing emails
    // to your own email address...") instead of just the HTTP status code.
    const resendMessage = err.response?.data?.message;
    if (resendMessage) err.message = `${err.message} — ${resendMessage}`;
    throw err;
  }
}

async function sendVerificationEmail({ to, name, code }) {
  return sendEmail({
    to,
    subject: "Verify your ParseMyCAS account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Hi ${name || ""},</p>
        <p>Your verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>This code expires in 15 minutes. If you didn't sign up for ParseMyCAS, you can ignore this email.</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail({ to, name, code }) {
  return sendEmail({
    to,
    subject: "Reset your ParseMyCAS password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Hi ${name || ""},</p>
        <p>Your password reset code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>This code expires in 15 minutes. If you didn't request this, you can ignore this email — your password won't be changed.</p>
      </div>
    `,
  });
}

async function sendAccountDeletedEmail({ to, name }) {
  return sendEmail({
    to,
    subject: "Your ParseMyCAS account has been deleted",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Account deleted</h2>
        <p>Hi ${name || ""},</p>
        <p>Your ParseMyCAS account and all saved statements have been permanently deleted, as requested.</p>
        <p>If you didn't do this, please contact us right away.</p>
      </div>
    `,
  });
}

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendAccountDeletedEmail, isConfigured };
