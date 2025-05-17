// auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports.createAccessToken = (user) => {
    const data = {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin
    };

    return jwt.sign(data, process.env.JWT_SECRET_KEY);

};

module.exports.verify = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ auth: "Failed", message: "No token provided" });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ auth: "Failed", message: "Invalid token" });
    } else {
      req.user = decodedToken;
      next();
    }
  });
};

module.exports.verifyAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({ auth: "Failed", message: "Action Forbidden" });
  }
};

module.exports.errorHandler = (err, req, res, next) => {
    console.error(err); // Log the error for debugging
    const statusCode = err?.statusCode || 500;
    const errorMessage = err?.message || 'Internal Server Error';
    res.status(statusCode).json({
        error: {
            message: errorMessage,
            errorCode: err?.code || 'SERVER_ERROR',
            details: err?.details || null
        }
    });
};

