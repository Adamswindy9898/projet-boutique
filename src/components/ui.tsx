"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, uid } from "@/lib/utils";

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="no-print fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className={cn(
              "relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl",
              wide ? "max-w-2xl" : "max-w-lg"
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Toasts ---------- */
type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: string;
  msg: string;
  kind: ToastKind;
}
const ToastCtx = createContext<(msg: string, kind?: ToastKind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((msg: string, kind: ToastKind = "success") => {
    const id = uid();
    setItems((p) => [...p, { id, msg, kind }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 3200);
  }, []);
  const icons = { success: CheckCircle2, error: XCircle, info: Info };
  const tones = { success: "text-emerald-500", error: "text-rose-500", info: "text-sky-500" };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        <AnimatePresence>
          {items.map((t) => {
            const Icon = icons[t.kind];
            return (
              <motion.div
                key={t.id}
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl"
              >
                <Icon size={18} className={tones[t.kind]} />
                {t.msg}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ---------- Petits blocs ---------- */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="admin-page-header relative mb-7 overflow-hidden rounded-[1.75rem] border border-blue-200/15 p-5 shadow-[0_18px_48px_rgba(7,21,45,0.16)] sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(191,219,254,0.25)_0.7px,transparent_0.7px)] bg-[size:28px_28px] opacity-20" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-1/3 h-24 w-24 rounded-full bg-cyan-300/15 blur-2xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            Espace de gestion
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-blue-100/75 sm:text-base">{subtitle}</p>}
        </div>
        {actions && <div className="no-print flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "bg-brand-50 text-brand-600",
  sub,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: string;
  sub?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="card group relative overflow-hidden p-4 transition-shadow hover:shadow-[0_18px_42px_rgba(37,99,235,0.12)] sm:p-5"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-blue-50/80 blur-2xl transition-colors group-hover:bg-blue-100" />
      <div className="flex items-start justify-between">
        <p className="relative pt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <span className={cn("relative rounded-2xl p-2.5 shadow-sm ring-1 ring-black/[0.03]", tone)}>
          <Icon size={16} />
        </span>
      </div>
      <p className="relative mt-3 break-words text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{value}</p>
      {sub && <div className="relative mt-1.5 text-xs">{sub}</div>}
      <div aria-hidden="true" className="absolute inset-x-4 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-brand-400 to-cyan-400 transition-transform duration-300 group-hover:scale-x-100" />
    </motion.div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <span className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-400">
        <Icon size={24} />
      </span>
      <p className="font-bold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex h-48 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
    </div>
  );
}
