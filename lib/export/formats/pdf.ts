import { CATEGORIES } from "../../types";
import { formatCurrency, formatDate } from "../../format";
import type { ExportContext, ExportFormat, FormatSettings } from "../types";

// Matches the app's brand-600 and slate scale so the report looks like it came from the same product.
const BRAND: [number, number, number] = [79, 70, 229];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const RULE: [number, number, number] = [226, 232, 240];
const ZEBRA: [number, number, number] = [248, 250, 252];
const MARGIN = 48;
const TOTAL_PAGES = "{total_pages}";

/**
 * jsPDF's built-in Helvetica only covers WinAnsi (Latin-1 plus a few typographic marks). Anything else,
 * such as emoji or CJK, would print as garbage, so it becomes "?" instead.
 */
export function toPdfText(value: string): string {
  return value.replace(/[^\u0000-ÿ–—‘’“”•…€]/gu, "?");
}

function describeScope({ scope }: ExportContext): { range: string; categories: string } {
  const { startDate, endDate } = scope;
  const range =
    startDate && endDate
      ? `${formatDate(startDate)} – ${formatDate(endDate)}`
      : startDate
        ? `From ${formatDate(startDate)}`
        : endDate
          ? `Through ${formatDate(endDate)}`
          : "All dates";
  const categories =
    scope.categories.length === CATEGORIES.length ? "All categories" : scope.categories.join(", ");
  return { range, categories };
}

async function buildPdf(context: ExportContext, settings: FormatSettings["pdf"]): Promise<Blob> {
  // Loaded on demand: ~350 kB that only PDF exports need.
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const { selection, generatedAt } = context;
  const doc = new jsPDF({ orientation: settings.orientation, unit: "pt", format: "letter", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { range, categories } = describeScope(context);
  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setProperties({ title: "Expense report", subject: range, creator: "Expense Tracker" });

  // Header
  doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(...INK);
  doc.text("Expense report", MARGIN, MARGIN + 8);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...MUTED);
  doc.text(toPdfText(range), MARGIN, MARGIN + 28);
  doc.text(toPdfText(categories), MARGIN, MARGIN + 42, { maxWidth: pageWidth - MARGIN * 2 - 160 });
  doc.text(`Generated ${generatedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`, pageWidth - MARGIN, MARGIN + 8, {
    align: "right",
  });
  doc.setDrawColor(...BRAND).setLineWidth(2).line(MARGIN, MARGIN + 56, pageWidth - MARGIN, MARGIN + 56);

  // Key figures
  const count = selection.records.length;
  const figures: [string, string][] = [
    ["Records", count.toLocaleString("en-US")],
    ["Total", formatCurrency(selection.total)],
    ["Average", formatCurrency(count ? selection.total / count : 0)],
    [
      "Date span",
      selection.firstDate && selection.lastDate
        ? `${formatDate(selection.firstDate)} – ${formatDate(selection.lastDate)}`
        : "—",
    ],
  ];
  const columnWidth = (pageWidth - MARGIN * 2) / figures.length;
  figures.forEach(([label, value], i) => {
    const x = MARGIN + i * columnWidth;
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...MUTED).text(label.toUpperCase(), x, MARGIN + 80);
    doc.setFont("helvetica", "bold").setFontSize(i === 3 ? 10 : 14).setTextColor(...INK).text(value, x, MARGIN + 98);
  });

  const footer = () => {
    const page = doc.getNumberOfPages();
    doc.setDrawColor(...RULE).setLineWidth(0.5).line(MARGIN, pageHeight - 36, pageWidth - MARGIN, pageHeight - 36);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED);
    doc.text("Expense Tracker · exported from this browser's local data", MARGIN, pageHeight - 22);
    doc.text(`Page ${page} of ${TOTAL_PAGES}`, pageWidth - MARGIN, pageHeight - 22, { align: "right" });
  };

  const tableTheme = {
    margin: { left: MARGIN, right: MARGIN, bottom: 56, top: MARGIN },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6, textColor: INK, lineColor: RULE, lineWidth: 0 },
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255] as [number, number, number], fontStyle: "bold" as const },
    footStyles: { fillColor: [241, 245, 249] as [number, number, number], textColor: INK, fontStyle: "bold" as const },
    alternateRowStyles: { fillColor: ZEBRA },
    didDrawPage: footer,
  };

  let y = MARGIN + 124;

  if (settings.includeBreakdown && selection.byCategory.length > 0) {
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK).text("By category", MARGIN, y);
    autoTable(doc, {
      ...tableTheme,
      startY: y + 8,
      head: [["Category", "Records", "Amount", "Share"]],
      body: selection.byCategory.map((c) => [c.category, String(c.count), formatCurrency(c.total), `${c.percent.toFixed(1)}%`]),
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
      tableWidth: Math.min(360, pageWidth - MARGIN * 2),
    });
    y = lastY() + 28;
  }

  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK).text("Transactions", MARGIN, y);
  autoTable(doc, {
    ...tableTheme,
    startY: y + 8,
    head: [["Date", "Description", "Category", "Amount"]],
    body: selection.records.map((e) => [formatDate(e.date), toPdfText(e.description), e.category, formatCurrency(e.amount)]),
    foot: [["", `${count.toLocaleString("en-US")} record${count === 1 ? "" : "s"}`, "Total", formatCurrency(selection.total)]],
    columnStyles: { 0: { cellWidth: 80 }, 2: { cellWidth: 100 }, 3: { halign: "right", cellWidth: 80 } },
    showFoot: "lastPage",
  });

  doc.putTotalPages(TOTAL_PAGES);
  return doc.output("blob");
}

export const pdfFormat: ExportFormat<"pdf"> = {
  id: "pdf",
  label: "PDF",
  extension: "pdf",
  mimeType: "application/pdf",
  description: "A formatted report with totals, ready to print or share",
  build: buildPdf,
};
