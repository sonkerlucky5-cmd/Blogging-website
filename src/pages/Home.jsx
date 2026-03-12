import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineArrowRight } from "react-icons/hi2";
import BlogCard from "../components/BlogCard";
import LoadingScreen from "../components/LoadingScreen";
import api, { resolveImageUrl } from "../lib/api";
import { formatBlogDate, getExcerpt, getReadingTime } from "../utils/blogs";
import "./Home.css";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80";

function Home() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/posts");
      setBlogs(data);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError("Unable to load stories right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const featuredBlog = blogs[0];
  const secondaryBlogs = blogs.slice(1, 4);
  const archiveBlogs = blogs.slice(1, 7);

  const stats = useMemo(() => {
    const contributorCount = new Set(
      blogs.map((blog) => (blog.author || "Anonymous").trim())
    ).size;
    const words = blogs.reduce((count, blog) => {
      return count + (blog.content || "").split(/\s+/).filter(Boolean).length;
    }, 0);

    return [
      { label: "Stories published", value: `${blogs.length}`.padStart(2, "0") },
      { label: "Contributors", value: `${contributorCount}`.padStart(2, "0") },
      { label: "Words archived", value: `${Math.max(1, Math.round(words / 1000))}k` },
    ];
  }, [blogs]);

  return (
    <div className="home-page page-container">
      <section className="home-hero glass-panel">
        <div className="home-hero__copy">
          <p className="eyebrow">Editorial grade publishing</p>
          <h1 className="section-heading">
            Turn simple blog posts into a brand people remember.
          </h1>
          <p className="section-copy">
            Your platform now feels closer to a modern editorial product:
            premium layout, stronger hierarchy, live search flow, and
            data-backed reading pages across the app.
          </p>

          <div className="home-hero__actions">
            <Link to="/create" className="button-primary">
              Start writing
            </Link>
            <Link to="/blogs" className="button-secondary">
              Explore archive
            </Link>
          </div>

          <div className="home-hero__stats">
            {stats.map((stat) => (
              <div key={stat.label} className="home-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="home-hero__feature">
          {featuredBlog ? (
            <Link to={`/blog/${featuredBlog._id}`} className="feature-story">
              <div className="feature-story__media">
                <img
                  src={resolveImageUrl(featuredBlog.image) || FALLBACK_IMAGE}
                  alt={featuredBlog.title}
                />
              </div>

              <div className="feature-story__body">
                <div className="feature-story__meta">
                  <span>{featuredBlog.category || "Editorial"}</span>
                  <span>Featured story</span>
                  <span>{formatBlogDate(featuredBlog.createdAt)}</span>
                  <span>{getReadingTime(featuredBlog.content)}</span>
                </div>

                <h2>{featuredBlog.title}</h2>
                <p>{getExcerpt(featuredBlog.content, 200)}</p>

                <div className="feature-story__footer">
                  <span>{featuredBlog.author || "Anonymous"}</span>
                  <span className="feature-story__cta">
                    Read story
                    <HiOutlineArrowRight />
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="status-card">
              <strong>No articles yet</strong>
              <p>
                Publish your first blog to unlock the featured editorial
                section.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="home-strip">
        {secondaryBlogs.map((blog) => (
          <Link to={`/blog/${blog._id}`} key={blog._id} className="home-strip__item">
            <span className="home-strip__label">{blog.category || "Editorial"}</span>
            <strong>{blog.title}</strong>
            <span>
              {blog.author || "Anonymous"} • {getReadingTime(blog.content)}
            </span>
          </Link>
        ))}
      </section>

      <section className="home-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Fresh from the desk</p>
            <h2>Recent stories with stronger visual rhythm.</h2>
          </div>
          <p>Real posts from your backend, styled like a polished publication.</p>
        </div>

        {loading ? (
          <LoadingScreen
            compact
            title="Loading stories"
            message="Pulling the latest posts from your archive."
          />
        ) : error ? (
          <div className="status-card">
            <strong>Could not load stories</strong>
            <p>{error}</p>
          </div>
        ) : archiveBlogs.length === 0 ? (
          <div className="empty-state">
            <strong>No published stories yet</strong>
            <p>Create your first article to populate the home feed.</p>
          </div>
        ) : (
          <div className="card-grid">
            {archiveBlogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
