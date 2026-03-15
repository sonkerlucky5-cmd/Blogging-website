import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";
import { getJwtSecret } from "../utils/runtimeConfig.js";

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

function serializeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

router.post("/register", async (req, res) => {
  try {
    const name = req.body.name?.trim() || "";
    const username = req.body.username?.trim().toLowerCase() || "";
    const email = req.body.email?.trim().toLowerCase() || "";
    const password = req.body.password || "";

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password should be at least 6 characters" });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Email or username is already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      token: createToken(user),
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const emailOrUsername = req.body.emailOrUsername?.trim().toLowerCase() || "";
    const password = req.body.password || "";

    if (!emailOrUsername || !password) {
      return res
        .status(400)
        .json({ message: "Email or username and password are required" });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      token: createToken(user),
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/profile", requireAuth, async (req, res) => {
  return res.json(serializeUser(req.user));
});

export default router;
