import { shop } from "@/config/shop";
import type { Invoice, MovementType } from "./types";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const money = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/[\u202f\u00a0]/g, " ") + " " + shop.currency;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export const digits = (s: string) => s.replace(/\D/g, "");

export const waLink = (text: string, to: string = shop.whatsapp) =>
  `https://wa.me/${digits(to)}?text=${encodeURIComponent(text)}`;

export const telLink = `tel:${shop.phone.replace(/[^\d+]/g, "")}`;

export const moveLabels: Record<MovementType, string> = {
  entree: "Entrée",
  sortie: "Sortie",
  perte: "Perte",
  ajustement: "Ajustement",
  vente: "Vente",
  inventaire: "Inventaire",
};

export function invoiceTotals(inv: Invoice) {
  const subtotal = inv.items.reduce((s, i) => s + i.qty * i.price, 0);
  const cost = inv.items.reduce((s, i) => s + i.qty * i.cost, 0);
  return { subtotal, cost, profit: subtotal - cost, total: subtotal, status: inv.type };
}

export const statusMeta = {
  devis: { label: "Devis", cls: "bg-sky-100 text-sky-700" },
  facture: { label: "Facture", cls: "bg-emerald-100 text-emerald-700" },
} as const;

export function fileToDataUrl(file: File, max = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide"));
      img.onload = () => {
        const ratio = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas indisponible"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// Fichier CSV avec BOM : s'ouvre directement dans Excel.
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = "\ufeff" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
