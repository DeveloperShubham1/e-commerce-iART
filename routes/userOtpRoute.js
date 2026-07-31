import express from "express";

import {
    sendOtp,
    verifyOtp,
    resendOtp,
    updateProfile,
    verifyPhoneUpdate,
    resendPhoneUpdateOtp,
} from "../controllers/userOtpController.js";
import authUser from "../middlewares/authUser.js";

const userRouter = express.Router();

// otp route
userRouter.post("/send", sendOtp);
userRouter.post("/verify", verifyOtp);
userRouter.post("/resend", resendOtp);

// update profile

userRouter.patch("/profile", authUser, updateProfile);
userRouter.post("/verify-phone-update", authUser, verifyPhoneUpdate);
userRouter.post("/resend-phone-update-otp", authUser, resendPhoneUpdateOtp);


export default userRouter;
