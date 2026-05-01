const Account = require('../models/Account');
const Customer = require('../models/customer');
const { validateBvn, validateNin, createAccountNo } = require('../services/nibssService');
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/genrateToken');



exports.createAccount = asyncHandler(async (req, res) => {
  const { kycType, kycID, dob, password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  const existingAccount = await Account.findOne({ kycID });
  if (existingAccount) {
    return res.status(400).json({ message: "Account already exists for this ID" });
  }

  // Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  let kycValidationResponse;
  try {
    // 2. Call appropriate NIBSS validation service based on kycType
    if (kycType === 'bvn') {
      kycValidationResponse = await validateBvn(kycID);
    } else {
      kycValidationResponse = await validateNin(kycID);
    }
    console.error("KYC Validation Response from NIBSS:", kycValidationResponse);

  } catch (error) {
    console.error("NIBSS Service Error:", error.message);
    return res.status(502).json({ 
      message: 'Failed to communicate with validating KYC provider', 
      error: error.message
    });
  }

  if (!kycValidationResponse || !kycValidationResponse.success) {
    return res.status(400).json({ 
      message: 'KYC validation failed with NIBSS', 
      details: kycValidationResponse
    });
  }

  // verify that the customer exists and is verified
  const customer = await Customer.findOne(
    kycType === 'bvn' ? { bvn: kycID } : { nin: kycID }
  );

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found with provided KYC information' });
  }
  if (!customer.isVerified) {
    return res.status(400).json({ message: 'Customer KYC is not verified' });
  }

  ;
  // 4. NIBSS ACCOUNT GENERATION
  const nibssResponse = await createAccountNo(kycType, kycID, dob);
  console.log("NIBSS Response:", JSON.stringify(nibssResponse, null, 2));

  if (!nibssResponse.success) {
    return res.status(400).json({ 
      message: "NIBSS Account Generation Failed", 
      details: nibssResponse.message 
    });
  }
  

  
  // 4. Save account details in the database
  console.log("NIBSS Response data:", nibssResponse.data);
  const accountData = nibssResponse.data.account || nibssResponse.data;
  const newAccount = await Account.create({
    accountNumber: accountData.accountNumber,
    bankCode: accountData.bankCode,
    bankName: accountData.bankName || process.env.BankName,
    balance: Number(accountData.balance) || 0,
    kycID,
    kycType,
    dob,
    customer: customer._id,
    password: hashedPassword
  });

  res.status(201).json({
    message: 'Account created successfully',
    account: newAccount
});

});






//login user account 
exports.loginAccount = asyncHandler(async (req, res) => {
  const { accountNumber, password } = req.body;

  const account = await Account.findOne({ accountNumber }).populate('customer');

  if (!account) {
    return res.status(401).json({ message: "Invalid account number or password" });
  }

  if (await bcrypt.compare(password, account.password)) {
    const token = generateToken({ id: account._id });
    const refreshToken = generateToken.generateRefreshToken({ id: account._id });

    account.refreshToken = refreshToken;
    await account.save();

    return res.status(200).json({
      message: "Login successful",
      _id: account._id,
      accountNumber: account.accountNumber,
      token,
      refreshToken
    });
  }

  res.status(401).json({ message: "Invalid account number or password" });
});
 


exports.refreshAccountToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token required' });
  }

  const account = await Account.findOne({ refreshToken });
  if (!account) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (!decoded || decoded.id.toString() !== account._id.toString()) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newToken = generateToken({ id: account._id });
    const newRefreshToken = generateToken.generateRefreshToken({ id: account._id });

    account.refreshToken = newRefreshToken;
    await account.save();

    res.status(200).json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    return res.status(401).json({ message: 'Refresh token expired or invalid' });
  }
});

exports.logoutAccount = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.user._id);
  if (!account) {
    return res.status(404).json({ message: 'Account not found' });
  }

  account.refreshToken = null;
  await account.save();

  res.status(200).json({ message: 'Logout successful' });
});

exports.getAccountBalance = asyncHandler(async (req, res) => {
  const { accountNumber } = req.params;
  const account = await Account.findOne({ accountNumber });
  if (!account) {
    return res.status(404).json({ message: "Account not found" });
  }

  if (req.user.accountNumber !== accountNumber) {
    return res.status(403).json({ message: 'Forbidden: access denied' });
  }

  res.json({ balance: account.balance });
});

exports.getMyAccount = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.user._id).populate('customer', 'firstName lastName phone');
  if (!account) {
    return res.status(404).json({ message: "Account not found" });
  }

  res.json({ account });
});

exports.getAccountDetails = asyncHandler(async (req, res) => {
  const { accountNumber } = req.params;
  const account = await Account.findOne({ accountNumber }).populate('customer', 'firstName lastName phone');
  if (!account) {
    return res.status(404).json({ message: "Account not found" });
  }

  if (req.user.accountNumber !== accountNumber) {
    return res.status(403).json({ message: 'Forbidden: access denied' });
  }

  res.json({
    accountNumber: account.accountNumber,
    bankCode: account.bankCode,
    bankName: account.bankName,
    balance: account.balance,
    customer: account.customer
  });
});

