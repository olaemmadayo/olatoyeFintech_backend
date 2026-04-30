const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
     console.error(`Error connecting to MongoDB: ${error.message}`.red.underline);
    process.exit(1);
  }
};

//mongodb+srv://emmanueltolatoye_db_user:i9sxtUWOJRitR5pm@cluster0.ncm910o.mongodb.net/

module.exports = connectDB;