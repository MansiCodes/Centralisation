import {
  assertSheetStructure,
  mapHouseWirePerMeter,
  mapSheetRowsToRates,
  overlayHouseWirePerMeter,
  type SheetRow,
} from "./sheetReader";
import { SheetsError, type CableRate } from "./types";
import { getAccessToken } from "./googleAuth";
import {
  fetchWithTimeout,
  getTimeoutMs,
  mapHttpError,
  sheetsApiGet,
} from "./sheets-google-http";

const DEFAULT_SHEET_NAME = "Master List";

type SheetsApiErrorBody = {
  error?: { message?: string };
};

export function getSheetId(): string {
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
  if (!sheetId) {
    throw new SheetsError(
      "GOOGLE_SHEET_ID is not configured",
      500,
      "MISSING_SHEET_ID",
    );
  }
  return sheetId;
}

function getConfiguredSheetName(): string {
  return process.env.GOOGLE_SHEET_NAME?.trim() || DEFAULT_SHEET_NAME;
}

let resolvedSheetName: string | null = null;

export function resetResolvedSheetName() {
  resolvedSheetName = null;
}

export async function listSheetTitles(sheetId: string): Promise<string[]> {
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`);
  const data = await sheetsApiGet<{
    sheets?: Array<{ properties?: { title?: string } }>;
  }>(url, "sheets.properties.title");
  return (data.sheets || [])
    .map((sheet) => sheet?.properties?.title)
    .filter((title): title is string => Boolean(title));
}

export async function fetchSheetValues(sheetId: string, range: string): Promise<SheetRow[]> {
  const accessToken = await getAccessToken();
  const encodedRange = encodeURIComponent(range);
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}`,
  );
  url.searchParams.set("majorDimension", "ROWS");

  const response = await fetchWithTimeout(
    url.toString(),
    { headers: { Authorization: `Bearer ${accessToken}` } },
    getTimeoutMs(),
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as SheetsApiErrorBody | null;
    throw mapHttpError(response.status, body?.error?.message || response.statusText);
  }

  const data = (await response.json()) as { values?: SheetRow[] };
  return data.values || [];
}

async function resolveSheetName(sheetId: string): Promise<string> {
  if (resolvedSheetName) return resolvedSheetName;

  const configured = getConfiguredSheetName();
  const titles = await listSheetTitles(sheetId);
  if (titles.includes(configured)) {
    resolvedSheetName = configured;
    return configured;
  }

  for (const title of titles) {
    try {
      const rows = await fetchSheetValues(sheetId, `${title}!A1:Z10`);
      const hasHeader = (rows || []).some((row) => {
        const joined = (row || [])
          .map((cell) => String(cell).toLowerCase())
          .join(" ");
        return joined.includes("name of cable") || joined.includes("p=10");
      });
      if (hasHeader) {
        resolvedSheetName = title;
        return title;
      }
    } catch {
      // try next tab
    }
  }

  if (titles.length > 0) {
    resolvedSheetName = titles[0]!;
    return titles[0]!;
  }

  throw new SheetsError(
    "The configured sheet tab was not found in the workbook",
    404,
    "MISSING_SHEET",
  );
}

export async function fetchDailyRatesFromSheet(): Promise<CableRate[]> {
  const sheetId = getSheetId();

  try {
    const sheetName = await resolveSheetName(sheetId);
    const [masterRows, houseWireRows] = await Promise.all([
      fetchSheetValues(sheetId, `${sheetName}!A:Z`),
      fetchSheetValues(sheetId, "House Wire!A:AZ").catch(() => [] as SheetRow[]),
    ]);
    assertSheetStructure(masterRows);
    const rates = mapSheetRowsToRates(masterRows);
    return overlayHouseWirePerMeter(rates, mapHouseWirePerMeter(houseWireRows));
  } catch (error) {
    if (error instanceof SheetsError) throw error;
    throw new SheetsError(
      "Failed to fetch data from Google Sheets",
      502,
      "GOOGLE_API_FAILURE",
    );
  }
}