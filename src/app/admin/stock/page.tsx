"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownUp, Boxes, PackageMinus, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { cn, money, moveLabels } from "@/lib/utils";
import { Loading, Modal, PageHeader, StatCard, useToast } from "@/components/ui";
import { ProductImage } from "@/components/ProductImage";

type MoveKind = "entree" | "sortie" | "perte" | "ajustement";

function MoveForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const { moveStock } = useStore();
  const toast = useToast();
  const [type, setType] = useState<MoveKind>("entree");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(qty);
    if (!n || (type !== "ajustement" && n < 0)) return setErr("Indiquez une quantité valide.");
    const delta = type === "entree" ? Math.abs(n) : type === "ajustement" ? n : -Math.abs(n);
    if (product.stock + delta < 0) return setErr(`Stock insuffisant : il reste ${product.stock} unité(s).`);
    moveStock(product.id, type, delta, note.trim() || moveLabels[type]);
    toast("Mouvement de stock enregistré");
    onDone();
  };

  const kinds: { k: MoveKind; label: string }[] = [
    { k: "entree", label: "Entrée" },
    { k: "sortie", label: "Sortie" },
    { k: "perte", label: "Perte" },
    { k: "ajustement", label: "Ajustement" },
  ];

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
        <div className="h-12 w-12 overflow-hidden rounded-xl">
          <ProductImage name={product.name} image={product.image} />
        </div>
        <div>
          <p className="font-bold text-slate-900">{product.name}</p>
          <p className="text-xs text-slate-500">Stock actuel : {product.stock}</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-slate-100 p-1">
        {kinds.map((x) => (
          <button key={x.k} type="button" onClick={() => setType(x.k)} className={cn("rounded-xl py-2 text-xs font-semibold transition", type === x.k ? "bg-white text-brand-700 shadow" : "text-slate-500")}>
            {x.label}
          </button>
        ))}
      </div>
      <div>
        <label className="label">{type === "ajustement" ? "Variation (ex : +3 ou -2)" : "Quantité"}</label>
        <input className="input" type="number" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
      </div>
      <div>
        <label className="label">Note (facultatif)</label>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : livraison fournisseur, produit périmé…" />
      </div>
      {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{err}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="btn-ghost">
          Annuler
        </button>
        <button type="submit" className="btn-primary">
          Enregistrer
        </button>
      </div>
    </form>
  );
}

export default function StockPage() {
  const { db, ready } = useStore();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [moving, setMoving] = useState<Product | null>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.products.filter((p) => !t || `${p.name} ${p.category}`.toLowerCase().includes(t));
  }, [db.products, q]);

  const stockValue = db.products.reduce((s, p) => s + p.stock * p.buyPrice, 0);
  const low = db.products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const out = db.products.filter((p) => p.stock <= 0).length;

  if (!ready) return <Loading />;

  return (
    <div>
      <PageHeader title="Gestion du stock" subtitle="Suivez vos niveaux de stock, entrées, sorties et pertes." />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard label="Valeur du stock" value={money(stockValue)} icon={Boxes} />
        <StatCard label="Stock bas" value={String(low)} icon={AlertTriangle} tone="bg-amber-50 text-amber-600" />
        <StatCard label="En rupture" value={String(out)} icon={PackageMinus} tone="bg-rose-50 text-rose-600" />
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input !pl-10" placeholder="Rechercher un produit…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card divide-y divide-slate-100">
        {list.length === 0 && <p className="p-8 text-center text-sm text-slate-400">Aucun produit.</p>}
        {list.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
              <ProductImage name={p.name} image={p.image} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-slate-900">{p.name}</p>
              <p className="text-xs text-slate-400">
                Seuil {p.minStock} · valeur {money(p.stock * p.buyPrice)}
              </p>
            </div>
            <span className={cn("badge", p.stock <= 0 ? "bg-rose-100 text-rose-700" : p.stock <= p.minStock ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
              {p.stock <= 0 ? "Rupture" : p.stock}
            </span>
            <button onClick={() => setMoving(p)} className="btn-soft !px-3 !py-2" aria-label="Mouvement de stock">
              <ArrowDownUp size={15} /> <span className="hidden sm:inline">Mouvement</span>
            </button>
          </div>
        ))}
      </div>

      <Modal open={!!moving} onClose={() => setMoving(null)} title="Mouvement de stock">
        {moving && <MoveForm key={moving.id} product={moving} onDone={() => setMoving(null)} />}
      </Modal>
    </div>
  );
}
