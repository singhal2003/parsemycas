require("dotenv").config();
const express = require("express");
const cors = require("cors");
const casRoutes = require("./routes/cas.routes");
const errorHandler = require("./middleware/errorHandler");
const { isMockMode } = require("./services/casApi.service");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mockMode: isMockMode() });
});

app.use("/api/cas", casRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: "Not found" }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ParseMyCAS backend listening on port ${PORT} (mock mode: ${isMockMode()})`);
});
