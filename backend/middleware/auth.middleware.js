import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No accessToken Provided" });
    }
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_JWT_SECRET);
      if (!decoded) {
        return res
          .status(401)
          .json({ message: "Unauthorized - Invalid accessToken" });
      }
      const user = await User.findById(decoded.userId).select("-password -__v");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError")
        return res
          .status(401)
          .json({ message: "Unauthorized - Invalid token" });
      throw error;
    }
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(401).json({ message: "Please authenticate" });
  }
};
const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Forbidden - Admins only" });
  }
};
export { protectRoute, adminRoute };
