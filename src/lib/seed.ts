import type { Customer, DB, Invoice, Movement, Product } from "./types";
import { uid } from "./utils";

// Données de démonstration (supprimables depuis le tableau de bord).
export function makeSeed(): DB {
  const DAY = 86400000;
  const now = Date.now();
  let s = 42;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const iso = (t: number) => new Date(t).toISOString();

  const mk = (name: string, category: string, buy: number, sell: number, stock: number, min: number, description: string): Product => ({
    id: uid(),
    name,
    category,
    buyPrice: buy,
    sellPrice: sell,
    stock,
    minStock: min,
    description,
    createdAt: iso(now - 60 * DAY),
  });

  const products: Product[] = [
    mk("Smartphone Android 128 Go", "Téléphones", 68000, 79900, 8, 2, "Smartphone polyvalent avec écran immersif et 128 Go de stockage."),
    mk("Écouteurs Bluetooth", "Audio", 6500, 9900, 14, 4, "Écouteurs sans fil compacts avec boîtier de recharge."),
    mk("Chargeur rapide USB-C 25 W", "Chargeurs", 4000, 6500, 20, 5, "Adaptateur secteur USB-C pour une recharge rapide et fiable."),
    mk("Batterie externe 20 000 mAh", "Accessoires", 8500, 12500, 9, 3, "Powerbank haute capacité pour recharger vos appareils en déplacement."),
    mk("Enceinte Bluetooth portable", "Audio", 10000, 14900, 7, 2, "Enceinte portable sans fil au son puissant."),
    mk("Souris sans fil rechargeable", "Informatique", 4500, 6900, 16, 4, "Souris ergonomique sans fil, rechargeable par USB."),
    mk("Casque audio Bluetooth", "Audio", 11000, 16900, 8, 2, "Casque sans fil confortable pour la musique et les appels."),
    mk("Câble USB-C renforcé 2 m", "Accessoires", 1800, 3000, 0, 6, "Câble USB-C résistant pour la recharge et le transfert de données."),
  ];

  const customers: Customer[] = [
    { id: uid(), name: "Awa Diop", phone: "+221 77 111 22 33", address: "Quartier Escale", createdAt: iso(now - 50 * DAY) },
    { id: uid(), name: "Moussa Sow", phone: "+221 76 222 33 44", address: "Cité Mamelles", createdAt: iso(now - 45 * DAY) },
    { id: uid(), name: "Fatou Ndiaye", phone: "+221 78 333 44 55", createdAt: iso(now - 30 * DAY) },
    { id: uid(), name: "Ibrahima Fall", phone: "+221 70 444 55 66", address: "Marché central", createdAt: iso(now - 20 * DAY) },
  ];

  const raw: { date: number; inv: Omit<Invoice, "number"> }[] = [];

  for (let n = 0; n < 32; n++) {
    const date = now - Math.floor(rnd() * 40) * DAY - Math.floor(rnd() * 10) * 3600000;
    const isQuote = n % 11 === 10;
    const customer = rnd() > 0.25 ? customers[Math.floor(rnd() * customers.length)] : undefined;
    const lines = 1 + Math.floor(rnd() * 3);
    const items = Array.from({ length: lines }, () => {
      const p = products[Math.floor(rnd() * products.length)];
      return { productId: p.id, name: p.name, qty: 1 + Math.floor(rnd() * 4), price: p.sellPrice, cost: p.buyPrice };
    });
    raw.push({
      date,
      inv: {
        id: uid(),
        type: isQuote ? "devis" : "facture",
        customerId: customer?.id,
        customerName: customer?.name ?? "Client de passage",
        customerPhone: customer?.phone,
        items,
        date: iso(date),
      },
    });
  }

  raw.sort((a, b) => a.date - b.date);
  const counters: Record<string, number> = {};
  const invoices: Invoice[] = raw.map(({ inv }) => {
    const prefix = inv.type === "facture" ? "FAC" : "DEV";
    const year = new Date(inv.date).getFullYear();
    const key = `${prefix}-${year}`;
    counters[key] = (counters[key] ?? 0) + 1;
    return { ...inv, number: `${key}-${String(counters[key]).padStart(4, "0")}` };
  });

  const movements: Movement[] = products.map((p) => ({
    id: uid(),
    productId: p.id,
    productName: p.name,
    type: "entree",
    delta: p.stock,
    note: "Stock initial",
    date: iso(now - 60 * DAY),
  }));

  return { products, movements, customers, invoices: invoices.reverse(), demo: true };
}
