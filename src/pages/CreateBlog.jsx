import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { resolveImageUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { getExcerpt, getReadingTime } from "../utils/blogs";
import "./CreateBlog.css";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1400&q=80";
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

function CreateBlog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    author: "",
    category: "Strategy",
    image: "",
    content: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((currentForm) => {
      if (currentForm.author.trim()) {
        return currentForm;
      }

      return {
        ...currentForm,
        author: user.name || user.username || "",
      };
    });
  }, [user]);

  const updateField = (field) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.title.trim().length < 6) {
      setError("Title should be at least 6 characters long.");
      return;
    }

    if (form.content.trim().length < 80) {
      setError("Content should be at least 80 characters long.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);

      const payload = {
        title: form.title.trim(),
        author: form.author.trim() || "Anonymous",
        category: form.category,
        image: form.image.trim(),
        content: form.content.trim(),
      };

      const { data } = await api.post("/posts", payload);
      navigate(`/blog/${data._id}`);
    } catch (err) {
      console.error("Error creating blog:", err);
      setError("Publishing failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewImage = resolveImageUrl(form.image) || FALLBACK_IMAGE;

  return (
    <div className="create-page page-container">
      <section className="create-hero glass-panel">
        <div>
          <p className="eyebrow">Writer studio</p>
          <h1 className="section-heading">Publish with stronger structure and polish.</h1>
          <p className="section-copy">
            The form now supports author identity, live preview, cleaner layout,
            and direct redirect into the full article page after publishing.
          </p>
        </div>

        <div className="create-hero__notice">
          <strong>{user ? `Welcome back, ${user.name || user.username}` : "Guest publishing enabled"}</strong>
          <span>
            {user
              ? "Your author name is prefilled from the signed-in account."
              : "You can still publish as a guest author, but sign in for a cleaner workflow."}
          </span>
        </div>
      </section>

      <section className="create-layout">
        <form className="glass-panel create-form" onSubmit={handleSubmit}>
          <div className="create-form__header">
            <h2>Article details</h2>
            <p>Use clean titles and readable paragraphs for a better archive.</p>
          </div>

          <label>
            <span>Title</span>
            <input
              type="text"
              placeholder="Write a headline people will remember"
              value={form.title}
              onChange={updateField("title")}
            />
          </label>

          <div className="create-form__row">
            <label>
              <span>Author</span>
              <input
                type="text"
                placeholder="Author name"
                value={form.author}
                onChange={updateField("author")}
              />
            </label>

            <label>
              <span>Category</span>
              <select value={form.category} onChange={updateField("category")}>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Cover image URL</span>
            <input
              type="text"
              placeholder="https://..."
              value={form.image}
              onChange={updateField("image")}
            />
          </label>

          <label>
            <span>Story</span>
            <textarea
              placeholder="Write your article here..."
              value={form.content}
              onChange={updateField("content")}
              rows="12"
            />
          </label>

          {error && <p className="create-form__error">{error}</p>}

          <button type="submit" className="button-primary create-form__submit" disabled={isSubmitting}>
            {isSubmitting ? "Publishing..." : "Publish article"}
          </button>
        </form>

        <aside className="create-sidebar">
          <div className="glass-panel create-preview">
            <p className="eyebrow">Live preview</p>
            <div className="create-preview__image">
              <img src={previewImage} alt={form.title || "Preview"} />
            </div>
            <h3>{form.title || "Your future headline"}</h3>
            <div className="create-preview__meta">
              <span className="meta-pill">{form.category}</span>
              <span className="meta-pill">{form.author.trim() || "Anonymous"}</span>
              <span className="meta-pill">{getReadingTime(form.content)}</span>
            </div>
            <p>{getExcerpt(form.content || "Start writing to generate a preview.", 180)}</p>
          </div>

          <div className="glass-panel create-tips">
            <p className="eyebrow">Publishing tips</p>
            <h3>Raise the quality bar</h3>
            <ul>
              <li>Lead with a specific promise in the headline.</li>
              <li>Pick a category so the archive feels intentional.</li>
              <li>Use short paragraphs so the detail page reads cleanly.</li>
              <li>Add a strong cover image to make the archive look premium.</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default CreateBlog;
