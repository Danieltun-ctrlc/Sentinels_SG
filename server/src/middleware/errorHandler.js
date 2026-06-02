/**
 * Global error handler middleware.
 */
function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
