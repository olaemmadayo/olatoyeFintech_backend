const mongoose = require("mongoose");
const account = require("./Account");

const transactionSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  to: {
    type: String, // account number
    required: true
  },
  from: {
    type: String, // account number
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  reference: {
    type: String,
    unique: true,
    required: true
  },
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: false
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: false
  },
  type: {
    type: String,
    enum: ["INTERNAL", "EXTERNAL"],
    required: true
  },
  direction: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);