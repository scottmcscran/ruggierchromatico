const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 404);
};

const handleDuplicateFieldDB = (err) => {
  const value = err.cause.errmsg.match(/(["'])(.*?)\1/g);
  console.log(value);
  const message = `Duplicate field value: ${value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((er) => er.message);
  const message = `Invalid input data (${errors.join(`. `)})`;
  return new AppError(message, 400);
};

const handleJWTErrorDB = () =>
  new AppError(`There was a problem with the login token.`, 401);

const handleExpiredTokenErrorDB = () =>
  new AppError(`There your login token has expired, please login again.`, 401);

const sendDevError = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) RENDERED WEBSITE
  console.error("ERROR 💥", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: err.message,
  });
};

const sendProdError = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error("ERROR 💥", err);
    // 2) Send generic message
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error("ERROR 💥", err);
  // 2) Send generic message
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: "Please try again later.",
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || `error`;

  if (process.env.NODE_ENV === `development`) {
    sendDevError(err, req, res);
  } else if (process.env.NODE_ENV === `production`) {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let error = { ...err, cause: err.cause, message: err.message };

    // eslint-disable-next-line no-unused-expressions
    if (error.cause?.name === `CastError`) error = handleCastErrorDB(error);
    if (error.cause?.code === 11000) error = handleDuplicateFieldDB(error);
    if (error.errors?.passwordConfirm || error.errors?.email)
      error = handleValidationErrorDB(error);
    if (error.name === `JsonWebTokenError`) error = handleJWTErrorDB();
    if (error.name === `TokenExpiredError`) error = handleExpiredTokenErrorDB();

    // console.log(error);
    sendProdError(error, req, res);
  }
};
