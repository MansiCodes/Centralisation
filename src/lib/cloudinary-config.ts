import { createHash } from "node:crypto";

const FOLDER = "plant-pnl/bills";

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

export function signCloudinaryDeliveryUrl(params: {
  cloudName: string;
  apiSecret: string;
  resourceType?: "raw" | "image" | "video";
  version: string | number;
  publicId: string;
  format?: string | null;
}): string {
  const resourceType = params.resourceType ?? "raw";
  const publicId = params.publicId.replace(/^\//, "");
  const format = params.format?.replace(/^\./, "") || "";
  const withExt =
    format && !publicId.toLowerCase().endsWith(`.${format.toLowerCase()}`)
      ? `${publicId}.${format}`
      : publicId;
  const pathAfterSignature = `v${params.version}/${withExt}`;
  const digest = createHash("sha1")
    .update(`${pathAfterSignature}${params.apiSecret}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const signature = digest.slice(0, 8);
  return `https://res.cloudinary.com/${params.cloudName}/${resourceType}/upload/s--${signature}--/${pathAfterSignature}`;
}

export function createBillUploadSignature() {
  const config = getCloudinaryConfig();
  if (!config) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: FOLDER, timestamp };
  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder: FOLDER,
    timestamp,
    signature: signCloudinaryParams(params, config.apiSecret),
  };
}

export const MAX_BILL_PHOTOS = 3;
export { FOLDER as CLOUDINARY_BILL_FOLDER };