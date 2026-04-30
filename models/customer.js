const { required } = require("joi");
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,

    // kycType: {
    //   type: String,
    //   enum: ["bvn", "nin"],
    //   required: true,
    // },

    // kycID: {
    //   type: String,
    //   required: true,
    //   unique: true, // one identity = one customer
    // },
    nin: { type: String, unique: true, sparse: true },
    bvn: { type: String, unique: true, sparse: true },
    
    dob: { type: String, required: true },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);