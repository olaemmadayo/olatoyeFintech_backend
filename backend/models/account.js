const mongoose = require('mongoose');
const customer = require('./customer');

const accountSchema = new mongoose.Schema(
  {
  
    accountNumber: { type: String, unique: true },
    bankCode: String,
    bankName: String,
    kycID: {
      type: String,
      required: true,
      unique: true, // one KYC record = one account
    },
    kycType: {
      type: String,
      required: true,
      enum: ['bvn', 'nin']
    },
    dob: { type: String, required: true },
    balance: {
      type: Number,
      default: 0,
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    }
  }, { timestamps: true }
);
module.exports = mongoose.models.Account || mongoose.model("Account", accountSchema);