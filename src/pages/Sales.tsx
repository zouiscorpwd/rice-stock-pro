import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { AddSaleDialog } from '@/components/sales/AddSaleDialog';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { SalesInvoice } from '@/components/sales/SalesInvoice';
import { useSales, useAddSalePayment, Sale } from '@/hooks/useSales';
import { Sale as InventorySale } from '@/types/inventory';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, TrendingUp, ChevronDown, ChevronUp, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import React from 'react';

// Transform database sale to invoice format
function transformSaleForInvoice(sale: Sale): InventorySale {
  return {
    id: sale.id,
    customerName: sale.customer_name,
    customerPhone: sale.customer_phone || undefined,
    totalAmount: sale.total_amount,
    paidAmount: sale.paid_amount,
    balanceAmount: sale.balance_amount,
    createdAt: new Date(sale.created_at),
    payments: [], // Payments are tracked separately in the database
    items: sale.items.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      weightPerUnit: item.weight_per_unit,
      quantity: item.quantity,
      weight: item.weight,
      amount: item.amount,
    })),
  };
}

export default function Sales() {
  const { data: sales = [], isLoading } = useSales();
  const addPayment = useAddSalePayment();
  
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    saleId: string;
    customerName: string;
    balanceAmount: number;
  }>({ open: false, saleId: '', customerName: '', balanceAmount: 0 });
  const [invoiceDialog, setInvoiceDialog] = useState<{
    open: boolean;
    sale: InventorySale | null;
  }>({ open: false, sale: null });

  const filteredSales = sales.filter(sale =>
    sale.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    sale.items.some(item => item.product_name.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openPaymentDialog = (sale: Sale) => {
    setPaymentDialog({
      open: true,
      saleId: sale.id,
      customerName: sale.customer_name,
      balanceAmount: sale.balance_amount,
    });
  };

  const handleAddPayment = (billId: string, payment: { amount: number; date: Date; note?: string }) => {
    addPayment.mutate({ saleId: billId, amount: payment.amount, note: payment.note });
  };

  const getTotalWeight = (items: Sale['items']) => {
    return items.reduce((sum, item) => sum + item.weight, 0);
  };

  const getItemsSummary = (items: Sale['items']) => {
    if (items.length === 1) {
      return `${items[0].product_name} (${items[0].quantity} bags)`;
    }
    return `${items.length} items`;
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
        title="Sales"
        description="Manage your sales and customer payments"
        action={<AddSaleDialog />}
      />

      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No sales found</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <React.Fragment key={sale.id}>
                      <TableRow className="cursor-pointer" onClick={() => toggleRow(sale.id)}>
                        <TableCell>
                          {sale.items.length > 1 && (
                            expandedRows.has(sale.id) ? 
                              <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-medium">{sale.customer_name}</TableCell>
                        <TableCell>{sale.customer_phone || '-'}</TableCell>
                        <TableCell>{getItemsSummary(sale.items)}</TableCell>
                        <TableCell className="text-right">{getTotalWeight(sale.items)} kg</TableCell>
                        <TableCell className="text-right">₹{sale.total_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-success">₹{sale.paid_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {sale.balance_amount > 0 ? (
                            <Badge variant="destructive">₹{sale.balance_amount.toLocaleString()}</Badge>
                          ) : (
                            <Badge className="bg-success text-success-foreground">Paid</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); setInvoiceDialog({ open: true, sale: transformSaleForInvoice(sale) }); }}
                              className="gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              Invoice
                            </Button>
                            {sale.balance_amount > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); openPaymentDialog(sale); }}
                                className="gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Pay
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(sale.id) && sale.items.length > 1 && (
                        sale.items.map((item, idx) => (
                          <TableRow key={`${sale.id}-${idx}`} className="bg-muted/30">
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell colSpan={2} className="text-muted-foreground text-sm pl-8">
                              └ {item.product_name}
                            </TableCell>
                            <TableCell className="text-sm">{item.quantity} bags × {item.weight_per_unit}kg</TableCell>
                            <TableCell className="text-right text-sm">{item.weight} kg</TableCell>
                            <TableCell className="text-right text-sm">₹{item.amount.toLocaleString()}</TableCell>
                            <TableCell colSpan={3}></TableCell>
                          </TableRow>
                        ))
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddPaymentDialog
        open={paymentDialog.open}
        onOpenChange={(open) => setPaymentDialog(prev => ({ ...prev, open }))}
        billId={paymentDialog.saleId}
        billType="sale"
        partyName={paymentDialog.customerName}
        balanceAmount={paymentDialog.balanceAmount}
        onAddPayment={handleAddPayment}
      />

      <SalesInvoice
        sale={invoiceDialog.sale}
        open={invoiceDialog.open}
        onOpenChange={(open) => setInvoiceDialog(prev => ({ ...prev, open }))}
      />
    </div>
  );
}
