import express from "express";
import {
  uploadFilesToS3,
  deleteFileFromS3,
  deleteMultipleFromS3,
  modifyFileOnS3,
} from "../controllers/s3Controller.js";
import { upload } from "../configs/multer.js";

const router = express.Router();

router.post("/upload", upload.array("images", 10), uploadFilesToS3);
router.delete("/delete", deleteFileFromS3);
router.delete("/delete-multiple", deleteMultipleFromS3);
router.put("/modify", upload.single("newFile"), modifyFileOnS3);

export default router;
