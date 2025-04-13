import mongoose from "mongoose";
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
    },
    discountPercentage: {
      type: Number,
      min: [0, "Discount percentage must be a positive number"],
      max: [100, "Discount percentage cannot exceed 100%"],
      required: [true, "Discount percentage is required"],
    },
    expirationDate: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);
const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
