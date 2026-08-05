const express = require("express");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/auth");
const {
  uploadStatement,
  listStatements,
  getStatement,
  getStatementRaw,
  deleteStatement,
} = require("../controllers/statements.controller");

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, "..", "..", "uploads"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are supported"));
    }
    cb(null, true);
  },
});

router.use(authMiddleware);
router.post("/upload", upload.single("file"), uploadStatement);
router.get("/", listStatements);
router.get("/:id", getStatement);
router.get("/:id/raw", getStatementRaw);
router.delete("/:id", deleteStatement);

module.exports = router;
