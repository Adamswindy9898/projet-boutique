"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, CalendarDays, ClipboardCheck, PackageMinus, PackagePlus, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, fmtDateTime, money } from "@/lib/utils";
import { Loading, PageHeader, useToast } from "@/components/ui";

type InventoryPeriod = "week" | "month";

export default function InventairePage() {
  const { db, ready, applyInventory } = useStore();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [inventoryPeriod, setInventoryPeriod] = useState<InventoryPeriod>("month");

  const products = useMemo(() => {
    const term = query.trim().toLowerCase();
    return db.products.filter((product) => !term || `${product.name} ${product.category}`.toLowerCase().includes(term));
  }, [db.products, query]);

  const counted = db.products.filter((product) => counts[product.id] !== undefined && counts[product.id] !== "");
  const gapValue = counted.reduce((sum, product) => sum + (Number(counts[product.id]) - product.stock) * product.buyPrice, 0);

  const inventoryMovements = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;
    if (inventoryPeriod === "week") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    return db.movements.filter((movement) => {
      if (movement.type !== "inventaire") return false;
      const date = new Date(movement.date);
      return !Number.isNaN(date.getTime()) && date >= start && date < end;
    });
  }, [db.movements, inventoryPeriod]);

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

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-slate-900">Historique des inventaires</h2>
            <p className="mt-0.5 text-xs text-slate-500">Ajustements réalisés pendant les inventaires validés.</p>
          </div>
          <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-100">
            {([
              ["week", "Cette semaine"],
              ["month", "Ce mois-ci"],
            ] as const).map(([period, label]) => (
              <button
                key={period}
                type="button"
                onClick={() => setInventoryPeriod(period)}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-bold transition",
                  inventoryPeriod === period ? "bg-brand-600 text-white shadow" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card divide-y divide-slate-100">
          {inventoryMovements.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">
              Aucun ajustement d&apos;inventaire pour {inventoryPeriod === "week" ? "cette semaine" : "ce mois"}.
            </p>
          ) : (
            inventoryMovements.slice(0, 150).map((movement) => (
              <div key={movement.id} className="flex items-center gap-3 p-3">
                <span className={cn("rounded-xl p-2", movement.delta >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                  {movement.delta >= 0 ? <PackagePlus size={16} /> : <PackageMinus size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{movement.productName}</p>
                  <p className="truncate text-xs text-slate-400">{movement.note}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-extrabold", movement.delta >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                  </p>
                  <p className="flex items-center justify-end gap-1 text-[11px] text-slate-400">
                    <CalendarDays size={11} /> {fmtDateTime(movement.date)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
