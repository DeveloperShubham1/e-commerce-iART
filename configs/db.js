import mongoose from "mongoose";
import Product from "../models/Product.js";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database Connected")
    );
    await mongoose.connect(`${process.env.MONGODB_URI}`);
    await Product.collection.dropIndex("slug_1");
  } catch (error) {
    console.error(error.message);
  }
};

export default connectDB;
