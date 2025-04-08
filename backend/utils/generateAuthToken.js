import jwt from "jsonwebtoken";
const generateAuthToken = async function (userId) {
  const accessToken = jwt.sign(
    { userId},
    process.env.ACCESS_JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_JWT_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
}
export default generateAuthToken;