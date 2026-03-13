import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
const PROFESSIONAL_STARTERS = [
  {
    label: "Founder memo",
    title: "How Founders Can Turn AI Into a Reliable Content Operating System",
    category: "Strategy",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
    brief:
      "Write a professional blog for startup founders on using AI assistants to improve editorial planning, content quality, and execution without losing brand clarity.",
  },
  {
    label: "Product dispatch",
    title: "What Strong Product Teams Get Right About Shipping AI Features",
    category: "Product",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    brief:
      "Create a polished article for product leaders about launching AI features with better discovery, quality control, and user trust.",
  },
  {
    label: "Editorial playbook",
    title: "A Better Editorial Workflow for Modern Publishing Teams",
    category: "Editorial",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80",
    brief:
      "Draft a professional editorial operations article about briefs, review cycles, publishing standards, and stronger article consistency.",
  },
];

function CreateBlog() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [aiBrief, setAiBrief] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiStatus, setAiStatus] = useState("");
  const [aiNotice, setAiNotice] = useState("");
  const isNewSignup = Boolean(location.state?.fromSignup);
  const signupFirstName =
    location.state?.firstName || user?.name || user?.username || "Writer";

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

  const handleGenerateDraft = async (mode = "draft", overrides = {}) => {
    const draftRequest = {
      brief: overrides.brief ?? aiBrief.trim(),
      title: overrides.title ?? form.title,
      category: overrides.category ?? form.category,
      content: overrides.content ?? form.content,
    };

    if (
      !draftRequest.brief.trim() &&
      !draftRequest.title.trim() &&
      !draftRequest.content.trim()
    ) {
      setAiError("Add a brief, title, or draft content first.");
      return;
    }

    try {
      setAiError("");
      setAiStatus("");
      setAiNotice("");
      setAiLoading(true);

      const { data } = await api.post("/assistant/draft", {
        mode,
        brief: draftRequest.brief,
        title: draftRequest.title,
        category: draftRequest.category,
        content: draftRequest.content,
      });

      setAiBrief(draftRequest.brief);
      setForm((currentForm) => ({
        ...currentForm,
        title: data.title || draftRequest.title || currentForm.title,
        category: data.category || draftRequest.category || currentForm.category,
        image:
          currentForm.image.trim() ||
          overrides.image ||
          currentForm.image ||
          "",
        content: data.content || draftRequest.content || currentForm.content,
      }));
      setAiNotice(data.notice || "");
      setAiStatus(data.summary || "AI draft applied to your editor.");
    } catch (err) {
      console.error("AI draft error:", err);
      setAiError(
        err.response?.data?.message ||
          "AI draft generation failed. Check backend AI configuration."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyStarter = (starter) => {
    setError("");
    setAiBrief(starter.brief);
    setForm((currentForm) => ({
      ...currentForm,
      title: starter.title,
      category: starter.category,
      image: starter.image,
    }));

    void handleGenerateDraft("draft", {
      brief: starter.brief,
      title: starter.title,
      category: starter.category,
      content: "",
      image: starter.image,
    });
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
  const wordCount = form.content.trim()
    ? form.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const isBlankDraft =
    !form.title.trim() && !form.content.trim() && !aiBrief.trim();
  const publishChecks = [
    {
      label: "Headline is defined",
      passed: form.title.trim().length >= 12,
    },
    {
      label: "Author identity is ready",
      passed: form.author.trim().length >= 2,
    },
    {
      label: "Cover image is attached",
      passed: Boolean(form.image.trim()),
    },
    {
      label: "Article has enough depth",
      passed: wordCount >= 180,
    },
  ];
  const completedChecks = publishChecks.filter((check) => check.passed).length;
  const publishReady = completedChecks === publishChecks.length;

  return (
    <div className="create-page page-container">
      <section className="create-hero glass-panel">
        <div>
          <p className="eyebrow">{isNewSignup ? "Welcome onboard" : "Writer studio"}</p>
          <h1 className="section-heading">
            {isNewSignup
              ? "Your account is ready. Start with a strong first story."
              : "Publish with stronger structure and polish."}
          </h1>
          <p className="section-copy">
            {isNewSignup
              ? "You are already signed in and your workspace is prepared. Use this first article to define the tone of your publication."
              : "Start from a professional brief, shape the article with AI support, and publish through a cleaner editorial workflow."}
          </p>
        </div>

        <div
          className={`create-hero__notice${
            isNewSignup ? " create-hero__notice--welcome" : ""
          }`}
        >
          <strong>
            {isNewSignup
              ? `Nice start, ${signupFirstName}`
              : user
                ? `Welcome back, ${user.name || user.username}`
                : "Guest publishing enabled"}
          </strong>
          <span>
            {isNewSignup
              ? "Your profile is active, your author name is already filled in, and the next step is to publish your first article."
              : user
                ? "Your author name is prefilled from the signed-in account."
                : "You can still publish as a guest author, but sign in for a cleaner workflow."}
          </span>

          {isNewSignup && (
            <div className="create-hero__welcome-points">
              <span>Profile connected</span>
              <span>Author identity ready</span>
              <span>First draft starts here</span>
            </div>
          )}
        </div>
      </section>

      <section className="create-layout">
        <form className="glass-panel create-form" onSubmit={handleSubmit}>
          <div className="create-form__header">
            <h2>Article details</h2>
            <p>Use clean titles, strong structure, and a final publish check before posting.</p>
          </div>

          <div className="create-form__starter">
            <div className="create-form__starter-copy">
              <p className="eyebrow">Ready-made starts</p>
              <h3>{isBlankDraft ? "Start from a professional blog brief" : "Need a stronger angle?"}</h3>
              <p>
                Pick one editorial direction and the draft will be prepared with
                a cleaner title, category, and first version of the article.
              </p>
            </div>

            <div className="create-form__starter-grid">
              {PROFESSIONAL_STARTERS.map((starter) => (
                <button
                  key={starter.label}
                  type="button"
                  className="create-form__starter-card"
                  onClick={() => handleApplyStarter(starter)}
                  disabled={aiLoading}
                >
                  <span className="create-form__starter-tag">{starter.label}</span>
                  <strong>{starter.title}</strong>
                  <span>{starter.category}</span>
                </button>
              ))}
            </div>
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

          <div className="create-form__review">
            <div className="create-form__review-head">
              <div>
                <p className="eyebrow">Publish review</p>
                <h3>{publishReady ? "This post is publication-ready" : "Finish the final quality checks"}</h3>
              </div>
              <span className="create-form__review-score">
                {completedChecks}/{publishChecks.length}
              </span>
            </div>

            <div className="create-form__review-list">
              {publishChecks.map((check) => (
                <span
                  key={check.label}
                  className={`create-form__review-pill${
                    check.passed ? " is-passed" : ""
                  }`}
                >
                  {check.label}
                </span>
              ))}
            </div>

            <p className="create-form__review-copy">
              {publishReady
                ? "Title, author, cover, and article depth are in place. You can publish this post with confidence."
                : "Complete the missing items so the post feels finished and professional in the archive."}
            </p>
          </div>

          {error && <p className="create-form__error">{error}</p>}

          <div className="create-form__submit-bar">
            <div>
              <strong>Publishing action</strong>
              <span>
                {publishReady
                  ? "Ready for a clean public post."
                  : "You can still publish, but the review panel above shows what is missing."}
              </span>
            </div>

            <button
              type="submit"
              className="button-primary create-form__submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Publishing..." : "Publish article"}
            </button>
          </div>
        </form>

        <aside className="create-sidebar">
          <div className="glass-panel create-assistant">
            <p className="eyebrow">AI writing copilot</p>
            <h3>Generate a stronger first draft</h3>
            <p>
              Describe the angle, audience, or outcome you want. AI can build a
              draft or improve what you already wrote.
            </p>

            <textarea
              value={aiBrief}
              onChange={(event) => setAiBrief(event.target.value)}
              placeholder="Example: Write a blog for startup founders on using AI assistants in content workflows."
              rows="5"
            />

            <div className="create-assistant__actions">
              <button
                type="button"
                className="button-primary"
                onClick={() => handleGenerateDraft("draft")}
                disabled={aiLoading}
              >
                {aiLoading ? "Generating..." : "Generate draft"}
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={() => handleGenerateDraft("improve")}
                disabled={aiLoading}
              >
                Improve current draft
              </button>
            </div>

            {aiNotice && <p className="create-assistant__notice">{aiNotice}</p>}
            {aiError && <p className="create-assistant__error">{aiError}</p>}
            {aiStatus && <p className="create-assistant__status">{aiStatus}</p>}
          </div>

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
              <span className="meta-pill">{wordCount || 0} words</span>
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
