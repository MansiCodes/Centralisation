type PnlLine = { label: string; amount: number | null; ratio: number | null; kind: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JDoc = any;

function fmt(n: number | null | undefined): string {
  if (n == null) return "";
  return Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtR(n: number | null | undefined): string {
  if (n == null) return "";
  return `${Number(n).toFixed(2)}%`;
}

function filterLines(lines: PnlLine[]): PnlLine[] {
  return lines.filter((r) => {
    if (r.kind === "blank") return false;
    if (r.amount == null && (r.kind === "profit" || r.kind === "tax")) return false;
    return true;
  });
}

const TEAL: [number, number, number] = [13, 148, 136];
const PEACH: [number, number, number] = [255, 235, 205];
const WHITE: [number, number, number] = [255, 255, 255];
const BORDER: [number, number, number] = [209, 213, 219];
const ROW_H = 5.5;
const HEAD_H = 6.5;
const TOTAL_H = 7;
const FONT = 7.5;

function drawSide(
  doc: JDoc,
  x: number,
  w: number,
  lines: PnlLine[],
  total: number,
  totalLabel: string,
  showRatio: boolean,
  topY: number,
): number {
  const amtW = 28;
  const ratW = showRatio ? 18 : 0;
  const labW = w - amtW - ratW;

  let y = topY;

  doc.setFillColor(...TEAL);
  doc.rect(x, y, w, HEAD_H, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(FONT);
  doc.setFont("helvetica", "bold");
  doc.text("PARTICULARS", x + 1.5, y + HEAD_H / 2 + 1);
  doc.text("AMOUNT", x + labW + amtW - 1.5, y + HEAD_H / 2 + 1, { align: "right" });
  if (showRatio) doc.text("RATIO %", x + w - 1.5, y + HEAD_H / 2 + 1, { align: "right" });
  y += HEAD_H;

  doc.setTextColor(0, 0, 0);
  for (const line of lines) {
    doc.setFillColor(...WHITE);
    doc.rect(x, y, w, ROW_H, "F");
    doc.setDrawColor(...BORDER);
    doc.line(x, y + ROW_H, x + w, y + ROW_H);

    const indent = line.kind === "item" ? 4 : 0;
    const isBold = line.kind === "header" || line.kind === "subtotal" || line.kind === "profit";
    const isTax = line.kind === "tax";

    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(FONT);
    if (isTax) doc.setTextColor(185, 28, 28);
    else doc.setTextColor(0, 0, 0);

    const label = line.kind === "header" ? line.label.toUpperCase() : line.label;
    doc.text(label, x + 1.5 + indent, y + ROW_H / 2 + 1);

    if (line.amount != null) {
      doc.text(fmt(line.amount), x + labW + amtW - 1.5, y + ROW_H / 2 + 1, { align: "right" });
    }
    if (showRatio && line.ratio != null) {
      doc.text(fmtR(line.ratio), x + w - 1.5, y + ROW_H / 2 + 1, { align: "right" });
    }
    y += ROW_H;
  }

  doc.setFillColor(...PEACH);
  doc.rect(x, y, w, TOTAL_H, "F");
  doc.setDrawColor(...BORDER);
  doc.rect(x, y, w, TOTAL_H, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT);
  doc.setTextColor(0, 0, 0);
  doc.text(totalLabel, x + 1.5, y + TOTAL_H / 2 + 1);
  doc.text(fmt(total), x + labW + amtW - 1.5, y + TOTAL_H / 2 + 1, { align: "right" });
  y += TOTAL_H;

  doc.setDrawColor(31, 41, 55);
  doc.rect(x, topY, w, y - topY, "S");

  return y;
}

export async function exportPnlAsPdf(plantId: string, from: string, to: string) {
  const params = new URLSearchParams();
  if (from.trim()) params.set("from", from.trim());
  if (to.trim()) params.set("to", to.trim());
  const qs = params.toString();
  const res = await fetch(
    `/api/plants/${plantId}/pnl${qs ? `?${qs}` : ""}`,
  );
  if (!res.ok) throw new Error("Failed to fetch P&L data");
  const json = await res.json();
  const pnl = json.pnl ?? json;

  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const mx = 8;
  const gap = 2;
  const halfW = (pageW - mx * 2 - gap) / 2;
  const showRatio = true;

  const rangeLabel =
    from.trim() || to.trim()
      ? `(${from.trim() || "…"} to ${to.trim() || "…"})`
      : "(all dates)";
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`Profit & Loss Statement  ${rangeLabel}`, mx, 12);

  const sections = [
    { block: pnl.trading },
    { block: pnl.indirect },
  ];

  let y = 16;

  for (const { block } of sections) {
    const debitLines = filterLines(block.debit ?? []);
    const creditLines = filterLines(block.credit ?? []);

    const leftY = drawSide(doc, mx, halfW, debitLines, block.total, "Debit total", showRatio, y);
    const rightY = drawSide(doc, mx + halfW + gap, halfW, creditLines, block.total, "Credit total", showRatio, y);

    y = Math.max(leftY, rightY) + 4;
  }

  doc.save(
    `PnL-${from.trim() || "all"}-to-${to.trim() || "all"}.pdf`,
  );
}

export function downloadExportBlob(blob: Blob, disposition: string, fallback: string) {
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match?.[1] ?? fallback;
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}