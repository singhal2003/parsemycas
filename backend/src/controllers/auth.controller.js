const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { pool } = require("../config/db");
const { validatePassword, generateVerificationCode } = require("../utils/password");
const { sendVerificationEmail, sendPasswordResetEmail, sendAccountDeletedEmail } = require("../services/email.service");

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
}

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, emailVerified: row.email_verified };
}

// ---- Email + password signup ----

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "name, email and password are required" });
    }
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ success: false, message: passwordError });

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await pool.query("SELECT id, email_verified FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0 && existing.rows[0].email_verified) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    let user;
    if (existing.rows.length > 0) {
      // Unverified signup retried — update instead of duplicate.
      const result = await pool.query(
        `UPDATE users SET name=$1, password_hash=$2, verification_code=$3, verification_code_expires_at=$4
         WHERE email=$5 RETURNING id, name, email, email_verified`,
        [name, passwordHash, code, expiresAt, normalizedEmail]
      );
      user = result.rows[0];
    } else {
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, verification_code, verification_code_expires_at)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, email_verified`,
        [name, normalizedEmail, passwordHash, code, expiresAt]
      );
      user = result.rows[0];
    }

    let emailSent = true;
    try {
      await sendVerificationEmail({ to: normalizedEmail, name, code });
    } catch (emailErr) {
      emailSent = false;
      console.error("Failed to send verification email:", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? "Account created. Check your email for a verification code."
        : "Account created, but the verification email could not be sent. Use 'resend code' to try again.",
      email: normalizedEmail,
    });
  } catch (e) {
    next(e);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, message: "email and code are required" });

    const normalizedEmail = email.toLowerCase().trim();
    const result = await pool.query(
      "SELECT id, name, email, email_verified, verification_code, verification_code_expires_at FROM users WHERE email = $1",
      [normalizedEmail]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ success: false, message: "No account found for this email" });
    if (user.email_verified) return res.status(400).json({ success: false, message: "Email is already verified" });

    if (user.verification_code !== code) {
      return res.status(400).json({ success: false, message: "Incorrect verification code" });
    }
    if (!user.verification_code_expires_at || new Date(user.verification_code_expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: "Verification code has expired. Request a new one." });
    }

    const updated = await pool.query(
      `UPDATE users SET email_verified = TRUE, verification_code = NULL, verification_code_expires_at = NULL
       WHERE id = $1 RETURNING id, name, email, email_verified`,
      [user.id]
    );

    const token = signToken(updated.rows[0]);
    res.json({ success: true, token, user: publicUser(updated.rows[0]) });
  } catch (e) {
    next(e);
  }
}

async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "email is required" });

    const normalizedEmail = email.toLowerCase().trim();
    const result = await pool.query("SELECT id, name, email_verified FROM users WHERE email = $1", [normalizedEmail]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ success: false, message: "No account found for this email" });
    if (user.email_verified) return res.status(400).json({ success: false, message: "Email is already verified" });

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query("UPDATE users SET verification_code=$1, verification_code_expires_at=$2 WHERE id=$3", [
      code,
      expiresAt,
      user.id,
    ]);
    try {
      await sendVerificationEmail({ to: normalizedEmail, name: user.name, code });
    } catch (emailErr) {
      console.error("Failed to resend verification email:", emailErr.message);
      return res.status(502).json({ success: false, message: "Could not send the email right now. Try again in a moment." });
    }

    res.json({ success: true, message: "Verification code resent" });
  } catch (e) {
    next(e);
  }
}

// ---- Login ----

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "email and password are required" });

    const normalizedEmail = email.toLowerCase().trim();
    const result = await pool.query(
      "SELECT id, name, email, password_hash, email_verified FROM users WHERE email = $1",
      [normalizedEmail]
    );
    const user = result.rows[0];
    if (!user || !user.password_hash) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: "Invalid email or password" });

    if (!user.email_verified) {
      return res.status(403).json({ success: false, message: "Please verify your email before logging in", requiresVerification: true });
    }

    const token = signToken(user);
    res.json({ success: true, token, user: publicUser(user) });
  } catch (e) {
    next(e);
  }
}

async function me(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT id, name, email, email_verified FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: publicUser(result.rows[0]) });
  } catch (e) {
    next(e);
  }
}

// ---- Forgot / reset password ----

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "email is required" });

    const normalizedEmail = email.toLowerCase().trim();
    const result = await pool.query("SELECT id, name FROM users WHERE email = $1", [normalizedEmail]);
    const user = result.rows[0];

    // Always respond the same way whether or not the account exists, so this
    // endpoint can't be used to check which emails have accounts.
    if (user) {
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await pool.query("UPDATE users SET verification_code=$1, verification_code_expires_at=$2 WHERE id=$3", [
        code,
        expiresAt,
        user.id,
      ]);
      try {
        await sendPasswordResetEmail({ to: normalizedEmail, name: user.name, code });
      } catch (emailErr) {
        console.error("Failed to send password reset email:", emailErr.message);
      }
    }

    res.json({ success: true, message: "If an account exists for that email, a reset code has been sent." });
  } catch (e) {
    next(e);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: "email, code and newPassword are required" });
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ success: false, message: passwordError });

    const normalizedEmail = email.toLowerCase().trim();
    const result = await pool.query(
      "SELECT id, name, email, verification_code, verification_code_expires_at FROM users WHERE email = $1",
      [normalizedEmail]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ success: false, message: "No account found for this email" });

    if (!user.verification_code || user.verification_code !== code) {
      return res.status(400).json({ success: false, message: "Incorrect reset code" });
    }
    if (!user.verification_code_expires_at || new Date(user.verification_code_expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: "Reset code has expired. Request a new one." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await pool.query(
      `UPDATE users SET password_hash=$1, verification_code=NULL, verification_code_expires_at=NULL, email_verified=TRUE
       WHERE id=$2 RETURNING id, name, email, email_verified`,
      [passwordHash, user.id]
    );

    const token = signToken(updated.rows[0]);
    res.json({ success: true, token, user: publicUser(updated.rows[0]) });
  } catch (e) {
    next(e);
  }
}

// ---- Delete account ----

async function deleteAccount(req, res, next) {
  try {
    const result = await pool.query("SELECT name, email FROM users WHERE id = $1", [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Statements are removed automatically via ON DELETE CASCADE on the FK.
    await pool.query("DELETE FROM users WHERE id = $1", [req.user.id]);

    sendAccountDeletedEmail({ to: user.email, name: user.name }).catch((emailErr) => {
      console.error("Failed to send account-deleted email:", emailErr.message);
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

// ---- Google OAuth ----

function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function googleAuthUrl(req, res) {
  if (!googleConfigured()) {
    return res.status(501).json({ success: false, message: "Google sign-in isn't configured yet (missing GOOGLE_CLIENT_ID/SECRET)." });
  }
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

async function googleCallback(req, res, next) {
  try {
    if (!googleConfigured()) {
      return res.status(501).json({ success: false, message: "Google sign-in isn't configured yet." });
    }
    const { code } = req.query;
    if (!code) return res.status(400).json({ success: false, message: "Missing authorization code" });

    const { data: tokenData } = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code",
    });

    const { data: profile } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const normalizedEmail = profile.email.toLowerCase().trim();
    const existing = await pool.query("SELECT id, name, email, email_verified FROM users WHERE email = $1 OR google_id = $2", [
      normalizedEmail,
      profile.sub,
    ]);

    let user;
    if (existing.rows.length > 0) {
      const result = await pool.query(
        `UPDATE users SET google_id = $1, email_verified = TRUE WHERE id = $2
         RETURNING id, name, email, email_verified`,
        [profile.sub, existing.rows[0].id]
      );
      user = result.rows[0];
    } else {
      const result = await pool.query(
        `INSERT INTO users (name, email, google_id, email_verified)
         VALUES ($1, $2, $3, TRUE) RETURNING id, name, email, email_verified`,
        [profile.name || normalizedEmail, normalizedEmail, profile.sub]
      );
      user = result.rows[0];
    }

    const token = signToken(user);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  signup,
  verifyEmail,
  resendVerification,
  login,
  me,
  forgotPassword,
  resetPassword,
  deleteAccount,
  googleAuthUrl,
  googleCallback,
};
