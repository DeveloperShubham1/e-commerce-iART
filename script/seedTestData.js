// scripts/seedTestData.js — use the REAL merchant id you already have
import mongoose from "mongoose";
const REAL_MERCHANT_ID = new mongoose.Types.ObjectId("692fed35349bf45ff71a3c7b");

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Use an existing real product under this merchant, or create a dummy one
  const productResult = await db.collection("products").findOneAndUpdate(
    { sku: "test-suit-dummy-1" },
    {
      $set: {
        merchantId: REAL_MERCHANT_ID,
        name: "Test Suit",
        sku: "test-suit-dummy-1",
        brand: "TestBrand",
        description: "Dummy product for IG DM testing",
        isActive: true,
        isSeprate: false,
        variants: [
          {
            color: "Black",
            colorCode: "#000000",
            images: ["https://example.com/dummy.jpg"],
            imageKeys: ["dummy/dummy.jpg"],
            sizes: [{ size: "M", stock: 10, price: 2999, offerPrice: 2499 }],
            isTrending: false,
            trendingOrder: null,
            thumbnailIndex: 0,
          },
        ],
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  const product = productResult.value || (await db.collection("products").findOne({ sku: "test-suit-dummy-1" }));
  const productId = product._id;

  const dummyMediaId = "123123123";

  await db.collection("instagramproducts").findOneAndUpdate(
    { instagram_media_id: dummyMediaId, merchantId: REAL_MERCHANT_ID },
    {
      $set: {
        instagram_media_id: dummyMediaId,
        merchantId: REAL_MERCHANT_ID,
        product_id: productId,
        product_url: `https://eshop.iarttechnologies.com/products/test-suit/${productId}`,
        title: "Test Suit",
        active: true,
        updated_at: new Date(),
      },
      $setOnInsert: { created_at: new Date() },
    },
    { upsert: true }
  );

  console.log("Real merchant ID:", REAL_MERCHANT_ID.toString());
  console.log("Product ID:", productId.toString());
  console.log("Instagram media_id mapped:", dummyMediaId);
  process.exit(0);
}