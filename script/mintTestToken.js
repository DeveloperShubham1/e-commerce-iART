// scripts/mintTestToken.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { createIgAuthToken } from "../services/authTokenService.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const token = await createIgAuthToken({
    merchantId: "692fed35349bf45ff71a3c7b",
    igsid: "232323232",
    username: "test",
    commentId: "manual-test-1",
    productId: "6a4e4dd1a8035217851f1b44",
  });

  console.log("TOKEN:", token);
  process.exit(0);
}

run();