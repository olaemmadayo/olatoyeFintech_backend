require("dotenv").config();
const colors = require("colors");
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");


const PORT = process.env.PORT || 5000;

const app = express();
connectDB();

const corsOptions = {
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/customer", require("./routes/customerRoutes"));
app.use("/api/account", require("./routes/accountRoutes"));
app.use("/api/transaction", require("./routes/transactionRoutes"));

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});