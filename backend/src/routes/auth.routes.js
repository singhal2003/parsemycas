const express = require("express");
const authMiddleware = require("../middleware/auth");
const {
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
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authMiddleware, me);
router.delete("/me", authMiddleware, deleteAccount);
router.get("/google", googleAuthUrl);
router.get("/google/callback", googleCallback);

module.exports = router;
