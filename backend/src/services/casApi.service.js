const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { getPartnerToken, hasCredentials } = require("./partnerAuth.service");

const MOCK_FIXTURE_PATH = path.join(__dirname, "..", "fixtures", "sample_cas_response.json");

function isMockMode() {
  return !hasCredentials();
}

async function callAiParse({ filePath, fileName, password, token }) {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath), fileName);
  if (password) form.append("password", password);

  const response = await axios.post(process.env.CAS_API_URL, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`,
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: () => true, // handle non-2xx ourselves so we can retry on expired token
  });

  return response;
}

/**
 * Sends the uploaded CAS PDF to the real mfapis.club AI parse endpoint using a
 * partner accessToken (obtained via POST /api/v2/partner/login, see
 * partnerAuth.service.js). Falls back to a bundled sample response when no
 * PARTNER_IDENTIFIER/PARTNER_PASSWORD are configured, so the product still
 * works end-to-end for demos/dev without live credentials.
 */
async function parseCasStatement({ filePath, fileName, password }) {
  if (isMockMode()) {
    const raw = fs.readFileSync(MOCK_FIXTURE_PATH, "utf-8");
    return JSON.parse(raw);
  }

  let token = await getPartnerToken();
  let response = await callAiParse({ filePath, fileName, password, token });

  // Token might have just expired between cache check and call — refresh once and retry.
  if (response.status === 401) {
    token = await getPartnerToken({ forceRefresh: true });
    response = await callAiParse({ filePath, fileName, password, token });
  }

  if (response.status < 200 || response.status >= 300) {
    const err = new Error(response.data?.message || `CAS parse API returned ${response.status}`);
    err.response = response;
    throw err;
  }

  return response.data;
}

module.exports = { parseCasStatement, isMockMode };
