import {
  getCloudinaryConfig,
  signCloudinaryDeliveryUrl,
  signCloudinaryParams,
} from "./cloudinary-config";

async function assertPdfUrlDownloadable(
  url: string,
): Promise<{ ok: true } | { ok: false; status: number; detail: string }> {
  try {
    const probe = await fetch(url, { method: "GET", redirect: "follow" });
    const contentType = (probe.headers.get("content-type") || "").toLowerCase();
    const cldError = probe.headers.get("x-cld-error");
    const looksLikePdf =
      contentType.includes("pdf") ||
      contentType.includes("octet-stream") ||
      contentType.includes("application/raw");
    if (!probe.ok || cldError || !looksLikePdf) {
      return {
        ok: false,
        status: probe.status,
        detail: cldError || contentType || "not a PDF",
      };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      detail: error instanceof Error ? error.message : "network error",
    };
  }
}

const PRICE_SHEET_FOLDER = "plant-pnl/price-sheets";

/** Upload a price-sheet PDF and return a publicly downloadable HTTPS URL for WhatsApp. */
export async function uploadPriceSheetPdf(params: {
  buffer: Buffer;
  filename: string;
}): Promise<{ url: string } | { error: string }> {
  const config = getCloudinaryConfig();
  if (!config) {
    return {
      error:
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to share PDFs.",
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const baseName = params.filename.replace(/\.pdf$/i, "");
  const publicId = `${baseName}-${timestamp}.pdf`;
  const signParams = {
    folder: PRICE_SHEET_FOLDER,
    public_id: publicId,
    timestamp,
  };
  const signature = signCloudinaryParams(signParams, config.apiSecret);

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(params.buffer)], { type: "application/pdf" }),
    params.filename,
  );
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", PRICE_SHEET_FOLDER);
  form.append("public_id", publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/raw/upload`,
    { method: "POST", body: form },
  );
  const json = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
    version?: number | string;
    error?: { message?: string };
  };

  if (!res.ok || !json.secure_url) {
    return {
      error: json.error?.message ?? "Could not upload price sheet PDF",
    };
  }

  const candidates: string[] = [json.secure_url];
  if (json.public_id != null && json.version != null) {
    candidates.push(
      signCloudinaryDeliveryUrl({
        cloudName: config.cloudName,
        apiSecret: config.apiSecret,
        resourceType: "raw",
        version: json.version,
        publicId: json.public_id,
        format: null,
      }),
    );
    if (!json.public_id.toLowerCase().endsWith(".pdf")) {
      candidates.push(
        signCloudinaryDeliveryUrl({
          cloudName: config.cloudName,
          apiSecret: config.apiSecret,
          resourceType: "raw",
          version: json.version,
          publicId: json.public_id,
          format: "pdf",
        }),
      );
    }
  }

  let url: string | null = null;
  let lastFail = "";
  for (const candidate of [...new Set(candidates)]) {
    const probe = await assertPdfUrlDownloadable(candidate);
    if (probe.ok) {
      url = candidate;
      break;
    }
    lastFail = `HTTP ${probe.status} (${probe.detail})`;
    console.warn("[cloudinary] PDF URL not downloadable", {
      candidate,
      status: probe.status,
      detail: probe.detail,
    });
  }

  if (!url) {
    return {
      error:
        `PDF uploaded but not publicly downloadable${lastFail ? ` — ${lastFail}` : ""}. ` +
        `In Cloudinary → Settings → Security, enable "Allow delivery of PDF and ZIP files", click Save, then try Share again.`,
    };
  }

  return { url };
}