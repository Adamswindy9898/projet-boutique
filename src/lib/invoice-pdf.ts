import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { shop } from "@/config/shop";
import type { Invoice } from "@/lib/types";
import { fmtDate, invoiceTotals, money } from "@/lib/utils";

const margin = 16;
const pageHeight = 297;
const bottomMargin = 20;

async function loadLogoDataUrl() {
  const response = await fetch(shop.logo);
  if (!response.ok) throw new Error(`Impossible de charger le logo (${response.status}).`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire le logo de la boutique."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Le logo de la boutique est invalide."));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

export async function createInvoicePdf(invoice: Invoice, shopUrl: string): Promise<File> {
  const [logo, qrCode] = await Promise.all([
    loadLogoDataUrl(),
    QRCode.toDataURL(shopUrl, { errorCorrectionLevel: "M", margin: 1, width: 256 }),
  ]);
  const pdf = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  const total = invoiceTotals(invoice).total;
  const isQuote = invoice.type === "devis";
  const title = isQuote ? "DEVIS" : "FACTURE";
  const columns = { quantity: 113, unitPrice: 139, total: pageWidth - margin };
  let y = 0;

  const drawTableHeader = () => {
    pdf.setFillColor(239, 246, 255);
    pdf.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text("DÉSIGNATION", margin + 3, y + 6.5);
    pdf.text("QTÉ", columns.quantity, y + 6.5, { align: "center" });
    pdf.text("P.U.", columns.unitPrice, y + 6.5, { align: "right" });
    pdf.text("TOTAL", columns.total - 3, y + 6.5, { align: "right" });
    y += 14;
  };

  const drawFirstPageHeader = () => {
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(19);
    pdf.setTextColor(15, 23, 42);
    pdf.addImage(logo, "PNG", margin, 8, 18, 18);
    pdf.text(shop.name, margin + 22, 19);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    const shopDetails = [shop.address, shop.activity, shop.phone, shop.secondaryPhone, shop.email].filter(Boolean);
    let detailY = 25;
    shopDetails.forEach((detail) => {
      const lines = pdf.splitTextToSize(detail, 83) as string[];
      pdf.text(lines, margin + 22, detailY);
      detailY += lines.length * 3.5 + 1;
    });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);
    pdf.setTextColor(37, 99, 235);
    pdf.text(title, pageWidth - margin, 17, { align: "right" });
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(invoice.number, pageWidth - margin, 24, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(fmtDate(invoice.date), pageWidth - margin, 29, { align: "right" });

    y = Math.max(42, detailY + 3);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, y, contentWidth, 21, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text("CLIENT", margin + 4, y + 6);
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(invoice.customerName, margin + 4, y + 12);
    if (invoice.customerPhone) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(invoice.customerPhone, margin + 4, y + 17);
    }

    y += 29;
    drawTableHeader();
  };

  drawFirstPageHeader();
  pdf.setFontSize(9);

  invoice.items.forEach((item) => {
    const nameLines = pdf.splitTextToSize(item.name, columns.quantity - margin - 7) as string[];
    const rowHeight = Math.max(9, nameLines.length * 4.5 + 3);
    if (y + rowHeight > pageHeight - bottomMargin) {
      pdf.addPage();
      y = margin;
      drawTableHeader();
      pdf.setFontSize(9);
    }

    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 41, 59);
    pdf.text(nameLines, margin + 3, y + 5.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(51, 65, 85);
    pdf.text(String(item.qty), columns.quantity, y + 5.5, { align: "center" });
    pdf.text(money(item.price), columns.unitPrice, y + 5.5, { align: "right" });
    pdf.setFont("helvetica", "bold");
    pdf.text(money(item.qty * item.price), columns.total - 3, y + 5.5, { align: "right" });
    y += rowHeight;
  });

  if (y + 38 > pageHeight - bottomMargin) {
    pdf.addPage();
    y = margin;
  }
  y += 8;
  pdf.setDrawColor(203, 213, 225);
  pdf.line(pageWidth - 83, y, pageWidth - margin, y);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text("TOTAL À PAYER", pageWidth - 80, y + 8);
  pdf.setTextColor(37, 99, 235);
  pdf.text(money(total), pageWidth - margin, y + 8, { align: "right" });

  y += 22;
  if (y > pageHeight - 65) {
    pdf.addPage();
    y = margin;
  }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text("Merci pour votre confiance !", margin, y, { maxWidth: 125 });
  pdf.text(
    isQuote ? "Devis valable 30 jours." : "Les marchandises vendues ne sont ni reprises ni échangées.",
    margin,
    y + 5,
    { maxWidth: 125 }
  );
  if (shop.ninea) pdf.text(`NINEA : ${shop.ninea}`, margin, y + 10, { maxWidth: 125 });
  const qrSize = 28;
  const qrX = pageWidth - margin - qrSize;
  const qrY = pageHeight - 49;
  pdf.addImage(qrCode, "PNG", qrX, qrY, qrSize, qrSize);
  pdf.setFontSize(7);
  pdf.text("Notre boutique en ligne", qrX + qrSize / 2, qrY + qrSize + 3, { align: "center" });

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`${page} / ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  const filename = `${isQuote ? "devis" : "facture"}-${invoice.number.replace(/[^\w.-]+/g, "-")}.pdf`;
  return new File([pdf.output("blob")], filename, { type: "application/pdf" });
}

export function downloadInvoicePdf(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
