// middleware/errorHandler.js — Global error handler
// Must be registered LAST: app.use(require('./middleware/errorHandler'))

module.exports = (err, req, res, next) => {
  const isDev  = process.env.NODE_ENV !== 'production';
  const status = err.status || err.statusCode || 500;

  // Log full error in all environments
  console.error(`[Error] ${req.method} ${req.originalUrl} — ${err.message}`);
  if (isDev) console.error(err.stack);

  // Handle specific known error types
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token — please log in again.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  // SQL Server specific error codes
  if (err.code === 'EREQUEST' || err.code === 'ECONNREFUSED') {
    return res.status(503).json({ success: false, message: 'Database unavailable — please try again shortly.' });
  }

  res.status(status).json({
    success : false,
    message : err.message || 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
};
