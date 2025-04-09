import redis from "../config/redis.js";
import Product from "../models/product.model.js";
import cloudinary from "../config/cloudinary.js";
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    if (!products) {
      return res.status(404).json({ message: "No products found" });
    }
    res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
    }
    //if not found in redis, get from mongoDB
    //.lean() is used to convert the Mongoose document to a plain JavaScript object
    //which is good for performance when you don't need Mongoose features
    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts) {
      return res
        .status(404)
        .json({ message: "No featured featuredProducts found" });
    }
    //set the data in redis for 1 hour
    await redis.set(
      "featured_products",
      JSON.stringify(featuredProducts),
      "EX",
      3600
    );
    res.json(featuredProducts);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
const createProduct = async (req, res) => {
  try {
    const { name, price, description, image, catagory } = req.body;
    let cloudinaryResponse = null;
    if (image) {
      try {
        cloudinaryResponse = await cloudinary.uploader.upload(image, {
          folder: "products",
        });
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Error uploading image", error });
      }
    }
    const product = await Product.create({
      name,
      price,
      description,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse?.secure_url
        : "",
      catagory,
    });
    res.status(201).json(product);
  } catch (error) {
    console.log("Error creating product: ", error.message);
    res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    //delete the image from cloudinary
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("Image deleted from cloudinary successfully");
      } catch (error) {
        console.log("Error deleting image from cloudinary: ", error.message);
        return res.status(500).json({
          message: "Error deleting image from cloudinary",
          error,
        });
      }
    }
    //delete the product from mongoDB
    await Product.findByIdAndDelete(id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error deleting product: ", error.message);
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};
const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 10 } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);
    res.json(products);
  } catch (error) {
    console.log("Error getting recommended products: ", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
const getProductsByCategory = async (req, res) => {
  const { category } = req.params;

  try {
    const products = await Product.find({ category });
    if (!products) {
      return res
        .status(404)
        .json({ message: "No products found in this category" });
    }
    res.json(products);
  } catch (error) {
    console.error("Error fetching products by category: ", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, image, category } = req.body;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    let cloudinaryResponse = null;
    if (image) {
      try {
        cloudinaryResponse = await cloudinary.uploader.upload(image, {
          folder: "products",
        });
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Error uploading image", error });
      }
    }
    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    product.image =
      cloudinaryResponse?.secure_url || product.image || undefined;
    product.category = category || product.category;
    await product.save();
    res.json(product);
  } catch (error) {
    console.log("Error updating product: ", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
const toggleFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save();
    await updateFeaturedProductsCache(); // Update the cache after toggling
    res.json(updatedProduct);
  } catch (error) {
    console.log("Error toggling featured product: ", error.message);
    return res.status(500).json({ message: "Server error", error });
  }
};
const updateFeaturedProductsCache = async () => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set(
      "featured_products",
      JSON.stringify(featuredProducts),
      "EX",
      3600
    );
  } catch (error) {
    console.error("Error updating featured products cache: ", error.message);
  }
};
export {
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  createProduct,
  deleteProduct,
  getRecommendedProducts,
  updateProduct,
  toggleFeaturedProduct,
};
