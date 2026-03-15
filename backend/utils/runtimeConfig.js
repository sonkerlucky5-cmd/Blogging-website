const DEFAULT_DEV_MONGO_URI = "mongodb://127.0.0.1:27017/atlas-journal";
const DEFAULT_DEV_JWT_SECRET = "atlas-journal-local-dev-secret";
const DEFAULT_CLIENT_ORIGIN =
  "http://localhost:5173,http://127.0.0.1:5173";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function getPort() {
  return Number.parseInt(process.env.PORT, 10) || 5000;
}

export function getMongoUri() {
  return process.env.MONGO_URI?.trim() || (isProduction() ? "" : DEFAULT_DEV_MONGO_URI);
}

export function getJwtSecret() {
  return process.env.JWT_SECRET?.trim() || (isProduction() ? "" : DEFAULT_DEV_JWT_SECRET);
}

export function getClientOrigins() {
  return (process.env.CLIENT_ORIGIN || DEFAULT_CLIENT_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export default {
  getPort,
  getMongoUri,
  getJwtSecret,
  getClientOrigins,
};
