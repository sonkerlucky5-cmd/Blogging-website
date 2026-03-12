export function formatBlogDate(value) {
  if (!value) {
    return "Freshly published";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Freshly published";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getReadingTime(content = "") {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));

  return `${minutes} min read`;
}

export function getExcerpt(content = "", limit = 140) {
  const cleanContent = content.replace(/\s+/g, " ").trim();

  if (cleanContent.length <= limit) {
    return cleanContent;
  }

  return `${cleanContent.slice(0, limit).trim()}...`;
}

export function getParagraphs(content = "") {
  return content
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
