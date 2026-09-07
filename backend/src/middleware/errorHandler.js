function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  // 4xx messages are ones we deliberately threw ourselves (e.g. "Statement not
  // found") and are safe to show. 5xx means something unexpected broke — could be a
  // DB error, a network error with internal URLs in it, etc. — so don't forward
  // err.message to the client for those, just log it server-side.
  const message = status >= 500 ? "Something went wrong on our end. Please try again." : err.message || "Request failed";
  res.status(status).json({ success: false, message });
}

module.exports = errorHandler;
