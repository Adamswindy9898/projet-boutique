"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { cn, fileToDataUrl, money } from "@/lib/utils";
import { EmptyState, Loading, Modal, PageHeader, useToast } from "@/components/ui";
import { ProductImage } from "@/components/ProductImage";

interface FormState {
  name: string;
  category: string;
  buyPrice: string;
  sellPrice: string;
  stock: string;
  minStock: string;
  description: string;
  image?: string;
}

const blank: FormState = { name: "", category: "", buyPrice: "", sellPrice: "", stock: "0", minStock: "5", description: "" };

function ProductForm({
  initial,
  isEdit,
  categories,
  onSubmit,
  onCancel,
}: {
  initial: FormState;
  isEdit: boolean;
  categories: string[];
  onSubmit: (f: FormState) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState<FormState>(initial);
  const [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const set = (k: keyof FormState, v: string) => setF((p) => ({ ...p, [k]: v }));

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files?.[0];
    if (!fl) return;
    try {
      const url = await fileToDataUrl(fl);
      setF((p) => ({ ...p, image: url }));
    } catch {
      setErr("Image illisible, essayez un autre fichier.");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return setErr("Le nom du produit est obligatoire.");
    if (!(Number(f.sellPrice) > 0)) return setErr("Indiquez un prix de vente valide.");
    onSubmit(f);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => file.current?.click()} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl ring-1 ring-slate-200">
          {f.image ? (
            <ProductImage name={f.name || "?"} image={f.image} />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-50 text-xs font-semibold text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600">
              <ImagePlus size={22} /> Photo
            </span>
          )}
        </button>
        <input ref={file} type="file" accept="image/*" hidden onChange={pick} />
        <div className="flex-1">
          <label className="label">Nom du produit *</label>
          <input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex : Smartphone Android 128 Go" autoFocus />
        </div>
      </div>
      <div>
        <label className="label">Catégorie</label>
        <input className="input" list="cats" value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="Ex : Téléphones, Audio, Accessoires" />
        <datalist id="cats">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Prix d&apos;achat</label>
          <input className="input" type="number" min="0" inputMode="numeric" value={f.buyPrice} onChange={(e) => set("buyPrice", e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="label">Prix de vente *</label>
          <input className="input" type="number" min="0" inputMode="numeric" value={f.sellPrice} onChange={(e) => set("sellPrice", e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="label">{isEdit ? "Stock actuel (modifiable via Stock)" : "Stock de départ"}</label>
          <input className="input disabled:bg-slate-50" type="number" min="0" inputMode="numeric" value={f.stock} disabled={isEdit} onChange={(e) => set("stock", e.target.value)} />
        </div>
        <div>
          <label className="label">Seuil d&apos;alerte</label>
          <input className="input" type="number" min="0" inputMode="numeric" value={f.minStock} onChange={(e) => set("minStock", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Description (affichée sur la vitrine)</label>
        <textarea className="input min-h-20" value={f.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{err}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Annuler
        </button>
        <button type="submit" className="btn-primary">
          {isEdit ? "Enregistrer" : "Ajouter le produit"}
        </button>
      </div>
    </form>
  );
}

export default function ProduitsPage() {
  const { db, ready, saveProduct, deleteProduct } = useStore();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Tous");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [del, setDel] = useState<Product | null>(null);

  const categories = useMemo(() => Array.from(new Set(db.products.map((p) => p.category))).filter(Boolean), [db.products]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.products.filter((p) => (cat === "Tous" || p.category === cat) && (!t || `${p.name} ${p.category}`.toLowerCase().includes(t)));
  }, [db.products, q, cat]);

  const submit = (f: FormState, id?: string) => {
    saveProduct(
      {
        name: f.name.trim(),
        category: f.category.trim() || "Divers",
        buyPrice: Number(f.buyPrice) || 0,
        sellPrice: Number(f.sellPrice) || 0,
        stock: Math.max(0, Number(f.stock) || 0),
        minStock: Math.max(0, Number(f.minStock) || 0),
        description: f.description.trim() || undefined,
        image: f.image,
      },
      id
    );
    toast(id ? "Produit mis à jour" : "Produit ajouté à la vitrine");
    setEditing(null);
    setCreating(false);
  };

  if (!ready) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Produits"
        subtitle={`${db.products.length} produit(s), visibles automatiquement sur la vitrine`}
        actions={
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus size={16} /> Ajouter un produit
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input !pl-10" placeholder="Rechercher un produit…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-52" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option>Tous</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun produit"
          text="Ajoutez votre premier produit pour remplir votre vitrine."
          action={
            <button onClick={() => setCreating(true)} className="btn-primary">
              <Plus size={16} /> Ajouter un produit
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {list.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card flex gap-3 p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                  <ProductImage name={p.name} image={p.image} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.category}</p>
                  <p className="mt-1 text-sm font-extrabold text-brand-700">{money(p.sellPrice)}</p>
                  <p className="text-xs text-slate-400">
                    Achat {money(p.buyPrice)} · marge {money(p.sellPrice - p.buyPrice)}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className={cn("badge", p.stock <= 0 ? "bg-rose-100 text-rose-700" : p.stock <= p.minStock ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                      Stock : {p.stock}
                    </span>
                    <span className="flex gap-1">
                      <button onClick={() => setEditing(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Modifier">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDel(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Supprimer">
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau produit">
        {creating && <ProductForm initial={blank} isEdit={false} categories={categories} onSubmit={(f) => submit(f)} onCancel={() => setCreating(false)} />}
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier le produit">
        {editing && (
          <ProductForm
            key={editing.id}
            initial={{
              name: editing.name,
              category: editing.category,
              buyPrice: String(editing.buyPrice),
              sellPrice: String(editing.sellPrice),
              stock: String(editing.stock),
              minStock: String(editing.minStock),
              description: editing.description ?? "",
              image: editing.image,
            }}
            isEdit
            categories={categories}
            onSubmit={(f) => submit(f, editing.id)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
      <Modal open={!!del} onClose={() => setDel(null)} title="Supprimer ce produit ?">
        <p className="text-sm text-slate-600">« {del?.name} » sera retiré de la vitrine et de la gestion. Les factures déjà créées ne sont pas modifiées.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setDel(null)} className="btn-ghost">
            Annuler
          </button>
          <button
            onClick={() => {
              if (del) deleteProduct(del.id);
              setDel(null);
              toast("Produit supprimé", "info");
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
