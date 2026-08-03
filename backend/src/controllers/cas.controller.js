const fs = require("fs");
const { parseCasStatement, isMockMode } = require("../services/casApi.service");

/**
 * Stateless: upload a CAS PDF, forward it to the parsing API, return whatever
 * comes back. Nothing is stored on this server — no database, no accounts.
 */
async function parseStatement(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "CAS statement file is required (field name: file)" });
    }
    const { password } = req.body;

    const parsed = await parseCasStatement({
      filePath: req.file.path,
      fileName: req.file.originalname,
      password,
    });

    fs.unlink(req.file.path, () => {});

    res.status(parsed?.success === false ? 422 : 200).json({ ...parsed, mockMode: isMockMode() });
  } catch (e) {
    if (req.file) fs.unlink(req.file.path, () => {});
    if (e.response) {
      return res.status(502).json({ success: false, message: "CAS parsing API error", details: e.response.data });
    }
    next(e);
  }
}

module.exports = { parseStatement };
