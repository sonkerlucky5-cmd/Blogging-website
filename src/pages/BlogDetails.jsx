import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HiOutlineArrowLeft, HiOutlineTrash } from "react-icons/hi2";
import BlogCard from "../components/BlogCard";
import LoadingScreen from "../components/LoadingScreen";
import api, { resolveImageUrl } from "../lib/api";
import {
  formatBlogDate,
  getExcerpt,
  getParagraphs,
  getReadingTime,
} from "../utils/blogs";
import "./BlogDetails.css";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80";

function BlogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchBlogDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const [{ data: currentBlog }, { data: allBlogs }] = await Promise.all([
          api.get(`/posts/${id}`),
          api.get("/posts"),
        ]);

        setBlog(currentBlog);
        setRelatedBlogs(
          allBlogs
            .filter((item) => item._id !== id)
            .sort((leftBlog, rightBlog) => {
              const leftScore =
                leftBlog.category === currentBlog.category ? 1 : 0;
              const rightScore =
                rightBlog.category === currentBlog.category ? 1 : 0;

              return rightScore - leftScore;
            })
            .slice(0, 3)
        );
      } catch (err) {
        console.error("Error fetching blog details:", err);
        setError("The requested story could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!blog) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${blog.title}" from the archive?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete(`/posts/${blog._id}`);
      navigate("/blogs");
    } catch (err) {
      console.error("Error deleting blog:", err);
      window.alert("Delete failed. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="blogdetails-page page-container">
        <LoadingScreen
          compact
          title="Loading article"
          message="Pulling the full story and related posts."
        />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="blogdetails-page page-container">
        <div className="status-card">
          <strong>Article unavailable</strong>
          <p>{error || "This story no longer exists."}</p>
        </div>
      </div>
    );
  }

  const paragraphs = getParagraphs(blog.content);

  return (
    <div className="blogdetails-page page-container">
      <button
        type="button"
        className="blogdetails-back"
        onClick={() => navigate(-1)}
      >
        <HiOutlineArrowLeft />
        Back
      </button>

      <section className="blogdetails-hero">
        <div className="glass-panel blogdetails-copy">
          <p className="eyebrow">Article detail</p>
          <h1>{blog.title}</h1>
          <p className="blogdetails-excerpt">{getExcerpt(blog.content, 220)}</p>

          <div className="blogdetails-meta">
            <span className="meta-pill">{blog.category || "Editorial"}</span>
            <span className="meta-pill">{blog.author || "Anonymous"}</span>
            <span className="meta-pill">{formatBlogDate(blog.createdAt)}</span>
            <span className="meta-pill">{getReadingTime(blog.content)}</span>
          </div>
        </div>

        <div className="blogdetails-media">
          <img
            src={resolveImageUrl(blog.image) || FALLBACK_IMAGE}
            alt={blog.title}
          />
        </div>
      </section>

      <section className="blogdetails-layout">
        <article className="glass-panel blogdetails-article">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>

        <aside className="blogdetails-sidebar">
          <div className="glass-panel blogdetails-panel">
            <p className="eyebrow">Publishing info</p>
            <h3>Story snapshot</h3>
            <dl>
              <div>
                <dt>Category</dt>
                <dd>{blog.category || "Editorial"}</dd>
              </div>
              <div>
                <dt>Author</dt>
                <dd>{blog.author || "Anonymous"}</dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>{formatBlogDate(blog.createdAt)}</dd>
              </div>
              <div>
                <dt>Read time</dt>
                <dd>{getReadingTime(blog.content)}</dd>
              </div>
            </dl>

            <button
              type="button"
              className="button-secondary blogdetails-delete"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <HiOutlineTrash />
              {isDeleting ? "Deleting..." : "Delete article"}
            </button>
          </div>

          {relatedBlogs.length > 0 && (
            <div className="blogdetails-related">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Keep reading</p>
                  <h3>Related stories</h3>
                </div>
              </div>

              <div className="blogdetails-related__list">
                {relatedBlogs.map((relatedBlog) => (
                  <BlogCard key={relatedBlog._id} blog={relatedBlog} />
                ))}
              </div>
            </div>
          )}

          <Link to="/create" className="glass-panel blogdetails-cta">
            <p className="eyebrow">Create next</p>
            <h3>Publish another article</h3>
            <p>Use the upgraded editor form to ship the next piece.</p>
          </Link>
        </aside>
      </section>
    </div>
  );
}

export default BlogDetails;
