"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { InvoiceItem } from "@/lib/types";
import { cn, money, uid } from "@/lib/utils";
import { Loading, PageHeader, useToast } from "@/components/ui";

interface Line {
  key: string;
  productId: string;
  qty: string;
  price: string;
}

const newLine = (): Line => ({ key: uid(), productId: "", qty: "1", price: "" });

export default function NouvelleFacturePage() {
  const router = useRouter();
  const toast = useToast();
  const { db, ready, createInvoice, saveCustomer } = useStore();

  const [type, setType] = useState<"facture" | "devis">("facture");
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [err, setErr] = useState("");

  const subtotal = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);

  const setLine = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const stockUsed = useMemo(() => {
    const m = new Map<string, number>();
    lines.forEach((l) => l.productId && m.set(l.productId, (m.get(l.productId) ?? 0) + (Number(l.qty) || 0)));
    return m;
  }, [lines]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = lines.filter((l) => l.productId && Number(l.qty) > 0);
    if (valid.length === 0) return setErr("Ajoutez au moins un produit avec une quantité.");
    if (customerId === "new" && !name.trim()) return setErr("Indiquez le nom du nouveau client.");
    if (type === "facture") {
      for (const [pid, qty] of stockUsed) {
        const p = db.products.find((x) => x.id === pid);
        if (p && qty > p.stock) return setErr(`Stock insuffisant pour « ${p.name} » : ${p.stock} disponible(s).`);
      }
    }
    const items: InvoiceItem[] = valid.map((l) => {
      const p = db.products.find((x) => x.id === l.productId)!;
      return { productId: p.id, name: p.name, qty: Number(l.qty), price: Number(l.price) || p.sellPrice, cost: p.buyPrice };
    });

    let cid: string | undefined;
    let cname = "Client de passage";
    let cphone: string | undefined;
    if (customerId === "new") {
      cname = name.trim();
      cphone = phone.trim();
      cid = saveCustomer({ name: cname, phone: cphone });
    } else if (customerId) {
      const c = db.customers.find((x) => x.id === customerId);
      if (c) {
        cid = c.id;
        cname = c.name;
        cphone = c.phone;
      }
    }

    const id = createInvoice({
      type,
      customerId: cid,
      customerName: cname,
      customerPhone: cphone,
      items,
    });
    toast(type === "facture" ? "Facture créée" : "Devis créé");
    router.push(`/admin/factures/${id}`);
  };

  if (!ready) return <Loading />;

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl">
      <Link href="/admin/factures" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700">
        <ArrowLeft size={15} /> Retour
      </Link>
      <PageHeader title="Nouveau document" subtitle="Choisissez le client, les produits, puis enregistrez." />

      <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1">
        {(["facture", "devis"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setType(t)} className={cn("rounded-xl py-2.5 text-sm font-semibold capitalize transition", type === t ? "bg-white text-brand-700 shadow" : "text-slate-500")}>
            {t}
          </button>
        ))}
      </div>

      <div className="card mb-4 space-y-3 p-4">
        <p className="font-bold text-slate-800">Client</p>
        <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Client de passage</option>
          {db.customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.phone}
            </option>
          ))}
          <option value="new">+ Nouveau client</option>
        </select>
        {customerId === "new" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Nom *</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 …" />
            </div>
          </div>
        )}
      </div>

      <div className="card mb-4 p-4">
        <p className="mb-3 font-bold text-slate-800">Produits</p>
        <div className="space-y-3">
          {lines.map((l) => {
            const p = db.products.find((x) => x.id === l.productId);
            return (
              <div key={l.key} className="grid grid-cols-[1fr_64px_96px_36px] items-end gap-2">
                <div>
                  <label className="label">Produit</label>
                  <select
                    className="input"
                    value={l.productId}
                    onChange={(e) => {
                      const pr = db.products.find((x) => x.id === e.target.value);
                      setLine(l.key, { productId: e.target.value, price: pr ? String(pr.sellPrice) : "" });
                    }}
                  >
                    <option value="">Choisir…</option>
                    {db.products.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name} ({x.stock} en stock)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Qté</label>
                  <input className="input !px-2 text-center" type="number" min="1" inputMode="numeric" value={l.qty} onChange={(e) => setLine(l.key, { qty: e.target.value })} />
                </div>
                <div>
                  <label className="label">Prix</label>
                  <input className="input !px-2" type="number" min="0" inputMode="numeric" value={l.price} onChange={(e) => setLine(l.key, { price: e.target.value })} />
                </div>
                <button type="button" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls))} className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Retirer">
                  <Trash2 size={16} />
                </button>
                {p && <p className="col-span-4 -mt-1 text-xs text-slate-400">Sous-total : {money((Number(l.qty) || 0) * (Number(l.price) || 0))}</p>}
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => setLines((ls) => [...ls, newLine()])} className="btn-soft mt-3">
          <Plus size={16} /> Ajouter une ligne
        </button>
      </div>

      <div className="card mb-4 space-y-3 p-4">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between border-t border-slate-100 pt-3 text-lg font-extrabold text-slate-900">
            <span>Total</span>
            <span>{money(subtotal)}</span>
          </div>
        </div>
      </div>

      {err && <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{err}</p>}
      <button type="submit" className="btn-primary w-full !py-3">
        {type === "facture" ? "Créer la facture" : "Créer le devis"}
      </button>
    </form>
  );
}
