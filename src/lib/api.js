import axios from "axios";

const API_ROOT =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

const APP_ORIGIN = API_ROOT.replace(/\/api$/, "");

const api = axios.create({
  baseURL: API_ROOT,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function resolveImageUrl(image) {
  if (!image || !image.trim()) {
    return "";
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${APP_ORIGIN}${image.startsWith("/") ? image : `/${image}`}`;
}

export default api;
