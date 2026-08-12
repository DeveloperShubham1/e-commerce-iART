
import express from "express";
import {
    login,
    register,
    getProfile,
    updateProfile,
    getDashboardData,
    getSalesSummary,
    getOrdersList,
    getCustomersList,
    getMerchantDetail,
    getMerchantsRevenue,
    getCustomerDetail,
    toggleMerchantSubscription,
    createMerchant,
    getMerchantList,
    updateMerchant,
    getAllCustomers,
    getAllOrders,
    getProductList
} from "../controllers/superAdminController.js";

import authSuperAdmin from "../middlewares/superAdmin.js";

const superAdminRouter = express.Router();

superAdminRouter.post("/register", register);
superAdminRouter.post("/login", login);
superAdminRouter.post("/merchants", authSuperAdmin, createMerchant);

superAdminRouter.get("/profile", authSuperAdmin, getProfile);
superAdminRouter.get("/dashboard", authSuperAdmin, getDashboardData);
superAdminRouter.get("/merchants", authSuperAdmin, getMerchantList);
superAdminRouter.get("/sales/summary", authSuperAdmin, getSalesSummary);
superAdminRouter.get("/orders", authSuperAdmin, getOrdersList);
superAdminRouter.get("/customers", authSuperAdmin, getCustomersList);
superAdminRouter.get("/products", authSuperAdmin, getProductList);
superAdminRouter.get("/merchants/:id", authSuperAdmin, getMerchantDetail);
superAdminRouter.get("/merchants/revenue/top", authSuperAdmin, getMerchantsRevenue);
superAdminRouter.get("/customers/:id", authSuperAdmin, getCustomerDetail);
superAdminRouter.get("/allCustomers", authSuperAdmin, getAllCustomers);
superAdminRouter.get("/allOrders", authSuperAdmin, getAllOrders);

superAdminRouter.put("/profile", authSuperAdmin, updateProfile);
superAdminRouter.put("/merchants/:id", authSuperAdmin, updateMerchant);
superAdminRouter.patch("/merchants/:id/toggle-subscription", authSuperAdmin, toggleMerchantSubscription);

export default superAdminRouter;

