import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoute.js";
import userOtpRouter from "./routes/userOtpRoute.js";
import cartRouter from "./routes/cartRoute.js";
import "dotenv/config";
import addressRouter from "./routes/addressRoute.js";
import merchantRoutes from "./routes/merchantRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoute.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import s3Routes from "./routes/s3Routes.js";
import guestRouter from "./routes/GuestCartRoute.js";
import subCategoryRoutes from "./routes/subCategoryRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import adminRoutes from "./routes/instaProductRoutes.js";
import instagramRouter from "./routes/instagramRoute.js";
import superAdminRouter from "./routes/superAdminRoutes.js";
import productCollectionRouter from "./routes/collectionRoute.js";
import roleRoutes from "./modules/manager/roleRoutes.js";
import managerRoutes from "./modules/manager/managerRoutes.js";
import morgan from "morgan";

const app = express();
const port = process.env.PORT || 5000;

// app.use(morgan("common"));

await connectDB();

await import("./script/TokenRefresh.js");

app.use("/", webhookRoutes);

app.use(express.json({ limit: "100mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true); // allow EVERY domain
    },
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.send("🛍️ eCommerce API is Running Smoothly");
});

app.use("/api/merchant", merchantRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/s3", s3Routes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/otp", userOtpRouter);
app.use("/api/user", userRouter);
app.use("/api/address", addressRouter);
app.use("/api/cart", cartRouter);
app.use("/api/cart/guest", guestRouter);
app.use("/api/ig", instagramRouter);
app.use("/api", adminRoutes);
app.use("/api/superadmin", superAdminRouter);
app.use("/api/collection", productCollectionRouter);
app.use("/api/roles", roleRoutes);
app.use("/api/managers", managerRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(port, () => {
  console.log(`Server is running at: ${port}`);
});
