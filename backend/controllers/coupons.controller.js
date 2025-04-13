import Coupon from "../models/coupon.model.js";
const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.find({ userId: req.user._id, isActive: true });
    res.status(200).json(coupon || null);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
const validateCoupon = async (req, res) => {
  try {
    const code = req.body;
    const coupon = await Coupon.findOne({
      code: code,
      userId: req.user._id,
      isActive: true,
    });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(400).json({ message: "Coupon has expired" });
    }
    res
      .status(200)
      .json({
        message: "Coupon is valid",
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
      });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
export { getCoupon, validateCoupon };
