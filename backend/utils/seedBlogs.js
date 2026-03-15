import Blog from "../models/Blog.js";
import sampleBlogs from "../data/sampleBlogs.js";

export async function seedBlogsIfEmpty() {
  const existingCount = await Blog.countDocuments();

  if (existingCount > 0) {
    return {
      skipped: true,
      inserted: 0,
    };
  }

  await Blog.insertMany(sampleBlogs);

  return {
    skipped: false,
    inserted: sampleBlogs.length,
  };
}

export default seedBlogsIfEmpty;
