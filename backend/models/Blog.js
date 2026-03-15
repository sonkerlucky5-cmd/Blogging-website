import mongoose from "mongoose";

const CATEGORY_OPTIONS = [
  "Strategy",
  "Engineering",
  "Operations",
  "Growth",
  "Systems",
  "Leadership",
  "Design",
  "Product",
  "Editorial",
];

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 80,
    },
    category: {
      type: String,
      trim: true,
      enum: CATEGORY_OPTIONS,
      default: "Editorial",
    },
    author: {
      type: String,
      trim: true,
      default: "Anonymous",
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Blog", blogSchema);
