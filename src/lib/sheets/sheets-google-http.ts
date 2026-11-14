import { getAccessToken } from "./googleAuth";
import { SheetsError } from "./types";

const DEFAULT_TIMEOUT_MS = 15_000;

type SheetsApiErrorBody = {
  error?: { message?: string };
};

export function getTimeoutMs(): number {
  const raw = Number(process.env.GOOGLE_SHEETS_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();

    if (
      controller.signal.aborted ||
      lower.includes("abort") ||
      lower.includes("timeout")
    ) {
      throw new SheetsError("Google Sheets request timed out", 504, "TIMEOUT");
    }

    throw new SheetsError(
      "Network failure while contacting Google Sheets",
      502,
      "NETWORK_FAILURE",
    );
  } finally {
    clearTimeout(timer);
  }
}

export function mapHttpError(status: number, message: string): SheetsError {
  const lower = message.toLowerCase();

  if (status === 404 || lower.includes("requested entity was not found")) {
    return new SheetsError(
      "The configured Google Sheet is invalid or inaccessible",
      404,
      "INVALID_SHEET",
    );
  }

  if (
    lower.includes("unable to parse range") ||
    lower.includes("unable to parse the range") ||
    lower.includes("parse range")
  ) {
    return new SheetsError(
      "The configured sheet tab was not found in the workbook",
      404,
      "MISSING_SHEET",
    );
  }

  if (status === 401 || status === 403) {
    return new SheetsError(
      "Google service account credentials are missing or invalid",
      500,
      "MISSING_CREDENTIALS",
    );
  }

  return new SheetsError(
    "Failed to fetch data from Google Sheets",
    502,
    "GOOGLE_API_FAILURE",
  );
}

export async function sheetsApiGet<T>(url: URL, fields?: string): Promise<T> {
  if (fields) url.searchParams.set("fields", fields);
  const accessToken = await getAccessToken();
  const response = await fetchWithTimeout(
    url.toString(),
    { headers: { Authorization: `Bearer ${accessToken}` } },
    getTimeoutMs(),
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as SheetsApiErrorBody | null;
    throw mapHttpError(response.status, body?.error?.message || response.statusText);
  }
  return (await response.json()) as T;
}