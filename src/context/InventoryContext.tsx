import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, Purchase, Sale, Payment, PurchaseItem, SaleItem } from '@/types/inventory';

interface InventoryContextType {
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'stock'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addPurchase: (purchase: { billerName: string; billerPhone?: string; items: Omit<PurchaseItem, 'weight'>[]; paidAmount: number }) => void;
  addSale: (sale: { customerName: string; customerPhone?: string; items: Omit<SaleItem, 'weight'>[]; paidAmount: number }) => void;
  addPaymentToPurchase: (purchaseId: string, payment: Omit<Payment, 'id'>) => void;
  addPaymentToSale: (saleId: string, payment: Omit<Payment, 'id'>) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Basmati Rice', weightPerUnit: 26, quantity: 20, stock: 520, unit: 'kg', createdAt: new Date() },
    { id: '2', name: 'Sona Masoori', weightPerUnit: 10, quantity: 30, stock: 300, unit: 'kg', createdAt: new Date() },
    { id: '3', name: 'Brown Rice', weightPerUnit: 5, quantity: 30, stock: 150, unit: 'kg', createdAt: new Date() },
  ]);
  
  const [purchases, setPurchases] = useState<Purchase[]>([
    {
      id: '1',
      billerName: 'Rice Supplier Co.',
      billerPhone: '9876543210',
      items: [{ productId: '1', productName: 'Basmati Rice', weightPerUnit: 26, quantity: 8, weight: 208, amount: 20000 }],
      totalAmount: 20000,
      paidAmount: 15000,
      balanceAmount: 5000,
      createdAt: new Date('2024-01-15'),
      payments: [{ id: 'p1', amount: 15000, date: new Date('2024-01-15') }]
    }
  ]);
  
  const [sales, setSales] = useState<Sale[]>([
    {
      id: '1',
      customerName: 'Hotel Grand',
      customerPhone: '9123456780',
      items: [{ productId: '1', productName: 'Basmati Rice', weightPerUnit: 26, quantity: 2, weight: 52, amount: 6000 }],
      totalAmount: 6000,
      paidAmount: 4000,
      balanceAmount: 2000,
      createdAt: new Date('2024-01-20'),
      payments: [{ id: 's1', amount: 4000, date: new Date('2024-01-20') }]
    }
  ]);

  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'stock'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      stock: product.weightPerUnit * product.quantity,
      createdAt: new Date(),
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addPurchase = (purchase: { billerName: string; billerPhone?: string; items: Omit<PurchaseItem, 'weight'>[]; paidAmount: number }) => {
    const itemsWithWeight: PurchaseItem[] = purchase.items.map(item => ({
      ...item,
      weight: item.weightPerUnit * item.quantity
    }));
    
    const totalAmount = itemsWithWeight.reduce((sum, item) => sum + item.amount, 0);
    const balanceAmount = totalAmount - purchase.paidAmount;
    
    const newPurchase: Purchase = {
      id: Date.now().toString(),
      billerName: purchase.billerName,
      billerPhone: purchase.billerPhone,
      items: itemsWithWeight,
      totalAmount,
      paidAmount: purchase.paidAmount,
      balanceAmount,
      createdAt: new Date(),
      payments: purchase.paidAmount > 0 ? [{ id: Date.now().toString(), amount: purchase.paidAmount, date: new Date() }] : [],
    };
    setPurchases(prev => [...prev, newPurchase]);
    
    setProducts(prev => prev.map(p => {
      const purchasedItem = itemsWithWeight.find(item => item.productId === p.id);
      if (purchasedItem) {
        return { ...p, quantity: p.quantity + purchasedItem.quantity, stock: p.stock + purchasedItem.weight };
      }
      return p;
    }));
  };

  const addSale = (sale: { customerName: string; customerPhone?: string; items: Omit<SaleItem, 'weight'>[]; paidAmount: number }) => {
    const itemsWithWeight: SaleItem[] = sale.items.map(item => ({
      ...item,
      weight: item.weightPerUnit * item.quantity
    }));
    
    const totalAmount = itemsWithWeight.reduce((sum, item) => sum + item.amount, 0);
    const balanceAmount = totalAmount - sale.paidAmount;
    
    const newSale: Sale = {
      id: Date.now().toString(),
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      items: itemsWithWeight,
      totalAmount,
      paidAmount: sale.paidAmount,
      balanceAmount,
      createdAt: new Date(),
      payments: sale.paidAmount > 0 ? [{ id: Date.now().toString(), amount: sale.paidAmount, date: new Date() }] : [],
    };
    setSales(prev => [...prev, newSale]);
    
    setProducts(prev => prev.map(p => {
      const soldItem = itemsWithWeight.find(item => item.productId === p.id);
      if (soldItem) {
        return { ...p, quantity: Math.max(0, p.quantity - soldItem.quantity), stock: Math.max(0, p.stock - soldItem.weight) };
      }
      return p;
    }));
  };

  const addPaymentToPurchase = (purchaseId: string, payment: Omit<Payment, 'id'>) => {
    setPurchases(prev => prev.map(purchase => {
      if (purchase.id === purchaseId) {
        const newPayment = { ...payment, id: Date.now().toString() };
        const newPaidAmount = purchase.paidAmount + payment.amount;
        return { ...purchase, paidAmount: newPaidAmount, balanceAmount: purchase.totalAmount - newPaidAmount, payments: [...purchase.payments, newPayment] };
      }
      return purchase;
    }));
  };

  const addPaymentToSale = (saleId: string, payment: Omit<Payment, 'id'>) => {
    setSales(prev => prev.map(sale => {
      if (sale.id === saleId) {
        const newPayment = { ...payment, id: Date.now().toString() };
        const newPaidAmount = sale.paidAmount + payment.amount;
        return { ...sale, paidAmount: newPaidAmount, balanceAmount: sale.totalAmount - newPaidAmount, payments: [...sale.payments, newPayment] };
      }
      return sale;
    }));
  };

  return (
    <InventoryContext.Provider value={{ products, purchases, sales, addProduct, updateProduct, deleteProduct, addPurchase, addSale, addPaymentToPurchase, addPaymentToSale }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within an InventoryProvider');
  return context;
}
