import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import connectToMongoDb from "./config/connectToMongoDB.js";
import cors from "cors";
import cookieParser from "cookie-parser";

import redis from "./config/connectToRedis.js"; // Import Redis client

dotenv.config();
const port = process.env.PORT;
const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);

app.get("/", async (req, res) => {
  try {
    await redis.set("message", "Hello from Redis!");
    await redis.set("message2", "Hello from Redis2!");
    const message = await redis.get("message");
    res.send(`Redis says: ${message}`);
  } catch (error) {
    console.error("❌ Redis Error:", error);
    res.status(500).send("Error connecting to Redis");
  }
});


app.listen(port, () => {
  connectToMongoDb();
  console.log(`Server is running on ${port}`);
  console.log(`MongoDB connection is established`);
});
