const jwt = require("jsonwebtoken");
const Account = require("../models/account");
const Fintech = require("../models/fintech");
const asyncHandler = require("../utils/asyncHandler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await Account.findById(decoded.id).select('-password');

    if (user) {
      req.user = user;
      req.userType = 'account';
      return next();
    }

    user = await Fintech.findById(decoded.id);
    if (user) {
      req.user = user;
      req.userType = 'fintech';
      return next();
    }

    return res.status(401).json({ message: "Invalid token" });
  } catch (err) {
    console.error('Not authorized, token failed', err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
});

const fintechAuthMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const fintech = await Fintech.findById(decoded.id);

    if (!fintech) {
      if (decoded.id === process.env.id) {
        req.user = { _id: decoded.id, isEnvToken: true };
        req.userType = 'fintech';
        return next();
      }
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = fintech;
    req.userType = 'fintech';
    next();
  } catch (err) {
    console.error('Not authorized, token failed', err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = authMiddleware;
module.exports.fintechAuthMiddleware = fintechAuthMiddleware;
