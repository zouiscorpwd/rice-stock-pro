import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { AddPurchaseDialog } from '@/components/purchase/AddPurchaseDialog';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { PurchaseInvoice } from '@/components/purchase/PurchaseInvoice';
import { usePurchases, useAddPurchasePayment, Purchase } from '@/hooks/usePurchases';
import { Purchase as InventoryPurchase } from '@/types/inventory';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ShoppingCart, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

// Transform database purchase to invoice format
function transformPurchaseForInvoice(purchase: Purchase): InventoryPurchase {
  return {
    id: purchase.id,
    billerName: purchase.biller_name,
    billerPhone: purchase.biller_phone || undefined,
    totalAmount: purchase.total_amount,
    paidAmount: purchase.paid_amount,
    balanceAmount: purchase.balance_amount,
    createdAt: new Date(purchase.created_at),
    payments: [], // Payments are tracked separately in the database
    items: purchase.items.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      weightPerUnit: item.weight_per_unit,
      quantity: item.quantity,
      weight: item.weight,
      amount: item.amount,
    })),
  };
}

export default function PurchasePage() {
  const { data: purchases = [], isLoading } = usePurchases();
  const addPayment = useAddPurchasePayment();
  
  const [search, setSearch] = useState('');
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    purchaseId: string;
    billerName: string;
    balanceAmount: number;
  }>({ open: false, purchaseId: '', billerName: '', balanceAmount: 0 });
  const [invoiceDialog, setInvoiceDialog] = useState<{
    open: boolean;
    purchase: InventoryPurchase | null;
  }>({ open: false, purchase: null });

  const filteredPurchases = purchases.filter(purchase =>
    purchase.biller_name.toLowerCase().includes(search.toLowerCase()) ||
    purchase.items.some(item => item.product_name.toLowerCase().includes(search.toLowerCase()))
  );

  const openPaymentDialog = (purchase: Purchase) => {
    setPaymentDialog({
      open: true,
      purchaseId: purchase.id,
      billerName: purchase.biller_name,
      balanceAmount: purchase.balance_amount,
    });
  };

  const handleAddPayment = (billId: string, payment: { amount: number; date: Date; note?: string }) => {
    addPayment.mutate({ purchaseId: billId, amount: payment.amount, note: payment.note });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Purchase"
        description="Manage your purchase orders and payments"
        action={<AddPurchaseDialog />}
      />

      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by biller or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No purchases found</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Biller</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="text-right">Total Weight</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => {
                    const totalWeight = purchase.items.reduce((sum, item) => sum + item.weight, 0);
                    const productNames = purchase.items.map(item => `${item.product_name} (${item.quantity})`).join(', ');
                    
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell>{format(new Date(purchase.created_at), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-medium">{purchase.biller_name}</TableCell>
                        <TableCell>{purchase.biller_phone || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate" title={productNames}>{productNames}</TableCell>
                        <TableCell className="text-right">{totalWeight} kg</TableCell>
                        <TableCell className="text-right">₹{purchase.total_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-success">₹{purchase.paid_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {purchase.balance_amount > 0 ? (
                            <Badge variant="destructive">₹{purchase.balance_amount.toLocaleString()}</Badge>
                          ) : (
                            <Badge className="bg-success text-success-foreground">Paid</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInvoiceDialog({ open: true, purchase: transformPurchaseForInvoice(purchase) })}
                              className="gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              Invoice
                            </Button>
                            {purchase.balance_amount > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPaymentDialog(purchase)}
                                className="gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Pay
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddPaymentDialog
        open={paymentDialog.open}
        onOpenChange={(open) => setPaymentDialog(prev => ({ ...prev, open }))}
        billId={paymentDialog.purchaseId}
        billType="purchase"
        partyName={paymentDialog.billerName}
        balanceAmount={paymentDialog.balanceAmount}
        onAddPayment={handleAddPayment}
      />

      <PurchaseInvoice
        purchase={invoiceDialog.purchase}
        open={invoiceDialog.open}
        onOpenChange={(open) => setInvoiceDialog(prev => ({ ...prev, open }))}
      />
    </div>
  );
}
