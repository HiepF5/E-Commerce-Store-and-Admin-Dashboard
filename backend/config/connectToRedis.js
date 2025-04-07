import Redis from "ioredis";
import dotenv from "dotenv";

// Load biến môi trường từ .env
dotenv.config();

// Chọn URL Redis ưu tiên
const redisUrl = process.env.REDIS_UPSTASH_URL || process.env.REDIS_LOCAL_URL;

// Kiểm tra nếu không có URL Redis
if (!redisUrl) {
  console.error("❌ ERROR: No Redis URL found in environment variables!");
  process.exit(1);
}

// Kiểm tra loại Redis
const isUpstash = redisUrl.startsWith("rediss://"); // Upstash luôn dùng TLS
const useTLS = process.env.REDIS_TLS === "true" || isUpstash; // Bật TLS nếu REDIS_TLS=true hoặc là Upstash
const redisOptions = {};

// Cấu hình TLS nếu cần
if (useTLS) {
  redisOptions.tls = {}; // Bật SSL/TLS
} else {
  redisOptions.password = process.env.REDIS_PASSWORD || undefined; // Dùng mật khẩu nếu có
}

// Kết nối Redis
const redis = new Redis(redisUrl, redisOptions);

redis.on("connect", () => {
  console.log(
    `✅ Connected to ${isUpstash ? "Upstash Redis" : "Local Redis"} with ${
      useTLS ? "TLS" : "No TLS"
    }`
  );
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

export default redis;
