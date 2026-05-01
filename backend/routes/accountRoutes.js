const express = require('express');
const router = express.Router();
const { createAccount, loginAccount, refreshAccountToken, logoutAccount, getAccountBalance, getAccountDetails, getMyAccount } = require('../controllers/accountController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post("/create", createAccount);
router.post("/login", loginAccount);
router.get("/me", authMiddleware, getMyAccount);
router.post("/refresh-token", refreshAccountToken);
router.post("/logout", authMiddleware, logoutAccount);
router.get("/:accountNumber/balance", authMiddleware, getAccountBalance);
router.get("/:accountNumber/details", authMiddleware, getAccountDetails);

module.exports = router;