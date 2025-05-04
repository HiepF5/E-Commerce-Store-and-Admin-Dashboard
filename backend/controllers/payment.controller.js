import { stripe } from "../config/stripe.js";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid products array" });
    }
    let totalAmount = 0;
    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // Convert to cents
      totalAmount += amount * product.quantity; // Calculate total amount in cents
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity,
      };
    });
    let coupon = null;
    if (couponCode) {
      try {
        coupon = await Coupon.findONe({
          code: couponCode,
          userId: req.user._id,
          isActive: true,
        });
        if (coupon) {
          const currentDate = new Date();
          if (currentDate > coupon.expirationDate) {
            return res.status(400).json({ message: "Coupon has expired" });
          }
          const discountAmount = Math.round(
            (totalAmount * coupon.discountPercentage) / 100
          );
          totalAmount -= discountAmount; // Apply discount to total amount
        }
      } catch (error) {
        console.error("Error retrieving coupon:", error);
        return res.status(400).json({ message: "Invalid coupon code" });
      }
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
        : [], // Apply coupon if available
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || null,
      },
    });
    if (totalAmount >= 20000) {
      const newCoupon = await createNewCoupon(req.user._id);
      if (newCoupon) {
        console.log("New coupon created:", newCoupon.code);
      } else {
        console.error("Failed to create new coupon");
      }
    }
    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const createStripeCoupon = async (discountPercentage) => {
  try {
    const coupon = await stripe.coupons.create({
      percent_off: discountPercentage,
      duration: "once",
    });
    return coupon.id;
  } catch (error) {
    console.error("Error creating Stripe coupon:", error);
    throw new Error("Failed to create Stripe coupon");
  }
};
const createNewCoupon = async (userId) => {
  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    userId: userId,
  });
  try {
    await newCoupon.save();
    return newCoupon;
  } catch (error) {
    console.error("Error creating new coupon:", error);
    throw new Error("Failed to create new coupon");
  }
};
const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.payment_status === "paid") {
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          { isActive: false }
        );
      }
      //create order in database
      const products = JSON.parse(session.metadata.products);
      const order = new Order({
        userId: session.metadata.userId,
        products: products.map((product) => ({
          productId: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount: session.amount_total / 100,
        paymentStatus: session.payment_status,
        stripeSessionId: sessionId,
      });
      await order.save();
      res
        .status(200)
        .json({
          success: true,
          orderId: order._id,
          message:
            "Payment successful, order created and coupon deactivated if uses",
        });
    }
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export { createCheckoutSession, checkoutSuccess };
