export const WEIGHT_VARIANTS = [5, 10, 26] as const;
export type WeightVariant = typeof WEIGHT_VARIANTS[number];

export interface Product {
  id: string;
  name: string;
  weightPerUnit: WeightVariant;
  quantity: number;
  stock: number;
  unit: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  amount: number;
  date: Date;
  note?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  weightPerUnit: number;
  quantity: number;
  weight: number;
  amount: number;
}

export interface Purchase {
  id: string;
  billerName: string;
  billerPhone?: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  createdAt: Date;
  payments: Payment[];
}

export interface SaleItem {
  productId: string;
  productName: string;
  weightPerUnit: number;
  quantity: number;
  weight: number;
  amount: number;
}

export interface Sale {
  id: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  createdAt: Date;
  payments: Payment[];
}

export interface BillerReport {
  billerName: string;
  billerPhone?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  purchases: Purchase[];
}

export interface CustomerReport {
  customerName: string;
  customerPhone?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  sales: Sale[];
}
