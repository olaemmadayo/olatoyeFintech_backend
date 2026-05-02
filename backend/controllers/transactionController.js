const Transaction = require("../models/transaction");
const Account = require("../models/account");
const asyncHandler = require("../utils/asyncHandler");
const { nameEnquiry, transferFunds, getTransactionStatus } = require("../services/nibssService");


exports.initiateTransfer = asyncHandler(async (req, res) => {
  const { to, amount, recipientBankCode } = req.body;
  const from = req.user.accountNumber;

  const myBankCode = process.env.NIBSS_BANK_CODE;

  let result;

  if (recipientBankCode === myBankCode) {
    result = await handleInternalTransfer({ from, to, amount, recipientBankCode });
  } else {
    result = await handleExternalTransfer({ from, to, amount, recipientBankCode });
  }

  return res.status(200).json(result);
});


// Internal transfer between accounts in the same bank
const handleInternalTransfer = async ({ from, to, amount, recipientBankCode }) => {
  const fromAccount = await Account.findOne({ accountNumber: from });
  const toAccount = await Account.findOne({ accountNumber: to });

  if (!fromAccount || !toAccount) {
    throw new Error("Account not found");
  }

  const numericAmount = Number(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid amount");
  }

  if (fromAccount.balance < numericAmount) {
    throw new Error("Insufficient funds");
  }

  fromAccount.balance -= numericAmount;
  toAccount.balance += numericAmount;

  await fromAccount.save();
  await toAccount.save();

  const txDebit = await Transaction.create({
    account: fromAccount._id,
    from: fromAccount.accountNumber,
    to: toAccount.accountNumber,
    amount: String(numericAmount),
    type: "INTERNAL",
    status: "completed",
    reference: `TX-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    fromAccount: fromAccount._id,
    toAccount: toAccount._id,
    direction: 'debit'
  });

  const txCredit = await Transaction.create({
    account: toAccount._id,
    from: fromAccount.accountNumber,
    to: toAccount.accountNumber,
    amount: String(numericAmount),
    type: "INTERNAL",
    status: "completed",
    reference: `TX-${Date.now()}-${Math.floor(Math.random() * 100000)}-CREDIT`,
    fromAccount: fromAccount._id,
    toAccount: toAccount._id,
    direction: 'credit'
  });

  return { message: "Internal transfer successful", tx: txDebit };
};


// External transfer to other banks via NIBSS
const handleExternalTransfer = async ({ from, to, amount, recipientBankCode }) => {
  const fromAccount = await Account.findOne({ accountNumber: from });

  if (!fromAccount) {
    throw new Error("Sender not found");
  }

  if (!process.env.NIBSS_BANK_CODE) {
    throw new Error("Server configuration error: NIBSS_BANK_CODE is required for external transfers");
  }

  if (fromAccount.balance < amount) {
    throw new Error("Insufficient funds");
  }

  const numericAmount = Number(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid amount");
  }

  if (!recipientBankCode) {
    throw new Error("Recipient bank code is required for external transfers");
  }

  // Validate sender account exists in NIBSS
  const senderCheck = await nameEnquiry(from, process.env.NIBSS_BANK_CODE);
  console.log("Sender Account Check Response:", senderCheck);

  if (!senderCheck.success || !senderCheck.data?.accountName) {
    throw new Error("Invalid sender account");
  }

  const nameCheck = await nameEnquiry(to, recipientBankCode);
  console.log("Name Enquiry Response:", nameCheck);

  if (!nameCheck.success || !nameCheck.data?.accountName) {
    throw new Error("Invalid recipient");
  }

  const externalBankCode = recipientBankCode || nameCheck.data.bankCode;
  const beneficiaryName = nameCheck.data.accountName;

  if (!externalBankCode) {
    throw new Error("Recipient bank code is required");
  }

  const transferResponse = await transferFunds({
    from,
    to,
    amount,
    bankCode: externalBankCode,
    accountName: beneficiaryName
  });

  if (!transferResponse.success) {
    throw new Error("NIBSS transfer failed");
  }

  // Debit locally AFTER success (or use pending state if async)
  fromAccount.balance -= numericAmount;
  await fromAccount.save();

  const tx = await Transaction.create({
    account: fromAccount._id,
    from: fromAccount.accountNumber,
    to,
    amount: String(numericAmount),
    type: "EXTERNAL",
    transactionId: transferResponse.data.transactionId,
    status: "pending", // safer than completed
    reference: `TX-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    fromAccount: fromAccount._id,
    direction: 'debit'
  });

  return { message: "Transfer initiated", tx };
};

//tsq
exports.checkTransactionStatus = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  const result = await getTransactionStatus(transactionId);

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.status(200).json(result.data);
});

exports.getTransactionHistory = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ account: req.user._id })
    .sort({ createdAt: -1 })
    .populate('fromAccount', 'accountNumber')
    .populate('toAccount', 'accountNumber');

  return res.status(200).json({ transactions });
});


