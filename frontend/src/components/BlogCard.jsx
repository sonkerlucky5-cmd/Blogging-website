import { Link } from "react-router-dom";
import {
  HiOutlineArrowRight,
  HiOutlinePlayCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import { resolveImageUrl } from "../lib/api";
import PROFESSIONAL_MEDIA from "../lib/media";
import { formatBlogDate, getExcerpt, getReadingTime } from "../utils/blogs";
import "./BlogCard.css";

const FALLBACK_IMAGE = PROFESSIONAL_MEDIA.editorialDesk;

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
          {blog.video && (
            <span className="article-card__video-badge">
              <HiOutlinePlayCircle />
              Video
            </span>
          )}
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
