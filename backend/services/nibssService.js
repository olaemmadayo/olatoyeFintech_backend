
const axios = require("axios");

if (!process.env.NIBSS_BASE_URL) {
  console.error("CRITICAL: NIBSS_BASE_URL is not defined in .env");
}
if (!process.env.NIBSS_API_KEY) {
  console.error("CRITICAL: NIBSS_API_KEY is not defined in .env");
}
if (!process.env.NIBSS_SECRET) {
  console.error("CRITICAL: NIBSS_SECRET is not defined in .env");
}

let nibssClient = null;
let tokenExpiry = null;

/**
 * Authenticate with NIBSS and get access token
 */
async function authenticateNIBSS() {
  try {
    const response = await axios.post(`${process.env.NIBSS_BASE_URL}/auth/token`, {
      apiKey: process.env.NIBSS_API_KEY,
      apiSecret: process.env.NIBSS_SECRET
    });

    const token = response.data.token;
    tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // Assume 24 hour expiry

    nibssClient = axios.create({
      baseURL: process.env.NIBSS_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("NIBSS authentication successful");
    return true;
  } catch (error) {
    console.error("NIBSS Authentication Error:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Get authenticated NIBSS client, refreshing token if needed
 */
async function getNibssClient() {
  if (!nibssClient || !tokenExpiry || Date.now() >= tokenExpiry) {
    const success = await authenticateNIBSS();
    if (!success) {
      throw new Error("Failed to authenticate with NIBSS");
    }
  }
  return nibssClient;
}

/**
 * Validate BVN
 */
exports.validateBvn = async (bvn) => {
  const client = await getNibssClient();
  console.log("Full Request URL:", client.defaults.baseURL + "/validateBvn");
  try {
    const response = await client.post(`/validateBvn`, { bvn });
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("NIBSS BVN Validation Error Detail:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || "Failed to validate BVN" };
  }
};

/**
 * Validate NIN
 */
exports.validateNin = async (nin) => {
  const client = await getNibssClient();
  console.log("Full Request URL:", client.defaults.baseURL + "/validateNin");
  try{
  const response = await client.post(`/validateNin`, { nin });
  return { success: true, data: response.data.data };

} catch (error) {
  console.error("NIBSS Error Detail:", error.response?.data || error.message);
  return { success: false, message: error.response?.data?.message || "Failed to validate NIN" };
}
};


exports.createBVN = async (bvn, firstName, lastName, dob, phone) => {
  const client = await getNibssClient();
  try {
    const response = await client.post(`/insertBvn`, { 
      bvn: String(bvn), 
      firstName: String(firstName), 
      lastName, 
      dob, 
      phone 
    });
    // Return a success object instead of just the data, so we can handle it better in the controller
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("NIBSS BVN Error Detail:", error.response?.data || error.message);
    // Return a failure object instead of throwing
    return { 
      success: false, 
      message: error.response?.data?.message || "Failed to create BVN record",
      error: error.response?.data 
    };
  }
};

exports.createNin = async (nin, firstName, lastName, dob, phone) => {
  const client = await getNibssClient();
  try {
    const response = await client.post(`/insertNin`, { 
    nin: String(nin), 
    firstName: String(firstName), 
    lastName, 
    dob, 
    phone 
  });
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error.response) {
      // This will print the actual error message from NIBSS
      console.error("NIBSS Error Detail:", error.response.data);
    }
    throw error; // Re-throw so your controller knows it failed
  }
};

exports.createAccountNo = async (kycType, kycID, dob) => {
  const client = await getNibssClient();
  console.log("Auth Header:", client.defaults.headers.Authorization);
  try {
    // 1. Fixed the path to include /api
    const response = await client.post(`/account/create`, {
      kycType, // Must be "bvn" or "nin"
      kycID,   // Match the doc: lowercase 'k', uppercase 'ID'
      dob      // YYYY-MM-DD
    });
    
    console.log("NIBSS Account Creation Response:", response.data);
    
    // Check if the response indicates an error
    if (response.data && response.data.success === false) {
      return {
        success: false,
        message: response.data.message || "NIBSS Account Creation Failed"
      };
    }
    
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    if (error.response) {
      console.error("NIBSS Account Creation Error:", error.response.data);
    }
    return {
      success: false,
      message: error.response?.data?.message || "Internal Service Error"
    };
  }
};

exports.nameEnquiry = async (accountNumber, bankCode) => {
  const client = await getNibssClient();

  try {
    const url = `/account/name-enquiry/${accountNumber}`;
    console.log("NIBSS Name Enquiry Request URL:", client.defaults.baseURL + url);
    console.log("NIBSS Name Enquiry Request Params:", { bankCode });

    const response = await client.get(url, {
      params: { bankCode }
    });

    console.log("NIBSS Name Enquiry Response:", response.data);

    return { success: true, data: response.data };

  } catch (error) {
    console.error("NIBSS Name Enquiry Error Detail:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || "Failed to perform name enquiry" };
  }
};

//account Balace api
exports.getAccountBalance = async (accountNumber) => {
  const client = await getNibssClient();

  try {
    const response = await client.post(`/account/balance/${accountNumber}`);

    console.log("NIBSS Account Balance Response:", response.data);

    return { success: true, data: response.data.data };

  } catch (error) {
    console.error("NIBSS Account Balance Error Detail:", error.response?.data || error.message);

    return { success: false, message: error.response?.data?.message || "Failed to retrieve account balance" };

  }
};


//transaction Status Query
exports.getTransactionStatus = async (transactionId) => {
  const client = await getNibssClient();

  try {   
     const response = await client.get(`/transaction/${transactionId}`);

    console.log("NIBSS Transaction Status Response:", response.data);

    return { success: true, data: response.data };

  }catch (error) {
    console.error("NIBSS Transaction Status Error Detail:", error.response?.data || error.message);

    return { success: false, message: error.response?.data?.message || "Failed to retrieve transaction status" };
  }
};

//transferfunds
exports.transferFunds = async ({ to, from, amount, bankCode, accountName }) => {
  const client = await getNibssClient();
  const fromBankCode = process.env.NIBSS_BANK_CODE;

  if (!fromBankCode) {
    throw new Error("Missing NIBSS_BANK_CODE in environment configuration");
  }

  const payload = {
    fromBankCode,
    toBankCode: bankCode,
    from: from,
    to: to,
    amount: String(amount),
    accountName,
    beneficiaryName: accountName,
    bankCode,
    narration: `Transfer from ${from} to ${to}`,
    reference: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    currencyCode: 'NGN',
  };

  try {
    const response = await client.post(`/transfer`, payload);

    console.log("NIBSS Transfer Funds Response:", response.data);
    console.log("TRANSFER PAYLOAD:", payload);

    return { success: true, data: response.data };

  } catch (error) {
    console.error("FULL TRANSFER ERROR:", JSON.stringify(error.response?.data || error.message, null, 2));
    console.error("NIBSS Transfer Funds Error Detail:", error.response?.data || error.message);
    console.error("NIBSS Transfer Request Payload:", JSON.stringify(error.config?.data || payload, null, 2));
    console.error("NIBSS Transfer Response Status:", error.response?.status);
    console.error("NIBSS Transfer Response Headers:", error.response?.headers);

    return {
      success: false,
      message: error.response?.data?.message || "Failed to transfer funds",
      details: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
};

//get all accounts 
exports.getAllAccounts = async () => {
  const client = await getNibssClient();  

  try {    const response = await client.get(`/accounts`);

    console.log("NIBSS Get All Accounts Response:", response.data);

    return { success: true, data: response.data.data };

  } catch (error) {
    console.error("NIBSS Get All Accounts Error Detail:", error.response?.data || error.message);

    return { success: false, message: error.response?.data?.message || "Failed to retrieve accounts" };

  }
};
