const express = require('express');
const router = express.Router();
const { onboardCustomer } = require('../controllers/customerController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post("/onboard", authMiddleware.fintechAuthMiddleware, onboardCustomer);

module.exports = router;