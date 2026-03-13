import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BlogCard from "../components/BlogCard";
import LoadingScreen from "../components/LoadingScreen";
import api from "../lib/api";
import "./BlogList.css";

const PAGE_SIZE = 6;

const EMPTY_PAGINATION = {
  page: 1,
  limit: PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 1) {
    return [];
  }

  const visiblePages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const normalizedPages = [...visiblePages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((leftPage, rightPage) => leftPage - rightPage);

  const items = [];

  normalizedPages.forEach((pageNumber, index) => {
    const previousPage = normalizedPages[index - 1];

    if (previousPage && pageNumber - previousPage > 1) {
      items.push(`ellipsis-${pageNumber}`);
    }

    items.push(pageNumber);
  });

  return items;
}

function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q")?.trim() || "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);

  const paginationItems = useMemo(
    () => buildPaginationItems(pagination.page, pagination.totalPages),
    [pagination.page, pagination.totalPages]
  );

  const pageStart =
    pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = pagination.totalItems === 0 ? 0 : pageStart + blogs.length - 1;

  const updatePage = (nextPage, replace = false) => {
    const nextParams = new URLSearchParams();

    if (query) {
      nextParams.set("q", query);
    }

    if (nextPage > 1) {
      nextParams.set("page", String(nextPage));
    }

    setSearchParams(nextParams, { replace });
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/posts", {
          params: {
            ...(query ? { q: query } : {}),
            page,
            limit: PAGE_SIZE,
          },
        });

        if (Array.isArray(data)) {
          const totalItems = data.length;
          const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
          const currentPage = Math.min(page, totalPages);
          const startIndex = (currentPage - 1) * PAGE_SIZE;
          const items = data.slice(startIndex, startIndex + PAGE_SIZE);

          setBlogs(items);
          setPagination({
            page: currentPage,
            limit: PAGE_SIZE,
            totalItems,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
          });

          if (currentPage !== page) {
            updatePage(currentPage, true);
          }

          return;
        }

        setBlogs(data.items || []);
        setPagination(data.pagination || EMPTY_PAGINATION);

        if (data.pagination?.page && data.pagination.page !== page) {
          updatePage(data.pagination.page, true);
        }
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setError("We could not load the archive right now.");
        setBlogs([]);
        setPagination(EMPTY_PAGINATION);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [page, query]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handlePageChange = (nextPage) => {
    if (
      nextPage === pagination.page ||
      nextPage < 1 ||
      nextPage > pagination.totalPages
    ) {
      return;
    }

    updatePage(nextPage);
  };

  return (
    <div className="bloglist-page page-container">
      <section className="bloglist-hero glass-panel">
        <div>
          <p className="eyebrow">Explore the archive</p>
          <h1 className="section-heading">
            {query ? `Search results for "${query}"` : "A sharper, more curated blog archive."}
          </h1>
          <p className="section-copy">
            Search, skim, and move through a paginated editorial archive
            without losing the cleaner spacing, backend search, or reading flow.
          </p>
        </div>

        <div className="bloglist-summary">
          <div className="bloglist-summary__item">
            <strong>{loading ? "--" : pagination.totalItems}</strong>
            <span>{query ? "Matching stories" : "Published stories"}</span>
          </div>
          <div className="bloglist-summary__item">
            <strong>
              {loading
                ? "--"
                : `${String(pagination.page).padStart(2, "0")}/${String(
                    pagination.totalPages
                  ).padStart(2, "0")}`}
            </strong>
            <span>Page position</span>
          </div>
        </div>
      </section>

      <section className="bloglist-layout">
        <div className="bloglist-feed">
          {loading ? (
            <LoadingScreen
              compact
              title="Loading archive"
              message="Fetching posts from your backend."
            />
          ) : error ? (
            <div className="status-card">
              <strong>Archive unavailable</strong>
              <p>{error}</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="empty-state">
              <strong>No matching stories</strong>
              <p>
                Try a broader keyword or publish a new article from the writer
                dashboard.
              </p>
            </div>
          ) : (
            <div className="card-grid bloglist-grid">
              {blogs.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
          )}

          {!loading && !error && pagination.totalItems > 0 && pagination.totalPages > 1 && (
            <div className="glass-panel bloglist-pagination">
              <div className="bloglist-pagination__summary">
                <span>
                  Showing {pageStart}-{pageEnd}
                </span>
                <strong>of {pagination.totalItems} stories</strong>
              </div>

              <div className="bloglist-pagination__controls">
                <button
                  type="button"
                  className="button-ghost bloglist-pagination__nav"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  Previous
                </button>

                <div className="bloglist-pagination__pages">
                  {paginationItems.map((item) =>
                    typeof item === "number" ? (
                      <button
                        key={item}
                        type="button"
                        className={`bloglist-pagination__page${
                          item === pagination.page ? " is-active" : ""
                        }`}
                        onClick={() => handlePageChange(item)}
                        aria-current={item === pagination.page ? "page" : undefined}
                      >
                        {item}
                      </button>
                    ) : (
                      <span key={item} className="bloglist-pagination__ellipsis">
                        ...
                      </span>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="button-ghost bloglist-pagination__nav"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="bloglist-sidebar">
          <div className="glass-panel bloglist-note">
            <p className="eyebrow">Search notes</p>
            <h3>What changed</h3>
            <p>
              The archive now uses a shared card system, cleaner spacing,
              responsive structure, real backend search, and page-based browsing.
            </p>
          </div>

          <div className="glass-panel bloglist-note">
            <p className="eyebrow">Editorial workflow</p>
            <h3>Best use</h3>
            <p>
              Use short, specific titles and author names. They now show up more
              clearly across the homepage, archive, and article detail pages.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default BlogList;
