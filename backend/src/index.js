require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const statementsRoutes = require("./routes/statements.routes");
const errorHandler = require("./middleware/errorHandler");
const { isMockMode } = require("./services/casApi.service");

const app = express();

app.use(helmet());

// CORS_ORIGIN must be set explicitly in production — falling back to "*" would let
// any website call this API on behalf of a user who has a token, since tokens are
// sent as headers (not cookies) and so aren't otherwise protected by browser
// same-origin rules. FRONTEND_URL is a safer fallback than "*" for local dev.
app.use(cors({ origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173" }));

app.use(express.json({ limit: "1mb" }));

// Applies to every route below, including statements — a stolen/leaked token
// shouldn't let someone hammer the upload endpoint or scrape statements at will.
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please slow down and try again shortly." },
  })
);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mockMode: isMockMode() });
});

app.use("/api/statements", statementsRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: "Not found" }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ParseMyCAS backend listening on port ${PORT} (mock mode: ${isMockMode()})`);
});
