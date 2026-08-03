require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const statementsRoutes = require("./routes/statements.routes");
const errorHandler = require("./middleware/errorHandler");
const { isMockMode } = require("./services/casApi.service");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mockMode: isMockMode() });
});

app.use("/api/auth", authRoutes);
app.use("/api/statements", statementsRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: "Not found" }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ParseMyCAS backend listening on port ${PORT} (mock mode: ${isMockMode()})`);
});
