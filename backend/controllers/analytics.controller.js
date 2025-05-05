import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js"; // Import User model
// Import Product model
const getAnalyticsData = async () => {
  const totalUsers = await User.countDocuments({});
  const totalProducts = await Product.countDocuments({});
  const salesData = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);
  const { totalSales, totalRevenue } = salesData[0] || {
    totalSales: 0,
    totalRevenue: 0,
  };
  return {
    users: totalUsers,
    products: totalProducts,
    totalSales,
    totalRevenue,
  };
};
const getDailySalesData = async (startDate, endDate) => {
  try {
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date ascending
      },
    ]);
    const dateArray = getDatesInRange(startDate, endDate);
    console.log(dateArray);
    return dateArray.map((date) => {
      // const dateString = date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
      // const salesData = dailySalesData.find((data) => data._id === dateString);
      const foundData = dailySalesData.find((item) => item._id === date);
      return {
        date,
        sales: foundData ? foundData.sales : 0,
        revenue: foundData ? foundData.revenue : 0,
      };
    });

    //   return dailySalesData;
  } catch (error) {
    console.error("Error fetching daily sales data:", error);
    throw new Error("Failed to fetch daily sales data");
  }
};
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};
const fetchAnalytics = async (req, res) => {
  try {
    const analyticsData = await getAnalyticsData(); // Call the function to get analytics data
    const endDate = new Date(); // Get the current date
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Create a new date object for the start date
    const dailySalesData = await getDailySalesData(startDate, endDate); // Call the function to get daily sales data
    res.status(200).json({
      analyticsData,
      dailySalesData,
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export { getAnalyticsData, getDailySalesData, fetchAnalytics }; // Export the function for use in routes
