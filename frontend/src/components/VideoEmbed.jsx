function extractYouTubeId(value) {
  try {
    const parsedUrl = new URL(value);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (hostname.includes("youtube.com")) {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v") || "";
      }

      const matchedPath = parsedUrl.pathname.match(
        /\/(?:embed|shorts|live)\/([^/?#]+)/
      );

      return matchedPath?.[1] || "";
    }
  } catch (error) {
    return "";
  }

  return "";
}

function extractVimeoId(value) {
  try {
    const parsedUrl = new URL(value);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (!hostname.includes("vimeo.com")) {
      return "";
    }

    const matchedPath = parsedUrl.pathname.match(/\/(\d+)(?:$|[/?#])/);
    return matchedPath?.[1] || "";
  } catch (error) {
    return "";
  }
}

export function getVideoDescriptor(value) {
  const normalizedValue = value?.trim() || "";

  if (!normalizedValue) {
    return null;
  }

  const youtubeId = extractYouTubeId(normalizedValue);

  if (youtubeId) {
    return {
      type: "embed",
      provider: "youtube",
      src: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }

  const vimeoId = extractVimeoId(normalizedValue);

  if (vimeoId) {
    return {
      type: "embed",
      provider: "vimeo",
      src: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(normalizedValue)) {
    return {
      type: "file",
      provider: "file",
      src: resolveImageUrl(normalizedValue),
    };
  }

  return null;
}

function VideoEmbed({ descriptor, title, className = "" }) {
  if (!descriptor) {
    return null;
  }

  if (descriptor.type === "file") {
    return (
      <video
        className={className}
        controls
        playsInline
        preload="metadata"
        src={descriptor.src}
      />
    );
  }

  return (
    <iframe
      className={className}
      src={descriptor.src}
      title={title || "Embedded video"}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}

export default VideoEmbed;
import { resolveImageUrl } from "../lib/api";
