export type MovementType = "entree" | "sortie" | "perte" | "ajustement" | "vente" | "inventaire";

export interface Product {
  id: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  image?: string;
  description?: string;
  createdAt: string;
}

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  delta: number;
  note: string;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
}

export interface Invoice {
  id: string;
  number: string;
  type: "facture" | "devis";
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  date: string;
}

export interface DB {
  products: Product[];
  movements: Movement[];
  customers: Customer[];
  invoices: Invoice[];
  demo: boolean;
}
