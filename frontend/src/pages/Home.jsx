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

  const categoryHighlights = useMemo(() => {
    const categoryMap = blogs.reduce((accumulator, blog) => {
      const category = (blog.category || "Editorial").trim();
      accumulator[category] = (accumulator[category] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(categoryMap)
      .sort((leftEntry, rightEntry) => rightEntry[1] - leftEntry[1])
      .slice(0, 4)
      .map(([label, count]) => ({
        label,
        count,
      }));
  }, [blogs]);

  return (
    <div className="home-page page-container">
      <section className="home-masthead">
        <div className="home-masthead__copy glass-panel">
          <p className="eyebrow">Volume 01</p>
          <h1 className="section-heading">
            A publication surface that feels curated, not copied.
          </h1>
          <p className="section-copy">
            Atlas Journal now reads more like a modern editorial product:
            stronger hierarchy, more intentional pacing, and a front page that
            feels distinct instead of template-driven.
          </p>

          <div className="home-masthead__actions">
            <Link to="/create" className="button-primary">
              Start writing
            </Link>
            <Link to="/blogs" className="button-secondary">
              Browse archive
            </Link>
          </div>
        </div>

        <aside className="home-masthead__aside glass-panel">
          <span className="home-masthead__label">Field notes</span>
          <h2>Current editorial focus</h2>
          <p>
            The front page now blends a feature-led story rail, category
            snapshots, and a cleaner reading rhythm across the archive.
          </p>

          <div className="home-masthead__topics">
            {categoryHighlights.length > 0 ? (
              categoryHighlights.map((category) => (
                <div key={category.label} className="home-masthead__topic">
                  <strong>{category.label}</strong>
                  <span>{category.count} stories</span>
                </div>
              ))
            ) : (
              <div className="home-masthead__topic">
                <strong>Editorial</strong>
                <span>Waiting for first publish</span>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="home-ledger">
        <div className="home-ledger__feature">
          {featuredBlog ? (
            <Link to={`/blog/${featuredBlog._id}`} className="feature-story">
              <div className="feature-story__media">
                <img
                  src={resolveImageUrl(featuredBlog.image) || FALLBACK_IMAGE}
                  alt={featuredBlog.title}
                />
              </div>

              <div className="feature-story__overlay" />

              <div className="feature-story__body">
                <div className="feature-story__meta">
                  <span>{featuredBlog.category || "Editorial"}</span>
                  <span>Lead story</span>
                </div>

                <h2>{featuredBlog.title}</h2>
                <p>{getExcerpt(featuredBlog.content, 180)}</p>

                <div className="feature-story__footer">
                  <span>{featuredBlog.author || "Anonymous"}</span>
                  <span>{formatBlogDate(featuredBlog.createdAt)}</span>
                  <span>{getReadingTime(featuredBlog.content)}</span>
                  <span className="feature-story__cta">
                    Read feature
                    <HiOutlineArrowRight />
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="status-card">
              <strong>No lead story yet</strong>
              <p>Publish your first article to unlock the editorial front page.</p>
            </div>
          )}
        </div>

        <div className="home-ledger__stack">
          <div className="glass-panel home-note">
            <span className="home-note__label">Editor&apos;s note</span>
            <h3>Distinctive by structure, not decoration.</h3>
            <p>
              Instead of another centered hero and grid, the homepage now opens
              like a journal cover with a feature lead, supporting dispatches,
              and a more composed reading flow.
            </p>
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
      </section>

      <section className="home-dispatch glass-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Dispatches</p>
            <h2>Three supporting stories with a clearer editorial rhythm.</h2>
          </div>
          <p>
            These entries now work like a front-page rail instead of generic
            cards.
          </p>
        </div>

        {secondaryBlogs.length > 0 ? (
          <div className="home-dispatch__list">
            {secondaryBlogs.map((blog, index) => (
              <Link
                to={`/blog/${blog._id}`}
                key={blog._id}
                className="home-dispatch__item"
              >
                <span className="home-dispatch__index">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="home-dispatch__content">
                  <div className="home-dispatch__meta">
                    <span>{blog.category || "Editorial"}</span>
                    <span>{blog.author || "Anonymous"}</span>
                    <span>{getReadingTime(blog.content)}</span>
                  </div>
                  <strong>{blog.title}</strong>
                  <p>{getExcerpt(blog.content, 110)}</p>
                </div>

                <span className="home-dispatch__arrow">
                  <HiOutlineArrowRight />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No supporting dispatches yet</strong>
            <p>More published stories will appear here automatically.</p>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">From the archive</p>
            <h2>Recent stories presented in a calmer, more premium grid.</h2>
          </div>
          <p>Real posts from your backend, still powered by the same live archive.</p>
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
