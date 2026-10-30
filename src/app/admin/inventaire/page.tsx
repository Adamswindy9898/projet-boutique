"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, ClipboardCheck, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, money } from "@/lib/utils";
import { Loading, PageHeader, useToast } from "@/components/ui";

export default function InventairePage() {
  const { db, ready, applyInventory } = useStore();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [counts, setCounts] = useState<Record<string, string>>({});

  const products = useMemo(() => {
    const term = query.trim().toLowerCase();
    return db.products.filter((product) => !term || `${product.name} ${product.category}`.toLowerCase().includes(term));
  }, [db.products, query]);

  const counted = db.products.filter((product) => counts[product.id] !== undefined && counts[product.id] !== "");
  const gapValue = counted.reduce((sum, product) => sum + (Number(counts[product.id]) - product.stock) * product.buyPrice, 0);

  const validate = () => {
    const inventory: Record<string, number> = {};
    counted.forEach((product) => {
      inventory[product.id] = Math.max(0, Math.round(Number(counts[product.id])));
    });
    applyInventory(inventory);
    setCounts({});
    toast(`Inventaire validé : ${counted.length} produit(s) mis à jour`);
  };

  if (!ready) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Inventaire"
        subtitle="Comptez les quantités physiques et comparez-les au stock enregistré."
        actions={
          <Link href="/admin/stock" className="btn-ghost">
            <ArrowLeftRight size={16} /> Gestion du stock
          </Link>
        }
      />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input !pl-10" placeholder="Rechercher un produit…" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      <div className="card divide-y divide-slate-100 overflow-x-auto">
        <div className="grid min-w-[380px] grid-cols-[1fr_72px_96px_64px] gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Produit</span>
          <span className="text-center">Système</span>
          <span className="text-center">Compté</span>
          <span className="text-center">Écart</span>
        </div>
        {products.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">Aucun produit trouvé.</p>
        ) : (
          products.map((product) => {
            const count = counts[product.id];
            const hasCount = count !== undefined && count !== "";
            const gap = hasCount ? Number(count) - product.stock : 0;
            return (
              <div key={product.id} className="grid min-w-[380px] grid-cols-[1fr_72px_96px_64px] items-center gap-2 px-3 py-2.5">
                <span className="truncate text-sm font-semibold text-slate-800">{product.name}</span>
                <span className="text-center text-sm text-slate-500">{product.stock}</span>
                <input
                  className="input !px-2 !py-1.5 text-center"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={count ?? ""}
                  onChange={(event) => setCounts((current) => ({ ...current, [product.id]: event.target.value }))}
                  placeholder="—"
                  aria-label={`Quantité comptée pour ${product.name}`}
                />
                <span className={cn("text-center text-sm font-bold", !hasCount ? "text-slate-300" : gap === 0 ? "text-emerald-600" : gap > 0 ? "text-sky-600" : "text-rose-600")}>
                  {hasCount ? (gap > 0 ? `+${gap}` : gap) : "—"}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm text-slate-600">
          <strong>{counted.length}</strong> produit(s) compté(s) · écart en valeur :{" "}
          <strong className={gapValue < 0 ? "text-rose-600" : gapValue > 0 ? "text-sky-600" : "text-emerald-600"}>{money(gapValue)}</strong>
        </p>
        <button onClick={validate} disabled={counted.length === 0} className="btn-primary">
          <ClipboardCheck size={16} /> Valider l&apos;inventaire
        </button>
      </div>
    </div>
  );
}
