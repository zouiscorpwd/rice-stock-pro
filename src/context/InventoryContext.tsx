import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, Purchase, Sale, Payment } from '@/types/inventory';

interface InventoryContextType {
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'payments' | 'balanceAmount'>) => void;
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'payments' | 'balanceAmount'>) => void;
  addPaymentToPurchase: (purchaseId: string, payment: Omit<Payment, 'id'>) => void;
  addPaymentToSale: (saleId: string, payment: Omit<Payment, 'id'>) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Basmati Rice', stock: 500, unit: 'kg', createdAt: new Date() },
    { id: '2', name: 'Sona Masoori', stock: 300, unit: 'kg', createdAt: new Date() },
    { id: '3', name: 'Brown Rice', stock: 150, unit: 'kg', createdAt: new Date() },
  ]);
  
  const [purchases, setPurchases] = useState<Purchase[]>([
    {
      id: '1',
      billerName: 'Rice Supplier Co.',
      billerPhone: '9876543210',
      productId: '1',
      productName: 'Basmati Rice',
      weight: 200,
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
      productId: '1',
      productName: 'Basmati Rice',
      weight: 50,
      totalAmount: 6000,
      paidAmount: 4000,
      balanceAmount: 2000,
      createdAt: new Date('2024-01-20'),
      payments: [{ id: 's1', amount: 4000, date: new Date('2024-01-20') }]
    }
  ]);

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
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

  const addPurchase = (purchase: Omit<Purchase, 'id' | 'createdAt' | 'payments' | 'balanceAmount'>) => {
    const balanceAmount = purchase.totalAmount - purchase.paidAmount;
    const newPurchase: Purchase = {
      ...purchase,
      id: Date.now().toString(),
      balanceAmount,
      createdAt: new Date(),
      payments: purchase.paidAmount > 0 ? [{ id: Date.now().toString(), amount: purchase.paidAmount, date: new Date() }] : [],
    };
    setPurchases(prev => [...prev, newPurchase]);
    
    // Update stock
    setProducts(prev => prev.map(p => 
      p.id === purchase.productId 
        ? { ...p, stock: p.stock + purchase.weight }
        : p
    ));
  };

  const addSale = (sale: Omit<Sale, 'id' | 'createdAt' | 'payments' | 'balanceAmount'>) => {
    const balanceAmount = sale.totalAmount - sale.paidAmount;
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
      balanceAmount,
      createdAt: new Date(),
      payments: sale.paidAmount > 0 ? [{ id: Date.now().toString(), amount: sale.paidAmount, date: new Date() }] : [],
    };
    setSales(prev => [...prev, newSale]);
    
    // Update stock
    setProducts(prev => prev.map(p => 
      p.id === sale.productId 
        ? { ...p, stock: Math.max(0, p.stock - sale.weight) }
        : p
    ));
  };

  const addPaymentToPurchase = (purchaseId: string, payment: Omit<Payment, 'id'>) => {
    setPurchases(prev => prev.map(purchase => {
      if (purchase.id === purchaseId) {
        const newPayment = { ...payment, id: Date.now().toString() };
        const newPaidAmount = purchase.paidAmount + payment.amount;
        return {
          ...purchase,
          paidAmount: newPaidAmount,
          balanceAmount: purchase.totalAmount - newPaidAmount,
          payments: [...purchase.payments, newPayment],
        };
      }
      return purchase;
    }));
  };

  const addPaymentToSale = (saleId: string, payment: Omit<Payment, 'id'>) => {
    setSales(prev => prev.map(sale => {
      if (sale.id === saleId) {
        const newPayment = { ...payment, id: Date.now().toString() };
        const newPaidAmount = sale.paidAmount + payment.amount;
        return {
          ...sale,
          paidAmount: newPaidAmount,
          balanceAmount: sale.totalAmount - newPaidAmount,
          payments: [...sale.payments, newPayment],
        };
      }
      return sale;
    }));
  };

  return (
    <InventoryContext.Provider value={{
      products,
      purchases,
      sales,
      addProduct,
      updateProduct,
      deleteProduct,
      addPurchase,
      addSale,
      addPaymentToPurchase,
      addPaymentToSale,
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
