const express = require("express");
const multer = require("multer");
const path = require("path");
const { parseStatement } = require("../controllers/cas.controller");

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, "..", "..", "uploads"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — matches the real API's own limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are supported"));
    }
    cb(null, true);
  },
});

router.post("/parse", upload.single("file"), parseStatement);

module.exports = router;
