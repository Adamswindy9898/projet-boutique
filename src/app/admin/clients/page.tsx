"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, Pencil, Phone, Plus, Search, UserPlus, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Customer } from "@/lib/types";
import { cn, digits, fmtDate, invoiceTotals, money, statusMeta, waLink } from "@/lib/utils";
import { EmptyState, Loading, Modal, PageHeader, useToast } from "@/components/ui";

function CustomerForm({ initial, onSubmit, onCancel }: { initial?: Customer; onSubmit: (d: { name: string; phone: string; address?: string }) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [err, setErr] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return setErr("Le nom est obligatoire.");
        onSubmit({ name: name.trim(), phone: phone.trim(), address: address.trim() || undefined });
      }}
      className="space-y-4"
    >
      <div>
        <label className="label">Nom *</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div>
        <label className="label">Téléphone</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 …" />
      </div>
      <div>
        <label className="label">Adresse</label>
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{err}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Annuler
        </button>
        <button type="submit" className="btn-primary">
          Enregistrer
        </button>
      </div>
    </form>
  );
}

export default function ClientsPage() {
  const { db, ready, saveCustomer } = useStore();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.customers
      .map((c) => {
        const invs = db.invoices.filter((i) => i.customerId === c.id);
        const facts = invs.filter((i) => i.type === "facture");
        const spent = facts.reduce((s, i) => s + invoiceTotals(i).total, 0);
        return { c, invs, spent };
      })
      .filter(({ c }) => !t || `${c.name} ${c.phone}`.toLowerCase().includes(t));
  }, [db.customers, db.invoices, q]);

  const view = rows.find((r) => r.c.id === viewId);

  if (!ready) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Historique des achats de chaque client."
        actions={
          <button onClick={() => setCreating(true)} className="btn-primary">
            <UserPlus size={16} /> Ajouter un client
          </button>
        }
      />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input !pl-10" placeholder="Rechercher par nom ou téléphone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client"
          text="Les clients ajoutés lors d'une facture apparaissent ici automatiquement."
          action={
            <button onClick={() => setCreating(true)} className="btn-primary">
              <Plus size={16} /> Ajouter un client
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ c, invs, spent }) => (
            <motion.button key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} onClick={() => setViewId(c.id)} className="card flex items-center gap-3 p-4 text-left transition-shadow hover:shadow-md">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-lg font-extrabold text-white">{c.name.charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{c.name}</p>
                <p className="truncate text-xs text-slate-500">{c.phone || "Pas de téléphone"}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {invs.length} document(s) · dépensé {money(spent)}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau client">
        {creating && (
          <CustomerForm
            onSubmit={(d) => {
              saveCustomer({ ...d, phone: d.phone });
              toast("Client ajouté");
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        )}
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier le client">
        {editing && (
          <CustomerForm
            initial={editing}
            onSubmit={(d) => {
              saveCustomer(d, editing.id);
              toast("Client mis à jour");
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={!!view} onClose={() => setViewId(null)} title="Fiche client" wide>
        {view && (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-extrabold text-slate-900">{view.c.name}</p>
                {view.c.phone && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <Phone size={14} /> {view.c.phone}
                  </p>
                )}
                {view.c.address && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin size={14} /> {view.c.address}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5">
                {view.c.phone && (
                  <>
                    <a href={`tel:${view.c.phone.replace(/[^\d+]/g, "")}`} className="btn-soft !px-3" aria-label="Appeler">
                      <Phone size={16} />
                    </a>
                    <a href={waLink(`Bonjour ${view.c.name},`, digits(view.c.phone))} target="_blank" rel="noreferrer" className="btn !bg-[#25D366] !px-3 text-white" aria-label="WhatsApp">
                      <MessageCircle size={16} />
                    </a>
                  </>
                )}
                <button onClick={() => { setEditing(view.c); setViewId(null); }} className="btn-ghost !px-3" aria-label="Modifier">
                  <Pencil size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-2xl bg-brand-50 p-3">
                <p className="text-xs font-semibold text-brand-700">Total dépensé</p>
                <p className="text-lg font-extrabold text-slate-900">{money(view.spent)}</p>
              </div>
            </div>

            <p className="mb-2 mt-5 font-bold text-slate-800">Historique</p>
            {view.invs.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 py-6 text-center text-sm text-slate-400">Aucun achat pour le moment.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-100">
                {view.invs.map((i) => {
                  const t = invoiceTotals(i);
                  return (
                    <Link key={i.id} href={`/admin/factures/${i.id}`} className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{i.number}</p>
                        <p className="truncate text-xs text-slate-400">
                          {fmtDate(i.date)} · {i.items.map((x) => `${x.qty}× ${x.name}`).join(", ")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-extrabold">{money(t.total)}</p>
                        <span className={cn("badge", statusMeta[t.status].cls)}>{statusMeta[t.status].label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
