export interface Product {
  id: string;
  name: string;
  stock: number;
  unit: string;
  createdAt: Date;
}

export interface Purchase {
  id: string;
  billerName: string;
  billerPhone: string;
  productId: string;
  productName: string;
  weight: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  createdAt: Date;
  payments: Payment[];
}

export interface Sale {
  id: string;
  customerName: string;
  customerPhone: string;
  productId: string;
  productName: string;
  weight: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  createdAt: Date;
  payments: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  date: Date;
  note?: string;
}

export interface BillerReport {
  billerName: string;
  billerPhone: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  purchases: Purchase[];
}

export interface CustomerReport {
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  sales: Sale[];
}
