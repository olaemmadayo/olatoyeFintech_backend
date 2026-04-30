const Fintech = require('../models/fintech');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/genrateToken');

exports.login = asyncHandler(async (req, res) => {
  const { apiKey, apiSecret } = req.body;

  //check against .env FIRST
  const isEnvMatch = apiKey === process.env.NIBSS_API_KEY && apiSecret === process.env.NIBSS_SECRET;

  if (isEnvMatch) {
    // Generate token using a dummy id from .env
    const token = generateToken({ id: process.env.id });
    return res.status(200).json({ success: true, token });
  }

  // if not .env, check the datbase
  const fintech = await Fintech.findOne({ apiKey, apiSecret });

  if (!fintech) {
    return res.status(401).json({ success: false, message: "Invalid API credentials" });
  }

  // Generate token for valid fintech
  const token = generateToken({ id: fintech._id });

  res.status(200).json({ success: true, token });
});

// const jwt = require('jsonwebtoken');

// exports.generateToken = (req, res) => {
//   // For testing purposes, generate a token without authentication
//   // In production, you should validate user credentials
//   const token = jwt.sign({ user: 'test' }, process.env.JWT_SECRET, { expiresIn: '1h' });
//   res.json({ token });
// };