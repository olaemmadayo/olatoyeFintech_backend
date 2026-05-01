const mongoose = require("mongoose");

const fintechSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  apiKey: String,
  apiSecret: String,
});

module.exports = mongoose.model("Fintech", fintechSchema);