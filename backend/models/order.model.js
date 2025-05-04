import mongoose from "mongoose";
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        quantity: {
          type: Number,
          min: [1, "Quantity must be at least 1"],
          required: [true, "Quantity is required"],
        },
        price: {
          type: Number,
          min: [0, "Price must be a positive number"],
          required: [true, "Price is required"],
        },
      },
    ],
    totalAmount: {
      type: Number,
      min: [0, "Total amount must be a positive number"],
      required: [true, "Total amount is required"],
    },
    stripeSessionId: {
      type: String,
      required: [true, "Stripe session ID is required"],
    },
  },
  {
    timestamps: true,
  }
);
const Order = mongoose.model("Order", orderSchema);
export default Order;