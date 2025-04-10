import Product from "../models/product.model.js";
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const user = req.user; // Assuming you have user info from middleware
    const existingItem = user.cartItem.find((item) => item.id === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cartItems.push({ id: productId, quantity });
    }
    await user.save(); // Save the updated user cart to MongoDB
    res.status(200).json(user.cartItems); // Return the updated cart items
  } catch (error) {
    console.error("Error adding to cart: ", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user; // Assuming you have user info from middleware
    if (!productId) {
      user.cartItems = []; // Clear the cart items
    } else {
      user.cartItems = user.cartItems.filter((item) => item.id !== productId); // Remove specific item from cart
    }
    await user.save(); // Save the updated user cart to MongoDB
    res.status(200).json(user.cartItems); // Return the updated cart items
  } catch (error) {
    console.error("Error removing all items from cart: ", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params; // Extract productId from request parameters
    const { quantity } = req.body; // Extract quantity from request body
    const user = req.user; // Assuming you have user info from middleware
    const existingItem = user.cartItems.find((item) => item.id === productId); // Find the existing item in the cart
    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter((item) => item.id !== productId); // Remove item if quantity is zero or less
        await user.save(); // Save the updated user cart to MongoDB
        res.status(200).json(user.cartItems); // Return the updated cart items
      } else {
        existingItem.quantity = quantity; // Update the quantity of the existing item
        await user.save(); // Save the updated user cart to MongoDB
        res.status(200).json(user.cartItems); // Return the updated cart items
      }
    } else {
      return res.status(404).json({ message: "Item not found in cart" }); // Item not found in cart
    }
  } catch (error) {
    console.error("Error updating quantity: ", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const getCartProducts = async (req, res) => {
  try {
    const products = await Product.find({ _id: { $in: req.user.cartItems } }); // Fetch all products from the database
    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find((item) => item.id === product.id); // Find the corresponding cart item
      return {
        ...product.toJSON(), // Convert product to JSON format
        quantity: item ? item.quantity : 0, // Add quantity to the product data
      };
    });
    res.status(200).json(cartItems); // Return the cart items with product details
  } catch (error) {
    console.error("Error getting cart products: ", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export { addToCart, removeAllFromCart, updateQuantity, getCartProducts };
