import express from "express";
import {
  createManager,
  updateManager,
  listManagers,
  managerLogin,
  isManagerAuth,
  managerLogout,
} from "./managerController.js";
// import { requirePermission } from '../middleware/auth.js'; // uncomment once auth is wired up
import authMerchant from "../../middlewares/merchantAuth.js";
import { managerAuth } from "./managerauth.js";

const router = express.Router();

router.post("/login", managerLogin);
router.get("/is-auth", managerAuth, isManagerAuth);
router.post("/logout", managerAuth, managerLogout);

router.post("/", authMerchant, createManager);
router.put("/:id", authMerchant, updateManager);
router.get("/", authMerchant, listManagers);

export default router;
