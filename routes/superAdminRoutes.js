
import express from "express";
import {
    login,
    register,
    getProfile,
    updateProfile,
    getDashboardData,
    createMerchant,
    getMerchantList,
    updateMerchant
} from "../controllers/superAdminController.js";

import authSuperAdmin from "../middlewares/superAdmin.js";

const superAdminRouter = express.Router();

superAdminRouter.post("/register", register);
superAdminRouter.post("/login", login);
superAdminRouter.post("/merchants", authSuperAdmin, createMerchant);

superAdminRouter.get("/profile", authSuperAdmin, getProfile);
superAdminRouter.get("/dashboard", authSuperAdmin, getDashboardData);
superAdminRouter.get("/merchants", authSuperAdmin, getMerchantList);

superAdminRouter.put("/profile", authSuperAdmin, updateProfile);
superAdminRouter.put("/merchants", authSuperAdmin, updateMerchant);

export default superAdminRouter;
