"use client";

import { PackageMinus, PackagePlus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { MovementType } from "@/lib/types";
import { cn, fmtDateTime, moveLabels } from "@/lib/utils";
import { Loading, PageHeader } from "@/components/ui";

export default function HistoryPage() {
  const { db, ready } = useStore();

  if (!ready) return <Loading />;

  return (
    <div>
      <PageHeader title="Historique" subtitle="Retrouvez les mouvements de stock et les opérations sur vos produits." />

      <div className="card divide-y divide-slate-100">
        {db.movements.length === 0 && <p className="p-8 text-center text-sm text-slate-400">Aucun mouvement pour le moment.</p>}
        {db.movements.slice(0, 150).map((movement) => (
          <div key={movement.id} className="flex items-center gap-3 p-3">
            <span className={cn("rounded-xl p-2", movement.delta >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
              {movement.delta >= 0 ? <PackagePlus size={16} /> : <PackageMinus size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">{movement.productName}</p>
              <p className="truncate text-xs text-slate-400">
                {moveLabels[movement.type as MovementType]} · {movement.note}
              </p>
            </div>
            <div className="text-right">
              <p className={cn("text-sm font-extrabold", movement.delta >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
              </p>
              <p className="text-[11px] text-slate-400">{fmtDateTime(movement.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
