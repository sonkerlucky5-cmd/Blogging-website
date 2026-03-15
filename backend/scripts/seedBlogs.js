import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedBlogsIfEmpty } from "../utils/seedBlogs.js";
import { getMongoUri } from "../utils/runtimeConfig.js";

dotenv.config();

async function run() {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    throw new Error("Missing MONGO_URI in backend environment variables");
  }

  await mongoose.connect(mongoUri);
  const result = await seedBlogsIfEmpty();

  if (result.skipped) {
    console.log("Seed skipped because blog data already exists");
  } else {
    console.log(`Seeded ${result.inserted} professional sample blogs`);
  }

  await mongoose.disconnect();
}

run()
  .catch((error) => {
    console.error("Seed script failed:", error.message);
    process.exit(1);
  });
