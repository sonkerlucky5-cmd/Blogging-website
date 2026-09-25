import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

async function makeAdmin() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to database...");

    const user = await User.findOne();
    if (!user) {
      console.log("No users found in the database. Please register a user on the website first.");
      process.exit(0);
    }

    user.isAdmin = true;
    await user.save();

    console.log(`Success! User '${user.username}' (${user.email}) is now an Admin.`);
    process.exit(0);
  } catch (err) {
    console.error("Error updating user:", err);
    process.exit(1);
  }
}

makeAdmin();
