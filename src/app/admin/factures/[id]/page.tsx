"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Download, FileCheck2, Printer, Share2, Trash2 } from "lucide-react";
import { shop } from "@/config/shop";
import { useStore } from "@/lib/store";
import { cn, fmtDate, invoiceTotals, money, statusMeta } from "@/lib/utils";
import { createInvoicePdf, downloadInvoicePdf } from "@/lib/invoice-pdf";
import { Loading, Modal, useToast } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { QrMini } from "@/components/QrCard";

export default function FactureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { db, ready, convertQuote, deleteInvoice } = useStore();
  const [delOpen, setDelOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!ready) return <Loading />;
  const inv = db.invoices.find((i) => i.id === id);
  if (!inv)
    return (
      <div className="py-16 text-center">
        <p className="font-bold text-slate-700">Document introuvable</p>
        <Link href="/admin/factures" className="btn-primary mt-4">
          Retour aux factures
        </Link>
      </div>
    );

  const t = invoiceTotals(inv);
  const isQuote = inv.type === "devis";
  const title = isQuote ? "DEVIS" : "FACTURE";

  const share = async () => {
    setSharing(true);
    try {
      const file = await createInvoicePdf(inv, window.location.origin);
      const shareData: ShareData = {
        files: [file],
        title: `${title} ${inv.number}`,
        text: `${title} ${inv.number} — ${money(t.total)}`,
      };

      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share(shareData);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          throw error;
        }
      }

      downloadInvoicePdf(file);
      toast("PDF téléchargé. Vous pouvez maintenant le joindre à votre message.", "info");
    } catch (error) {
      console.error("Impossible de préparer le PDF de la facture.", error);
      toast("Impossible de créer ou partager le PDF. Réessayez.", "error");
    } finally {
      setSharing(false);
    }
  };

  const downloadPdf = async () => {
    try {
      downloadInvoicePdf(await createInvoicePdf(inv, window.location.origin));
      toast("PDF téléchargé");
    } catch (error) {
      console.error("Impossible de créer le PDF de la facture.", error);
      toast("Impossible de créer le PDF. Réessayez.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/factures" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700">
          <ArrowLeft size={15} /> Retour
        </Link>
        <span className={cn("badge", statusMeta[t.status].cls)}>{statusMeta[t.status].label}</span>
      </div>

      <div className="no-print mb-4 flex flex-wrap gap-2">
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={16} /> Imprimer / PDF
        </button>
        <button onClick={downloadPdf} className="btn-ghost">
          <Download size={16} /> Télécharger PDF
        </button>
        <button onClick={share} disabled={sharing} className="btn-ghost">
          <Share2 size={16} /> {sharing ? "Préparation du PDF…" : "Partager le PDF"}
        </button>
        {isQuote ? (
          <button
            onClick={() => {
              const short = inv.items.find((i) => (db.products.find((p) => p.id === i.productId)?.stock ?? 0) < i.qty);
              if (short) return toast(`Stock insuffisant pour « ${short.name} »`, "error");
              convertQuote(inv.id);
              toast("Devis transformé en facture");
            }}
            className="btn-soft"
          >
            <FileCheck2 size={16} /> Transformer en facture
          </button>
        ) : null}
        <button onClick={() => setDelOpen(true)} className="btn-ghost !text-rose-600">
          <Trash2 size={16} />
        </button>
      </div>
      <p className="no-print mb-4 text-xs text-slate-400">Le partage envoie le PDF de la facture. Si le partage de fichiers n&apos;est pas pris en charge, téléchargez-le puis joignez-le à votre message.</p>

      {/* Document imprimable */}
      <div className="print-area card overflow-hidden p-6 sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={64} />
            <div>
              <p className="text-lg font-extrabold text-slate-900">{shop.name}</p>
              {shop.address && <p className="text-xs text-slate-500">{shop.address}</p>}
              {shop.activity && <p className="max-w-sm text-xs text-slate-500">{shop.activity}</p>}
              <p className="text-xs text-slate-500">{[shop.phone, shop.secondaryPhone, shop.email].filter(Boolean).join(" · ")}</p>
              {(shop.ninea || shop.rccm) && (
                <p className="text-xs text-slate-500">
                  {[shop.ninea && `NINEA : ${shop.ninea}`, shop.rccm && `RCCM : ${shop.rccm}`].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tracking-tight text-brand-700">{title}</p>
            <p className="text-sm font-bold text-slate-800">{inv.number}</p>
            <p className="text-xs text-slate-500">{fmtDate(inv.date)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Client</p>
          <p className="font-bold text-slate-900">{inv.customerName}</p>
          {inv.customerPhone && <p className="text-slate-500">{inv.customerPhone}</p>}
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2">Désignation</th>
              <th className="py-2 text-center">Qté</th>
              <th className="py-2 text-right">P.U.</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((i, k) => (
              <tr key={k} className="border-b border-slate-100">
                <td className="py-2.5 font-semibold text-slate-800">{i.name}</td>
                <td className="py-2.5 text-center">{i.qty}</td>
                <td className="py-2.5 text-right">{money(i.price)}</td>
                <td className="py-2.5 text-right font-semibold">{money(i.qty * i.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-extrabold text-slate-900">
            <span>Total à payer</span>
            <span>{money(t.total)}</span>
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            Merci pour votre confiance !<br />
            {isQuote ? "Devis valable 30 jours." : "Les marchandises vendues ne sont ni reprises ni échangées."}
          </p>
          <div className="text-center">
            <QrMini size={64} />
            <p className="text-[10px] text-slate-400">Notre boutique en ligne</p>
          </div>
        </div>
      </div>

      <Modal open={delOpen} onClose={() => setDelOpen(false)} title="Supprimer ce document ?">
        <p className="text-sm text-slate-600">
          {isQuote ? "Le devis sera supprimé." : "La facture sera supprimée et les produits vendus seront remis en stock."}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setDelOpen(false)} className="btn-ghost">
            Annuler
          </button>
          <button
            onClick={() => {
              deleteInvoice(inv.id);
              toast("Document supprimé", "info");
              router.push("/admin/factures");
            }}
            className="btn-danger"
          >
            Supprimer
          </button>
        </div>
      </Modal>
    </div>
  );
}
