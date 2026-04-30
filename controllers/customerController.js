const Customer = require('../models/customer');
const asyncHandler = require('../utils/asyncHandler');
const { createBVN, createNin } = require('../services/nibssService');


exports.onboardCustomer = asyncHandler(async (req, res) => {
  const { firstName, lastName, dob, bvn, nin, phone } = req.body;

 // 1. Ensure at least one identity is provided
  if (!bvn && !nin) {
    return res.status(400).json({ message: 'Either BVN or NIN is required' });
  }
 
// 2. Build a dynamic query to check if either ID is already registered
  const conflictQuery = [];
  if (bvn) conflictQuery.push({ bvn });
  if (nin) conflictQuery.push({ nin });

  // Check if customer with same BVN or NIN already exists
  const existingCustomer = await Customer.findOne({ $or: conflictQuery });

  if (existingCustomer) {
    return res.status(400).json({ message: 'A customer with this identity already exists.' });
  }
  // 3. Call Third-Party API based on what was provided
  let kycResponse;
  try{
  if (bvn) {
      // Only call BVN service if bvn is in the request
      kycResponse = await createBVN(bvn, firstName, lastName, dob, phone);
    } else {
      // Otherwise call NIN service
      kycResponse = await createNin(nin, firstName, lastName, dob, phone);
    }

    console.error("KYC Response from NIBSS:", kycResponse);
    
  }catch(error){
    // If the service crashes, we catch it here so we can return a clean response 
    // WITHOUT creating a customer in the DB.
    console.error("NIBSS Service Error:", error.message);
    return res.status(502).json({ 
      message: 'Failed to communicate with KYC provider', 
      error: error.message
    });
  };


  // 4. Validate the response structure
  // Verify that kycResponse exists and success is explicitly true
  if (!kycResponse || !kycResponse.success) {
    return res.status(400).json({ 
      message: 'KYC validation failed with NIBSS', 
      details: kycResponse 
    });
  }

  createdKyc = kycResponse.data; // Assuming the response has a 'data' field with the created KYC info

  // Create customer in the database
  const customer = await Customer.create({
    firstName: createdKyc.firstName || firstName, // Use KYC firstName if available, otherwise use provided firstName
    lastName: createdKyc.lastName || lastName,
    dob: createdKyc.dob || dob, // Use KYC dob if available, otherwise use provided dob
    phone: createdKyc.phone || phone, // Use KYC phone if available, otherwise use provided phone
    bvn: bvn || undefined, // Store null if not provided
    nin: nin || undefined,  // Store null if not provided
    isVerified: true // Assuming successful KYC means verified  
  });
   
  res.status(201).json({
    message: 'Customer created successfully',
    customer
  });
});