const express = require('express');
const router = express.Router();
const {initiateTransfer, checkTransactionStatus, getTransactionHistory} = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');



router.post("/initiate", authMiddleware, initiateTransfer);
router.get("/transaction/:transactionId", authMiddleware, checkTransactionStatus);
router.get("/history", authMiddleware, getTransactionHistory);


module.exports = router;