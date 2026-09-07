const fs = require("fs");
const crypto = require("crypto");
const { pool } = require("../config/db");
const { parseCasStatement, isMockMode } = require("../services/casApi.service");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidId(id) {
  return typeof id === "string" && UUID_RE.test(id);
}

/**
 * The live /cas/ai/parse endpoint (folios[]/investor_info shape, per the official
 * docs) and the bundled mock fixture (older holdings[]/investor_name shape) don't
 * match field-for-field. This normalizes either into the same flat metadata.
 */
function extractMeta(d) {
  if (Array.isArray(d.folios)) {
    return {
      casType: d.cas_type || null,
      investorName: d.investor_info?.name || null,
      pan: d.primary_pan || d.investor_info?.pan || null,
      periodFrom: d.statement_period?.from || null,
      periodTo: d.statement_period?.to || null,
      totalFolios: d.total_folios ?? d.folios.length,
      totalSchemes: d.total_schemes ?? null,
    };
  }
  return {
    casType: d.cas_type || null,
    investorName: d.investor_name || null,
    pan: d.pan || null,
    periodFrom: d.statement_period_from || null,
    periodTo: d.statement_period_to || null,
    totalFolios: d.total_folios ?? null,
    totalSchemes: d.total_schemes ?? null,
  };
}

function hashFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function uploadStatement(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "CAS statement file is required (field name: file)" });
    const { password } = req.body;

    // Hash the raw upload before parsing — catches an exact re-upload of the same
    // PDF without wasting a call to the (rate-limited, presumably billed) parse API.
    const fileHash = hashFile(req.file.path);
    const existing = await pool.query(
      `SELECT id, file_name, cas_type, investor_name, total_folios, total_schemes, created_at
       FROM statements WHERE user_id = $1 AND file_hash = $2`,
      [req.user.id, fileHash]
    );
    if (existing.rows.length > 0) {
      return res.status(200).json({ success: true, statement: existing.rows[0], duplicate: true });
    }

    const parsed = await parseCasStatement({
      filePath: req.file.path,
      fileName: req.file.originalname,
      password,
      accessToken: req.user.accessToken,
    });

    if (!parsed || parsed.success === false || !parsed.data) {
      return res.status(422).json({ success: false, message: parsed?.message || "Could not parse the CAS statement" });
    }

    const d = parsed.data;
    const meta = extractMeta(d);
    const result = await pool.query(
      `INSERT INTO statements
        (user_id, file_name, file_hash, cas_type, investor_name, pan, statement_period_from, statement_period_to, total_folios, total_schemes, raw_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id, file_name, cas_type, investor_name, total_folios, total_schemes, created_at`,
      [
        req.user.id,
        req.file.originalname,
        fileHash,
        meta.casType,
        meta.investorName,
        meta.pan,
        meta.periodFrom,
        meta.periodTo,
        meta.totalFolios,
        meta.totalSchemes,
        JSON.stringify(d),
      ]
    );

    res.status(201).json({ success: true, statement: result.rows[0], mockMode: isMockMode() });
  } catch (e) {
    if (e.response) {
      return res.status(502).json({ success: false, message: "CAS parsing API error", details: e.response.data });
    }
    next(e);
  } finally {
    // Always clean up the temp upload, whether parsing succeeded, failed, or threw —
    // previously this only ran after a successful parse, leaking a file on disk for
    // every failed/errored upload.
    if (req.file?.path) fs.unlink(req.file.path, () => {});
  }
}

async function listStatements(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, file_name, cas_type, investor_name, total_folios, total_schemes,
              statement_period_from, statement_period_to, created_at
       FROM statements WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, statements: result.rows });
  } catch (e) {
    next(e);
  }
}

async function getStatement(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid statement id" });
    const result = await pool.query(
      `SELECT id, file_name, cas_type, investor_name, pan, total_folios, total_schemes,
              statement_period_from, statement_period_to, created_at, raw_data
       FROM statements WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Statement not found" });
    res.json({ success: true, statement: result.rows[0] });
  } catch (e) {
    next(e);
  }
}

async function getStatementRaw(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid statement id" });
    const result = await pool.query(
      "SELECT id, file_name, raw_data FROM statements WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Statement not found" });

    const { file_name, raw_data } = result.rows[0];
    const downloadName = file_name.replace(/\.pdf$/i, "") + ".json";
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(raw_data, null, 2));
  } catch (e) {
    next(e);
  }
}

async function deleteStatement(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid statement id" });
    const result = await pool.query(
      "DELETE FROM statements WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Statement not found" });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

/**
 * "Clear my data" — deletes every statement this app has stored for the logged-in
 * investor. This does NOT delete their Nivesh Star account, since that account is
 * shared across every Nivesh Star product (do-tax-easy, etc.) — we only own the
 * statements we've stored locally, so that's all we can (and should) delete.
 */
async function clearMyData(req, res, next) {
  try {
    const result = await pool.query("DELETE FROM statements WHERE user_id = $1 RETURNING id", [req.user.id]);
    res.json({ success: true, deleted: result.rows.length });
  } catch (e) {
    next(e);
  }
}

module.exports = { uploadStatement, listStatements, getStatement, getStatementRaw, deleteStatement, clearMyData };
