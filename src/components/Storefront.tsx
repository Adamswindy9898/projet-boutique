"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Headphones, Laptop, Lock, Mail, MapPin, MessageCircle, Minus, PackageSearch, Phone, Plus, Search, Smartphone, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { shop } from "@/config/shop";
import { cn, money, telLink, waLink } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { Logo } from "./Logo";
import { ProductImage } from "./ProductImage";
import { Modal } from "./ui";
import { QrCard } from "./QrCard";

function StockBadge({ p }: { p: Product }) {
  if (p.stock <= 0) return <span className="badge bg-rose-100 text-rose-700">Rupture</span>;
  if (p.stock <= p.minStock) return <span className="badge bg-amber-100 text-amber-700">Dernières pièces</span>;
  return null;
}

function ProductCard({ p, onOpen }: { p: Product; onOpen: (p: Product) => void }) {
  const out = p.stock <= 0;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_18px_40px_rgba(37,99,235,0.12)]"
    >
      <button onClick={() => onOpen(p)} className="relative block aspect-square overflow-hidden text-left">
        <div className={cn("h-full w-full transition duration-500 group-hover:scale-105", out && "grayscale")}>
          <ProductImage name={p.name} image={p.image} />
        </div>
        <span className="absolute left-2.5 top-2.5">
          <StockBadge p={p} />
        </span>
        <span className={cn("absolute bottom-2.5 right-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm", out ? "bg-rose-100 text-rose-700" : "bg-white/95 text-slate-700")}>
          {out ? "Stock : 0" : `Stock : ${p.stock}`}
        </span>
      </button>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">{p.category}</p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-bold text-slate-900">{p.name}</h3>
        <p className="mt-1 text-lg font-extrabold text-slate-900">{money(p.sellPrice)}</p>
        <a
          href={waLink(`Bonjour ${shop.name}, je souhaite commander : 1 × ${p.name} (${money(p.sellPrice)}).`)}
          target="_blank"
          rel="noreferrer"
          aria-disabled={out}
          className={cn(
            "btn-primary mt-3 w-full !bg-[#25D366] !px-3 !py-2 text-xs hover:!bg-[#1ebe5b]",
            out && "pointer-events-none !bg-slate-200 !text-slate-400"
          )}
        >
          <MessageCircle size={15} /> {out ? "Indisponible" : "Commander"}
        </a>
      </div>
    </motion.article>
  );
}

function ProductDetail({ p, onClose }: { p: Product; onClose: () => void }) {
  const [qty, setQty] = useState(1);
  const out = p.stock <= 0;
  const max = Math.max(1, p.stock);
  const message = `Bonjour ${shop.name}, je souhaite commander :\n${qty} × ${p.name} (${money(p.sellPrice)} l'unité)\nTotal : ${money(p.sellPrice * qty)}`;
  return (
    <div>
      <div className="mb-4 aspect-video overflow-hidden rounded-2xl">
        <ProductImage name={p.name} image={p.image} />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{p.category}</p>
          <h4 className="text-xl font-extrabold text-slate-900">{p.name}</h4>
        </div>
        <StockBadge p={p} />
      </div>
      {p.description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.description}</p>}
      <p className="mt-3 text-2xl font-extrabold text-brand-700">{money(p.sellPrice)}</p>
      <p className={cn("mt-1 text-sm font-semibold", out ? "text-rose-600" : "text-emerald-700")}>
        {out ? "Rupture de stock (0)" : `En stock : ${p.stock} unité${p.stock > 1 ? "s" : ""}`}
      </p>

      {!out && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3">
          <span className="text-sm font-semibold text-slate-600">Quantité</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="rounded-full bg-white p-2 shadow-sm ring-1 ring-slate-200 active:scale-90">
              <Minus size={16} />
            </button>
            <span className="w-8 text-center text-lg font-extrabold">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(max, q + 1))} className="rounded-full bg-white p-2 shadow-sm ring-1 ring-slate-200 active:scale-90">
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <a
          href={waLink(message)}
          target="_blank"
          rel="noreferrer"
          onClick={onClose}
          className={cn("btn-primary !bg-[#25D366] hover:!bg-[#1ebe5b]", out && "pointer-events-none !bg-slate-200 !text-slate-400")}
        >
          <MessageCircle size={18} /> Commander sur WhatsApp
        </a>
        <a href={telLink} className="btn-ghost">
          <Phone size={18} /> Appeler
        </a>
      </div>
    </div>
  );
}

