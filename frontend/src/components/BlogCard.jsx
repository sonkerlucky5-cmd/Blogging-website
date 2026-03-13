import { Link } from "react-router-dom";
import { HiOutlineArrowRight, HiOutlineTrash } from "react-icons/hi2";
import { resolveImageUrl } from "../lib/api";
import { formatBlogDate, getExcerpt, getReadingTime } from "../utils/blogs";
import "./BlogCard.css";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80";

function BlogCard({ blog, onDelete, showDelete = false }) {
  const imageUrl = resolveImageUrl(blog.image) || FALLBACK_IMAGE;

  const handleDelete = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onDelete?.(blog);
  };

  return (
    <article className="article-card">
      <Link to={`/blog/${blog._id}`} className="article-card__link">
        <div className="article-card__media">
          <img src={imageUrl} alt={blog.title} />
        </div>

        <div className="article-card__content">
          <span className="article-card__category">
            {blog.category || "Editorial"}
          </span>

          <div className="article-card__meta">
            <span>{blog.author || "Anonymous"}</span>
            <span>{formatBlogDate(blog.createdAt)}</span>
          </div>

          <h3>{blog.title}</h3>
          <p>{getExcerpt(blog.content, 150)}</p>

          <div className="article-card__footer">
            <span className="meta-pill">{getReadingTime(blog.content)}</span>
            <span className="article-card__cta">
              Read article
              <HiOutlineArrowRight />
            </span>
          </div>
        </div>
      </Link>

      {showDelete && (
        <button
          type="button"
          className="article-card__delete"
          onClick={handleDelete}
        >
          <HiOutlineTrash />
          Delete
        </button>
      )}
    </article>
  );
}

export default BlogCard;
