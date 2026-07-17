import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import sharp from "sharp";
import s3Client from "../configs/s3.js";
import { fileTypeFromBuffer } from "file-type";
import convert from "heic-convert"; // if your project uses CommonJS: const convert = require("heic-convert");
import "dotenv/config";

const bucketName = process.env.AWS_S3_BUCKET_NAME;

const generateFileName = (bytes = 16) =>
  crypto.randomBytes(bytes).toString("hex");

// export const uploadFilesToS3 = async (req, res) => {
//   try {
//     const files = req.files;
//     if (!files || files.length === 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No files uploaded" });
//     }

//     const projectFolder = "ecommerce";

//     const uploadedFiles = [];

//     for (const file of files) {
//       let fileBuffer = file.buffer;

//       // ✅ Only resize raster images
//       if (
//         file.mimetype !== "image/svg+xml" &&
//         file.mimetype.startsWith("image/")
//       ) {
//         fileBuffer = await sharp(file.buffer)
//           .resize({
//             // width: 1080,
//             // height: 1920,
//             // fit: "contain",
//             withoutEnlargement: true,
//           })
//           .toBuffer();
//       }

//       const fileName = generateFileName();
//       const key = `${projectFolder}/${fileName}`;

//       const uploadParams = {
//         Bucket: bucketName,
//         Key: key,
//         Body: fileBuffer,
//         ContentType: file.mimetype,
//       };

//       await s3Client.send(new PutObjectCommand(uploadParams));

//       const signedUrl = await getSignedUrl(
//         s3Client,
//         new PutObjectCommand(uploadParams),
//         { expiresIn: 3600 }
//       );

//       uploadedFiles.push({
//         key,
//         url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
//         signedUrl,
//       });
//     }

//     res.json({ success: true, files: uploadedFiles });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

export const uploadFilesToS3 = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const projectFolder = "ecommerce";

    const uploadedFiles = [];

    for (const file of files) {
      let fileBuffer = file.buffer;
      let mimetype = file.mimetype;
      let extension = null; // only set when we override the original extension

      // ✅ Detect real file type from bytes (mimetype from the client can lie/be missing)
      const detectedType = await fileTypeFromBuffer(fileBuffer);

      console.log("sdsdsd", detectedType);

      const isHeic =
        detectedType?.mime === "image/heic" ||
        detectedType?.mime === "image/heif" ||
        mimetype === "image/heic" ||
        mimetype === "image/heif";

      if (isHeic) {
        try {
          fileBuffer = await convert({
            buffer: fileBuffer,
            format: "JPEG",
            quality: 0.9,
          });
          mimetype = "image/jpeg";
          extension = "jpg";
        } catch (conversionError) {
          console.error("HEIC conversion error:", conversionError);
          return res.status(400).json({
            success: false,
            message: `Failed to convert HEIC/HEIF file: ${file.originalname}`,
          });
        }
      }

      // ✅ Only resize raster images (skip SVG, run after any HEIC conversion)
      if (mimetype !== "image/svg+xml" && mimetype.startsWith("image/")) {
        fileBuffer = await sharp(fileBuffer)
          .resize({
            // width: 1080,
            // height: 1920,
            // fit: "contain",
            withoutEnlargement: true,
          })
          .toBuffer();
      }

      const fileName = generateFileName();
      const key = extension
        ? `${projectFolder}/${fileName}.${extension}`
        : `${projectFolder}/${fileName}`;

      const uploadParams = {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      const signedUrl = await getSignedUrl(
        s3Client,
        new PutObjectCommand(uploadParams),
        { expiresIn: 3600 },
      );

      uploadedFiles.push({
        key,
        url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        signedUrl,
      });
    }

    res.json({ success: true, files: uploadedFiles });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFileFromS3 = async (req, res) => {
  try {
    const { key } = req.body;

    const deleteParams = {
      Bucket: bucketName,
      Key: key,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));

    res.json({ success: true, message: `File ${key} deleted successfully` });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMultipleFromS3 = async (req, res) => {
  try {
    const { keys } = req.body;
    if (!keys || keys.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No file keys provided" });
    }

    for (const key of keys) {
      const deleteParams = {
        Bucket: bucketName,
        Key: key,
      };
      await s3Client.send(new DeleteObjectCommand(deleteParams));
    }

    res.json({ success: true, message: "Files deleted successfully" });
  } catch (error) {
    console.error("Delete multiple error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const modifyFileOnS3 = async (req, res) => {
  try {
    const { oldKey } = req.body;
    const newFile = req.file;

    if (!oldKey || !newFile)
      return res
        .status(400)
        .json({ success: false, message: "Old key or new file missing" });

    // Delete old file first
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: oldKey,
      }),
    );

    // Upload new file
    const fileBuffer = await sharp(newFile.buffer)
      .resize({ height: 1920, width: 1080, fit: "contain" })
      .toBuffer();

    const newFileName = generateFileName();

    const uploadParams = {
      Bucket: bucketName,
      Key: newFileName,
      Body: fileBuffer,
      ContentType: newFile.mimetype,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    res.json({
      success: true,
      message: "File replaced successfully",
      newKey: newFileName,
      newUrl: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${newFileName}`,
    });
  } catch (error) {
    console.error("Modify error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
