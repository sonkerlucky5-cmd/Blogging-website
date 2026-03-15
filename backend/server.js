import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import postRouter from "./routes/postRouter.js";
import authRouter from "./routes/auth.js";
import assistantRouter from "./routes/assistantRouter.js";
import {
  getClientOrigins,
  getJwtSecret,
  getMongoUri,
  getPort,
} from "./utils/runtimeConfig.js";
import { seedBlogsIfEmpty } from "./utils/seedBlogs.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.join(__dirname, "uploads");
const port = getPort();
const mongoUri = getMongoUri();
const jwtSecret = getJwtSecret();
const clientOrigins = getClientOrigins();

fs.mkdirSync(uploadDirectory, { recursive: true });

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDirectory));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/posts", postRouter);
app.use("/api/auth", authRouter);
app.use("/api/assistant", assistantRouter);

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image uploads are allowed"));
      return;
    }

    callback(null, true);
  },
});

const handleImageUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  return res.status(201).json({ imageUrl: `/uploads/${req.file.filename}` });
};

app.post("/api/uploads", upload.single("image"), handleImageUpload);
app.post("/upload", upload.single("image"), handleImageUpload);

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.message });
  }

  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({ message: error.message });
  }

  console.error("Unhandled server error:", error);
  return res
    .status(500)
    .json({ message: error.message || "Internal server error" });
});

async function startServer() {
  if (!mongoUri) {
    throw new Error("Missing MONGO_URI in backend environment variables");
  }

  if (!jwtSecret) {
    throw new Error("Missing JWT_SECRET in backend environment variables");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");

  try {
    const result = await seedBlogsIfEmpty();

    if (!result.skipped) {
      console.log(`Seeded ${result.inserted} professional sample blogs`);
    }
  } catch (error) {
    console.error("Blog seeding failed:", error.message);
  }

  const server = app.listen(port);

  server.on("listening", () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Allowed origins: ${clientOrigins.join(", ")}`);
  });

  server.on("error", async (error) => {
    if (error.code === "EADDRINUSE") {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/api/health`);

        if (response.ok) {
          console.log(
            `Backend is already running on port ${port}. Use the current server, or stop the older process before starting a new one.`
          );
          process.exit(0);
          return;
        }
      } catch (requestError) {
        // Ignore probe errors and fall through to the generic port-in-use message.
      }

      console.error(
        `Port ${port} is already in use. Stop the existing process or change PORT in backend/.env.`
      );
      process.exit(1);
      return;
    }

    console.error("Server listen error:", error.message);
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error("Server startup error:", error.message);
  process.exit(1);
});

export default app;
