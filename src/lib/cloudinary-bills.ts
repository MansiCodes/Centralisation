import { getCloudinaryConfig } from "./cloudinary-config";

export function isCloudinaryBillUrl(url: string, cloudName?: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname !== "res.cloudinary.com") return false;
    if (cloudName && !parsed.pathname.startsWith(`/${cloudName}/`)) return false;
    return true;
  } catch {
    return false;
  }
}

function isAmazonS3Url(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const base = process.env.AWS_S3_PUBLIC_BASE_URL?.trim();
    if (base) {
      try {
        if (parsed.hostname === new URL(base).hostname) return true;
      } catch {
        /* ignore */
      }
    }
    return (
      /\.s3[.-][a-z0-9-]+\.amazonaws\.com$/i.test(parsed.hostname) ||
      /^s3[.-][a-z0-9-]+\.amazonaws\.com$/i.test(parsed.hostname)
    );
  } catch {
    return false;
  }
}

/** Accept Cloudinary or Amazon S3 bill/document URLs. */
export function isAllowedMediaUrl(url: string, cloudName?: string): boolean {
  return isCloudinaryBillUrl(url, cloudName) || isAmazonS3Url(url);
}

export function normalizeBillPhotoUrls(
  urls: string[] | undefined,
  legacyUrl?: string | null,
): { billPhotoUrls: string[]; billPhotoUrl: string | null } {
  const cloudName = getCloudinaryConfig()?.cloudName;
  const merged = [...(urls ?? [])];
  if (legacyUrl) merged.unshift(legacyUrl);
  const unique = [
    ...new Set(
      merged
        .map((u) => u.trim())
        .filter((u) => u && isAllowedMediaUrl(u, cloudName)),
    ),
  ].slice(0, 3);
  return {
    billPhotoUrls: unique,
    billPhotoUrl: unique[0] ?? null,
  };
}