/**
 * Express error-handling middleware (must define 4 args).
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      message: messages.length ? messages.join(" ") : "Validation failed.",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format." });
  }

  console.error(err);
  return res.status(500).json({
    message: "Internal server error.",
  });
}

module.exports = { errorHandler };
