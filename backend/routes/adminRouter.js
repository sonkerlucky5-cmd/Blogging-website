import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Blog from "../models/Blog.js";
import { requireAdmin } from "../middleware/auth.js";
import { getJwtSecret } from "../utils/runtimeConfig.js";

const router = express.Router();

// Admin login
router.post("/login", (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (password === adminPassword) {
    const token = jwt.sign({ role: "admin" }, getJwtSecret(), { expiresIn: "1d" });
    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid admin password" });
});

// Protect all following routes with requireAdmin
router.use(requireAdmin);

// Get dashboard stats
router.get("/stats", async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBlogs = await Blog.countDocuments();
    return res.json({ totalUsers, totalBlogs });
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Optionally delete all their blogs
    await Blog.deleteMany({ authorId: req.params.id });
    
    return res.json({ message: "User and their blogs deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Get all blogs (for admin)
router.get("/blogs", async (req, res, next) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    return res.json(blogs);
  } catch (error) {
    next(error);
  }
});

// Delete any blog
router.delete("/blogs/:id", async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    return res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