export function Storefront() {
  const { db, ready } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Tous");
  const [open, setOpen] = useState<Product | null>(null);

  const categories = useMemo(() => ["Tous", ...Array.from(new Set(db.products.map((p) => p.category))).filter(Boolean)], [db.products]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.products.filter((p) => (cat === "Tous" || p.category === cat) && (!t || `${p.name} ${p.category}`.toLowerCase().includes(t)));
  }, [db.products, q, cat]);

  return (
    <div className="storefront-shell min-h-screen">
      {/* Barre de navigation */}
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 shadow-[0_4px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:py-3">
          <a href="#top" className="flex items-center gap-2.5">
            <Logo size={42} />
            <span>
              <span className="block text-base font-extrabold tracking-tight text-slate-900">{shop.name}</span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-600 sm:block">Technologie & accessoires</span>
            </span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#produits" className="hover:text-brand-700">Produits</a>
            <a href="#contact" className="hover:text-brand-700">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href={telLink} className="btn-soft !px-3 !py-2 sm:!px-4">
              <Phone size={16} /> <span className="hidden sm:inline">Appeler</span>
            </a>
            <Link href="/connexion" className="btn-ghost !px-3 !py-2" title="Espace gérant">
              <Lock size={16} /> <span className="hidden sm:inline">Espace gérant</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Héros */}
      <section id="top" className="storefront-hero relative isolate overflow-hidden">
        <div aria-hidden="true" className="hero-orb hero-orb-one" />
        <div aria-hidden="true" className="hero-orb hero-orb-two" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-10 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100 shadow-lg shadow-blue-950/10 backdrop-blur">
                <Sparkles size={14} className="text-cyan-300" /> Bienvenue chez {shop.name}
              </span>
              <h1 className="mt-6 max-w-2xl text-[2.65rem] font-black leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.25rem]">
                La technologie
                <span className="mt-1 block bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-200 bg-clip-text text-transparent">
                  à portée de main.
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-blue-100/90 sm:text-lg">{shop.tagline}</p>
              <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
                <a
                  href="#produits"
                  className="btn group !min-h-12 !justify-between !rounded-2xl !bg-white !px-5 !text-brand-800 shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:!bg-cyan-50 min-[420px]:!justify-center"
                >
                  Explorer la boutique <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href={waLink(`Bonjour ${shop.name}, j'aimerais avoir des informations.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn !min-h-12 !rounded-2xl !bg-[#20c968] !px-5 !text-white shadow-xl shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:!bg-[#18b85c]"
                >
                  <MessageCircle size={18} /> Écrivez-nous sur WhatsApp
                </a>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-blue-100/75">
                <span className="inline-flex items-center gap-2"><Smartphone size={15} className="text-cyan-300" /> Téléphones</span>
                <span className="inline-flex items-center gap-2"><Headphones size={15} className="text-cyan-300" /> Audio</span>
                <span className="inline-flex items-center gap-2"><Laptop size={15} className="text-cyan-300" /> Informatique</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.65 }}
              className="relative mx-auto w-full max-w-[25rem]"
            >
              <div aria-hidden="true" className="absolute -inset-5 rounded-[3rem] bg-cyan-300/10 blur-2xl" />
              <div className="hero-showcase relative flex aspect-[1.08/1] items-center justify-center overflow-hidden rounded-[2rem] border border-white/15 shadow-2xl shadow-blue-950/40 sm:aspect-[1.2/1]">
                <div aria-hidden="true" className="absolute inset-5 rounded-[1.5rem] border border-white/[0.08]" />
                <div aria-hidden="true" className="hero-ring absolute h-[78%] aspect-square rounded-full border border-cyan-200/15" />
                <div aria-hidden="true" className="hero-ring hero-ring-inner absolute h-[58%] aspect-square rounded-full border border-white/10" />
                <div aria-hidden="true" className="absolute h-[48%] aspect-square rounded-full bg-blue-400/20 blur-2xl" />
                <Logo size={168} className="relative z-10 !h-36 !w-36 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:!h-44 sm:!w-44" />
                <div className="absolute left-4 top-5 flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/35 px-3 py-2.5 text-white shadow-xl backdrop-blur-xl sm:left-6 sm:top-7">
                  <span className="rounded-xl bg-cyan-300/15 p-2 text-cyan-200"><Smartphone size={17} /></span>
                  <span><span className="block text-[9px] font-semibold uppercase tracking-wider text-blue-100/70">Univers</span><span className="block text-xs font-bold">Mobile & tech</span></span>
                </div>
                <div className="absolute bottom-5 right-4 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.92] px-3 py-2.5 shadow-xl sm:bottom-7 sm:right-6">
                  <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><MessageCircle size={17} /></span>
                  <span><span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-500">Contact direct</span><span className="block text-xs font-extrabold text-slate-900">WhatsApp</span></span>
                </div>
                <div aria-hidden="true" className="absolute right-[18%] top-[23%] h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_22px_5px_rgba(103,232,249,0.55)]" />
                <div aria-hidden="true" className="absolute bottom-[23%] left-[18%] h-1.5 w-1.5 rounded-full bg-blue-200 shadow-[0_0_18px_4px_rgba(147,197,253,0.5)]" />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-slate-950/50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/80 shadow-lg backdrop-blur-xl">
                {shop.name} <span className="mx-1.5 text-cyan-300">·</span> Technologie & accessoires
              </div>
            </motion.div>
          </div>

          <div className="mt-14 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3 sm:gap-5 lg:mt-16">
            {[
              { icon: Smartphone, title: "Explorez", text: "Parcourez le catalogue de la boutique." },
              { icon: Sparkles, title: "Trouvez", text: "Découvrez les produits qui vous intéressent." },
              { icon: MessageCircle, title: "Échangez", text: "Contactez-nous pour votre commande." },
            ].map((item, index) => (
              <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5 backdrop-blur-sm sm:border-transparent sm:bg-transparent sm:p-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-200/10 text-cyan-200">
                  <item.icon size={17} />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200/80">0{index + 1} · {item.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-blue-100/70">{item.text}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <svg aria-hidden="true" className="absolute bottom-0 left-0 w-full text-[#f8fbff]" viewBox="0 0 1440 60" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,30 C360,70 1080,-10 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* Catalogue */}
      <section id="produits" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 pt-10 sm:pt-14">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">La sélection OUSMATECH</span>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Trouvez votre prochain coup de cœur</h2>
            <p className="mt-1.5 text-sm text-slate-500">Téléphones, audio, informatique et accessoires : découvrez notre catalogue.</p>
          </div>
          <div className="relative w-full md:w-80 md:shrink-0">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un appareil…" className="input !pl-10" />
          </div>
        </div>

        <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                cat === c ? "bg-brand-600 text-white shadow-md" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-brand-50"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {!ready ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card h-64 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <PackageSearch size={36} className="mb-3 text-slate-300" />
            <p className="font-bold text-slate-700">Aucun produit trouvé</p>
            <p className="text-sm text-slate-500">Essayez un autre mot-clé ou une autre catégorie.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence>
              {list.map((p) => (
                <ProductCard key={p.id} p={p} onOpen={setOpen} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* Contact + QR */}
      <section id="contact" className="scroll-mt-20 border-y border-blue-100/70 bg-gradient-to-br from-white via-white to-blue-50/70 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Nous contacter</h2>
            <p className="mt-1 text-slate-500">Une question ? Une commande ? {shop.manager} vous répond.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Phone, label: "Téléphone", value: shop.phone, href: telLink },
                { icon: Phone, label: "Téléphone 2", value: shop.secondaryPhone, href: `tel:${shop.secondaryPhone.replace(/[^\d+]/g, "")}` },
                { icon: MessageCircle, label: "WhatsApp", value: shop.phone, href: waLink(`Bonjour ${shop.name} !`) },
                { icon: MessageCircle, label: "WhatsApp 2", value: shop.secondaryPhone, href: waLink(`Bonjour ${shop.name} !`, shop.secondaryWhatsapp) },
                { icon: Mail, label: "Email", value: shop.email, href: `mailto:${shop.email}` },
                { icon: MapPin, label: "Adresse", value: shop.address },
                { icon: Clock, label: "Horaires", value: shop.hours },
              ].filter((c) => c.value).map((c) => {
                const body = (
                  <>
                    <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                      <c.icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{c.label}</span>
                      <span className="block truncate text-sm font-bold text-slate-800">{c.value}</span>
                    </span>
                  </>
                );
                return c.href ? (
                  <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="card flex items-center gap-3 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md">
                    {body}
                  </a>
                ) : (
                  <div key={c.label} className="card flex items-center gap-3 p-3.5">
                    {body}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-brand-50 to-white p-6 ring-1 ring-brand-100">
            <QrCard />
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} {shop.name} — Tous droits réservés
      </footer>

      {/* Bouton WhatsApp flottant */}
      <a
        href={waLink(`Bonjour ${shop.name} !`)}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="no-print fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition hover:scale-110"
      >
        <MessageCircle size={26} />
      </a>

      <Modal open={!!open} onClose={() => setOpen(null)} title="Détail du produit">
        {open && <ProductDetail key={open.id} p={open} onClose={() => setOpen(null)} />}
      </Modal>
    </div>
  );
}
