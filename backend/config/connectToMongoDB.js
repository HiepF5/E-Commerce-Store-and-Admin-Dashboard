import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const connectToMongoDb = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_DB_URI);
    console.log(`Connected to MongoDB: ${connect.connection.host}`);
  } catch (error) {
    console.log("Error: ", error.message);
    process.exit(1);
  }
};
export default connectToMongoDb;
