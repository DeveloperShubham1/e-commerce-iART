import axios from "axios";

// ---------------------------------------------------------------------------
// Uploads a single payment-screenshot file to your S3 endpoint and returns
// the public URL (not the presigned PUT signedUrl — that's only for upload).
// ---------------------------------------------------------------------------
export const uploadSingleFile = async (file) => {
  const formData = new FormData();
  formData.append("images", file); // matches your /api/s3/upload field name
  const { data } = await axios.post("/api/s3/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (!data.success) throw new Error(data.message || "Upload failed");
  const uploaded = data.files?.[0];
  if (!uploaded?.url) throw new Error("Upload succeeded but no URL returned");
  return uploaded.url;
};