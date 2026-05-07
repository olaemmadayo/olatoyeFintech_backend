require("dotenv").config();
const colors = require("colors");
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");


const PORT = process.env.PORT || 5000;

const app = express();
connectDB();

const allowedOrigins = [
  "https://olatoye-fintech-backend-btzq.vercel.app",
  "http://localhost:5173"
];

const corsOptions = {
  origin: function (origin, callback) {
    // If the origin is in our list, or if there is no origin (Postman/Mobile)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log the failure to the server console so you can see it in Render
      console.error(`CORS blocked for: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/customer", require("./routes/customerRoutes"));
app.use("/api/account", require("./routes/accountRoutes"));
app.use("/api/transaction", require("./routes/transactionRoutes"));

// Add a small check in your error handler
app.use((err, req, res, next) => {
  // If it's a CORS error, we might want to return 403 (Forbidden)
  const statusCode = err.message === "Not allowed by CORS" ? 403 : (err.statusCode || 500);
  
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});