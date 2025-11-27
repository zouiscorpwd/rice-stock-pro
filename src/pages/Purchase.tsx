import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { AddPurchaseDialog } from '@/components/purchase/AddPurchaseDialog';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { PurchaseInvoice } from '@/components/purchase/PurchaseInvoice';
import { useInventory } from '@/context/InventoryContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ShoppingCart, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { Purchase } from '@/types/inventory';

export default function Purchase() {
  const { purchases, addPaymentToPurchase } = useInventory();
  const [search, setSearch] = useState('');
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    purchaseId: string;
    billerName: string;
    balanceAmount: number;
  }>({ open: false, purchaseId: '', billerName: '', balanceAmount: 0 });
  const [invoiceDialog, setInvoiceDialog] = useState<{
    open: boolean;
    purchase: Purchase | null;
  }>({ open: false, purchase: null });

  const filteredPurchases = purchases.filter(purchase =>
    purchase.billerName.toLowerCase().includes(search.toLowerCase()) ||
    purchase.items.some(item => item.productName.toLowerCase().includes(search.toLowerCase()))
  );

  const openPaymentDialog = (purchase: typeof purchases[0]) => {
    setPaymentDialog({
      open: true,
      purchaseId: purchase.id,
      billerName: purchase.billerName,
      balanceAmount: purchase.balanceAmount,
    });
  };

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
                    const productNames = purchase.items.map(item => `${item.productName} (${item.quantity})`).join(', ');
                    
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell>{format(new Date(purchase.createdAt), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-medium">{purchase.billerName}</TableCell>
                        <TableCell>{purchase.billerPhone || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate" title={productNames}>{productNames}</TableCell>
                        <TableCell className="text-right">{totalWeight} kg</TableCell>
                        <TableCell className="text-right">₹{purchase.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-success">₹{purchase.paidAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {purchase.balanceAmount > 0 ? (
                            <Badge variant="destructive">₹{purchase.balanceAmount.toLocaleString()}</Badge>
                          ) : (
                            <Badge className="bg-success text-success-foreground">Paid</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInvoiceDialog({ open: true, purchase })}
                              className="gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              Invoice
                            </Button>
                            {purchase.balanceAmount > 0 && (
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
        onAddPayment={addPaymentToPurchase}
      />

      <PurchaseInvoice
        purchase={invoiceDialog.purchase}
        open={invoiceDialog.open}
        onOpenChange={(open) => setInvoiceDialog(prev => ({ ...prev, open }))}
      />
    </div>
  );
}
