const logger = require('../utils/logger');

const notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Log do erro
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Recurso não encontrado';
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Dados de entrada inválidos';
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }));
    
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = 'Registro duplicado - este valor já existe';
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Referência inválida - recurso relacionado não encontrado';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'Arquivo muito grande';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Tipo de arquivo não permitido';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  notFound,
  errorHandler
};