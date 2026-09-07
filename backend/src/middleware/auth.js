const { fetchInvestorProfile } = require("../services/niveshStar.service");

/**
 * Reads the investor's access/refresh tokens (issued by Nivesh Star's central login,
 * not by this app) from request headers and validates them against the central
 * /investor endpoint. On success, req.user is the investor's central profile, plus
 * the raw tokens themselves — statements.controller.js forwards those same tokens
 * when calling /cas/ai/parse, per Nivesh Star's guidance to parse using the
 * investor's own token rather than sending their credentials anywhere.
 */
async function authMiddleware(req, res, next) {
  const accessToken = req.headers["access-token"];
  const refreshToken = req.headers["refresh-token"];

  if (!accessToken) {
    return res.status(401).json({ success: false, message: "Missing access-token header" });
  }

  try {
    const investor = await fetchInvestorProfile(accessToken, refreshToken);
    req.user = { ...investor, id: investor.id, accessToken, refreshToken };
    next();
  } catch (e) {
    return res.status(e.status || 401).json({ success: false, message: e.message || "Invalid or expired session" });
  }
}

module.exports = authMiddleware;
