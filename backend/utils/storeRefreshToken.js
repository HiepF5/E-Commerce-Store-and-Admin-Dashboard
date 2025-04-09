import redis from '../config/redis.js'
const storeRefreshToken = async (userId, refreshToken) => {
  try {
    await redis.set(
      `refresh_token:${userId}`,
      refreshToken,
      "EX",
      60 * 60 * 24 * 7
    );
  } catch (error) {
    console.error("Error storing refresh token:", error);
  }
};
export default storeRefreshToken