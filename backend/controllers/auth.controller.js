import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";
import generateAuthToken from "../utils/generateAuthToken.js";
import setAuthCookies from "../utils/setAuthCookies.js";
import storeRefreshToken from "../utils/storeRefreshToken.js";
const signup = async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).send({ error: "User already exists" });
    }
    const user = await User.create({
      email,
      password,
      username,
    });
    //authenticate the user
    const { accessToken, refreshToken } = await generateAuthToken(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({
      user,
      message: "User created successfully",
    });
  } catch (error) {
    console.log("Error in signup controller: ", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = await generateAuthToken(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setAuthCookies(res, accessToken, refreshToken);
      res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        message: "Login successful",
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error in login controller: ", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).send({ message: "Unauthorized" });
    }
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller: ", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
    const userId = decoded.userId;
    const storedRefreshToken = await redis.get(`refresh_token:${userId}`);
    if (refreshToken !== storedRefreshToken) {
      return res.status(403).send({ message: "Forbidden" });
    }
    const accessToken = jwt.sign(
      { userId },
      process.env.ACCESS_JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.status(200).json({ message: "Tokens refreshed successfully" });
  } catch (error) {
    console.log("Error in refresh token controller: ", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password -__v");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getProfile controller: ", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
export { signup, login, logout, refreshToken, getProfile };
