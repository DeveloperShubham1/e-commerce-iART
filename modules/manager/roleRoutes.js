import express from "express";
import { createRole, updateRole, listRoles } from "./roleController.js";
import authMerchant from "../../middlewares/merchantAuth.js";

const router = express.Router();

router.post("/", authMerchant, createRole);
router.put("/:id", authMerchant, updateRole);
router.get("/", authMerchant, listRoles);

export default router;
