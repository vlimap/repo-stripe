module.exports = function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);

  return res.status(error.status || 500).json({
    error: error.message || 'Erro interno do servidor.'
  });
};
