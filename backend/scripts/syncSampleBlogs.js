import mongoose from "mongoose";
import dotenv from "dotenv";
import Blog from "../models/Blog.js";
import sampleBlogs from "../data/sampleBlogs.js";
import { getMongoUri } from "../utils/runtimeConfig.js";

dotenv.config();

async function run() {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    throw new Error("Missing MONGO_URI in backend environment variables");
  }

  await mongoose.connect(mongoUri);

  let updated = 0;
  let inserted = 0;

  for (const blog of sampleBlogs) {
    const existingPost = await Blog.findOne({ title: blog.title });

    if (existingPost) {
      await Blog.updateOne({ _id: existingPost._id }, { $set: blog });
      updated += 1;
      continue;
    }

    await Blog.create(blog);
    inserted += 1;
  }

  console.log(`Sample blogs synced. Updated: ${updated}, inserted: ${inserted}`);
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error("Sample blog sync failed:", error.message);
  process.exit(1);
});
