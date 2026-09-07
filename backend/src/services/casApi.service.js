const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const MOCK_FIXTURE_PATH = path.join(__dirname, "..", "fixtures", "sample_cas_response.json");

/** Explicit dev-only toggle — set MOCK_CAS_PARSE=true in .env to skip the real API
 *  entirely (e.g. testing the UI without a live investor session). Not tied to any
 *  credentials, since parsing now always runs as the logged-in investor. */
function isMockMode() {
  return process.env.MOCK_CAS_PARSE === "true";
}

/**
 * Sends the uploaded CAS PDF to the real mfapis.club AI parse endpoint using the
 * logged-in investor's own accessToken — per Nivesh Star's guidance: never send an
 * investor's raw credentials to this endpoint, always parse using the token they
 * already got from logging in. /cas/ai/parse accepts ALL_ROLES_WITH_PM, which
 * includes INVESTOR, so this token is accepted directly.
 */
async function parseCasStatement({ filePath, fileName, password, accessToken }) {
  if (isMockMode()) {
    const raw = fs.readFileSync(MOCK_FIXTURE_PATH, "utf-8");
    return JSON.parse(raw);
  }

  if (!accessToken) {
    throw new Error("No investor session token available to authenticate the parse request");
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(filePath), fileName);
  if (password) form.append("password", password);

  const response = await axios.post(process.env.CAS_API_URL, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${accessToken}`,
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    const err = new Error(response.data?.message || `CAS parse API returned ${response.status}`);
    err.response = response;
    throw err;
  }

  return response.data;
}

module.exports = { parseCasStatement, isMockMode };
