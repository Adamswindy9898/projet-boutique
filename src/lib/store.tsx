"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Customer, DB, Invoice, InvoiceItem, Movement, MovementType, Product } from "./types";
import { makeSeed } from "./seed";
import { uid } from "./utils";

const KEY = "boutique-db-v1";
const EMPTY: DB = { products: [], movements: [], customers: [], invoices: [], demo: false };

export type ProductInput = Omit<Product, "id" | "createdAt">;
export type CustomerInput = Omit<Customer, "id" | "createdAt">;
export interface InvoiceInput {
  type: Invoice["type"];
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
}

interface Ctx {
  db: DB;
  ready: boolean;
  saveProduct: (d: ProductInput, id?: string) => string;
  deleteProduct: (id: string) => void;
  moveStock: (productId: string, type: MovementType, delta: number, note: string) => void;
  applyInventory: (counts: Record<string, number>) => void;
  saveCustomer: (d: CustomerInput, id?: string) => string;
  createInvoice: (i: InvoiceInput) => string;
  convertQuote: (id: string) => void;
  deleteInvoice: (id: string) => void;
  resetDemo: () => void;
  clearAll: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

const mkMove = (p: Product, type: MovementType, delta: number, note: string): Movement => ({
  id: uid(),
  productId: p.id,
  productName: p.name,
  type,
  delta,
  note,
  date: new Date().toISOString(),
});

function nextNumber(list: Invoice[], type: Invoice["type"]) {
  const prefix = type === "facture" ? "FAC" : "DEV";
  const year = new Date().getFullYear();
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const max = list.reduce((m, i) => {
    const r = re.exec(i.number);
    return r ? Math.max(m, parseInt(r[1], 10)) : m;
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(4, "0")}`;
}

function applyItems(db: DB, items: InvoiceItem[], dir: 1 | -1, type: MovementType, note: string) {
  const qtyBy = new Map<string, number>();
  items.forEach((i) => qtyBy.set(i.productId, (qtyBy.get(i.productId) ?? 0) + i.qty));
  const moves: Movement[] = [];
  const products = db.products.map((p) => {
    const q = qtyBy.get(p.id);
    if (!q) return p;
    const delta = dir * q;
    moves.push(mkMove(p, type, delta, note));
    return { ...p, stock: p.stock + delta };
  });
  return { products, movements: [...moves, ...db.movements] };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setDb(raw ? { ...EMPTY, ...JSON.parse(raw) } : makeSeed());
    } catch {
      setDb(makeSeed());
    }
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          setDb({ ...EMPTY, ...JSON.parse(e.newValue) });
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {}
  }, [db, ready]);

  const saveProduct = useCallback((d: ProductInput, id?: string) => {
    const pid = id ?? uid();
    setDb((prev) => {
      if (id) {
        return { ...prev, products: prev.products.map((p) => (p.id === id ? { ...p, ...d, stock: p.stock } : p)) };
      }
      const product: Product = { ...d, id: pid, createdAt: new Date().toISOString() };
      const movements = d.stock > 0 ? [mkMove(product, "entree", d.stock, "Stock initial"), ...prev.movements] : prev.movements;
      return { ...prev, products: [product, ...prev.products], movements };
    });
    return pid;
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setDb((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }));
  }, []);

  const moveStock = useCallback((productId: string, type: MovementType, delta: number, note: string) => {
    setDb((prev) => {
      const p = prev.products.find((x) => x.id === productId);
      if (!p || delta === 0) return prev;
      return {
        ...prev,
        products: prev.products.map((x) => (x.id === productId ? { ...x, stock: x.stock + delta } : x)),
        movements: [mkMove(p, type, delta, note), ...prev.movements],
      };
    });
  }, []);

  const applyInventory = useCallback((counts: Record<string, number>) => {
    setDb((prev) => {
      const moves: Movement[] = [];
      const products = prev.products.map((p) => {
        const c = counts[p.id];
        if (c === undefined || c === p.stock) return p;
        moves.push(mkMove(p, "inventaire", c - p.stock, `Inventaire : ${p.stock} → ${c}`));
        return { ...p, stock: c };
      });
      return { ...prev, products, movements: [...moves, ...prev.movements] };
    });
  }, []);

  const saveCustomer = useCallback((d: CustomerInput, id?: string) => {
    const cid = id ?? uid();
    setDb((prev) => {
      if (id) {
        return {
          ...prev,
          customers: prev.customers.map((c) => (c.id === id ? { ...c, ...d } : c)),
          invoices: prev.invoices.map((i) =>
            i.customerId === id ? { ...i, customerName: d.name, customerPhone: d.phone } : i
          ),
        };
      }
      return { ...prev, customers: [{ ...d, id: cid, createdAt: new Date().toISOString() }, ...prev.customers] };
    });
    return cid;
  }, []);

  const createInvoice = useCallback((input: InvoiceInput) => {
    const id = uid();
    setDb((prev) => {
      const now = new Date().toISOString();
      const number = nextNumber(prev.invoices, input.type);
      const invoice: Invoice = {
        id,
        number,
        type: input.type,
        customerId: input.customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        items: input.items,
        date: now,
      };
      const stockPart =
        input.type === "facture"
          ? applyItems(prev, input.items, -1, "vente", `Vente ${number}`)
          : { products: prev.products, movements: prev.movements };
      return { ...prev, ...stockPart, invoices: [invoice, ...prev.invoices] };
    });
    return id;
  }, []);

  const convertQuote = useCallback((id: string) => {
    setDb((prev) => {
      const inv = prev.invoices.find((i) => i.id === id);
      if (!inv || inv.type !== "devis") return prev;
      const number = nextNumber(prev.invoices, "facture");
      const stockPart = applyItems(prev, inv.items, -1, "vente", `Vente ${number}`);
      return {
        ...prev,
        ...stockPart,
        invoices: prev.invoices.map((i) =>
          i.id === id ? { ...i, type: "facture" as const, number, date: new Date().toISOString() } : i
        ),
      };
    });
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setDb((prev) => {
      const inv = prev.invoices.find((i) => i.id === id);
      if (!inv) return prev;
      const stockPart =
        inv.type === "facture"
          ? applyItems(prev, inv.items, 1, "ajustement", `Annulation ${inv.number}`)
          : { products: prev.products, movements: prev.movements };
      return { ...prev, ...stockPart, invoices: prev.invoices.filter((i) => i.id !== id) };
    });
  }, []);

  const resetDemo = useCallback(() => setDb(makeSeed()), []);
  const clearAll = useCallback(() => setDb({ ...EMPTY }), []);

  const value = useMemo<Ctx>(
    () => ({
      db,
      ready,
      saveProduct,
      deleteProduct,
      moveStock,
      applyInventory,
      saveCustomer,
      createInvoice,
      convertQuote,
      deleteInvoice,
      resetDemo,
      clearAll,
    }),
    [db, ready, saveProduct, deleteProduct, moveStock, applyInventory, saveCustomer, createInvoice, convertQuote, deleteInvoice, resetDemo, clearAll]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore doit être utilisé dans <StoreProvider>");
  return ctx;
}
