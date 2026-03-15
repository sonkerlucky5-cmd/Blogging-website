import express from "express";
import Blog from "../models/Blog.js";

const router = express.Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get("/", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const hasPagination =
      Number.isFinite(requestedPage) || Number.isFinite(requestedLimit);
    const safeQuery = escapeRegex(query);

    const searchFilter = query
      ? {
          $or: [
            { title: { $regex: safeQuery, $options: "i" } },
            { author: { $regex: safeQuery, $options: "i" } },
            { category: { $regex: safeQuery, $options: "i" } },
            { content: { $regex: safeQuery, $options: "i" } },
          ],
        }
      : {};

    if (!hasPagination) {
      const posts = await Blog.find(searchFilter).sort({ createdAt: -1 });
      return res.json(posts);
    }

    const page = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
    const limit = Math.min(
      24,
      Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 6)
    );
    const totalItems = await Blog.countDocuments(searchFilter);
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(page, totalPages);

    const posts = await Blog.find(searchFilter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit);

    return res.json({
      items: posts,
      pagination: {
        page: currentPage,
        limit,
        totalItems,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ message: "Error fetching posts" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, content, category, author, image } = req.body;
    const normalizedTitle = title?.trim() || "";
    const normalizedContent = content?.trim() || "";
    const normalizedCategory = category?.trim() || "Editorial";
    const normalizedAuthor = author?.trim() || "Anonymous";
    const normalizedImage = image?.trim() || "";

    if (!normalizedTitle || !normalizedContent) {
      return res
        .status(400)
        .json({ message: "Title and Content are required" });
    }

    if (normalizedTitle.length < 6) {
      return res
        .status(400)
        .json({ message: "Title should be at least 6 characters long" });
    }

    if (normalizedContent.length < 80) {
      return res
        .status(400)
        .json({ message: "Content should be at least 80 characters long" });
    }

    const newPost = new Blog({
      title: normalizedTitle,
      content: normalizedContent,
      category: normalizedCategory,
      author: normalizedAuthor,
      image: normalizedImage,
    });

    await newPost.save();
    return res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(400).json({ message: "Error creating post" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return res.status(500).json({ message: "Error fetching post" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedPost = await Blog.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ message: "Error deleting post" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };

    if (typeof updates.title === "string") {
      updates.title = updates.title.trim();
    }

    if (typeof updates.content === "string") {
      updates.content = updates.content.trim();
    }

    if (typeof updates.category === "string") {
      updates.category = updates.category.trim();
    }

    if (typeof updates.author === "string") {
      updates.author = updates.author.trim();
    }

    if (typeof updates.image === "string") {
      updates.image = updates.image.trim();
    }

    const updatedPost = await Blog.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return res.status(500).json({ message: "Error updating post" });
  }
});

export default router;
