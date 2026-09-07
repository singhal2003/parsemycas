/**
 * One-off diagnostic: logs in with the partner credentials already in backend/.env
 * and decodes the returned JWT so you can see your real partnerId — instead of
 * guessing or reusing another product's partner_id.
 *
 * Run from the backend/ folder:  node scripts/check-partner-id.js
 */
require("dotenv").config();
const axios = require("axios");

function decodeJwtPayload(token) {
  const payloadB64 = token.split(".")[1];
  const json = Buffer.from(payloadB64, "base64").toString("utf-8");
  return JSON.parse(json);
}

async function main() {
  const loginUrl = process.env.PARTNER_LOGIN_URL || "https://app2.mfapis.club/api/v2/partner/login";
  const identifier = process.env.PARTNER_IDENTIFIER;
  const password = process.env.PARTNER_PASSWORD;

  if (!identifier || !password) {
    console.error("PARTNER_IDENTIFIER / PARTNER_PASSWORD are missing from backend/.env");
    process.exit(1);
  }

  console.log(`Logging in to ${loginUrl} as ${identifier} ...`);
  const { data } = await axios.post(
    loginUrl,
    { identifier, password },
    { headers: { "Content-Type": "application/json" } }
  );

  if (!data?.success || !data?.data?.accessToken) {
    console.error("Login failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const payload = decodeJwtPayload(data.data.accessToken);
  console.log("\nDecoded JWT payload (this is what identifies your partner account):\n");
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((err) => {
  console.error("Request failed:", err.response?.data || err.message);
  process.exit(1);
});
