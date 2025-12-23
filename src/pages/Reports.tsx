import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { useInventory } from '@/context/InventoryContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Search, FileText, Plus, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { BillerReport, CustomerReport } from '@/types/inventory';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { useLooseStock } from '@/hooks/useLooseStock';

export default function Reports() {
  const { purchases, sales, addPaymentToPurchase, addPaymentToSale } = useInventory();
  const { data: looseStock = [] } = useLooseStock();
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [salesSearch, setSalesSearch] = useState('');
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    billId: string;
    billType: 'purchase' | 'sale';
    partyName: string;
    balanceAmount: number;
  }>({ open: false, billId: '', billType: 'purchase', partyName: '', balanceAmount: 0 });

  const billerReports = useMemo(() => {
    const reportMap = new Map<string, BillerReport>();
    
    purchases.forEach(purchase => {
      const key = `${purchase.billerName}-${purchase.billerPhone}`;
      const existing = reportMap.get(key);
      
      if (existing) {
        existing.totalAmount += purchase.totalAmount;
        existing.paidAmount += purchase.paidAmount;
        existing.balanceAmount += purchase.balanceAmount;
        existing.purchases.push(purchase);
      } else {
        reportMap.set(key, {
          billerName: purchase.billerName,
          billerPhone: purchase.billerPhone,
          totalAmount: purchase.totalAmount,
          paidAmount: purchase.paidAmount,
          balanceAmount: purchase.balanceAmount,
          purchases: [purchase],
        });
      }
    });
    
    return Array.from(reportMap.values());
  }, [purchases]);

  const customerReports = useMemo(() => {
    const reportMap = new Map<string, CustomerReport>();
    
    sales.forEach(sale => {
      const key = `${sale.customerName}-${sale.customerPhone}`;
      const existing = reportMap.get(key);
      
      if (existing) {
        existing.totalAmount += sale.totalAmount;
        existing.paidAmount += sale.paidAmount;
        existing.balanceAmount += sale.balanceAmount;
        existing.sales.push(sale);
      } else {
        reportMap.set(key, {
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
          totalAmount: sale.totalAmount,
          paidAmount: sale.paidAmount,
          balanceAmount: sale.balanceAmount,
          sales: [sale],
        });
      }
    });
    
    return Array.from(reportMap.values());
  }, [sales]);

  const filteredBillerReports = billerReports.filter(report =>
    report.billerName.toLowerCase().includes(purchaseSearch.toLowerCase())
  );

  const filteredCustomerReports = customerReports.filter(report =>
    report.customerName.toLowerCase().includes(salesSearch.toLowerCase())
  );

  const openPaymentDialog = (
    billId: string,
    billType: 'purchase' | 'sale',
    partyName: string,
    balanceAmount: number
  ) => {
    setPaymentDialog({
      open: true,
      billId,
      billType,
      partyName,
      balanceAmount,
    });
  };

  const handleAddPayment = (billId: string, payment: { amount: number; date: Date; note?: string }) => {
    if (paymentDialog.billType === 'purchase') {
      addPaymentToPurchase(billId, payment);
    } else {
      addPaymentToSale(billId, payment);
    }
  };

  const getTotalWeight = (items: { weight: number }[]) => {
    return items.reduce((sum, item) => sum + item.weight, 0);
  };

  const getItemsDisplay = (items: { productName: string; quantity: number; weightPerUnit: number }[]) => {
    return items.map(item => `${item.productName} (${item.quantity}×${item.weightPerUnit}kg)`).join(', ');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        description="View purchase and sales reports by biller/customer"
      />

      <Tabs defaultValue="purchase" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="purchase">Purchase Report</TabsTrigger>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="loose">Loose Report</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Biller-wise Purchase Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by biller name..."
                    value={purchaseSearch}
                    onChange={(e) => setPurchaseSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredBillerReports.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No purchase data found</p>
              ) : (
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredBillerReports.map((report, index) => (
                    <AccordionItem key={index} value={`biller-${index}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="text-left">
                            <p className="font-semibold">{report.billerName}</p>
                            <p className="text-sm text-muted-foreground">{report.billerPhone || 'No phone'}</p>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-medium">₹{report.totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground">Paid</p>
                              <p className="font-medium text-success">₹{report.paidAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground">Balance</p>
                              <p className={`font-medium ${report.balanceAmount > 0 ? 'text-destructive' : ''}`}>
                                ₹{report.balanceAmount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-3">Purchase History</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead className="text-right">Weight</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.purchases.map((purchase) => (
                                <TableRow key={purchase.id}>
                                  <TableCell>{format(new Date(purchase.createdAt), 'dd/MM/yyyy')}</TableCell>
                                  <TableCell className="min-w-[250px]" title={getItemsDisplay(purchase.items)}>
                                    {getItemsDisplay(purchase.items)}
                                  </TableCell>
                                  <TableCell className="text-right">{getTotalWeight(purchase.items)} kg</TableCell>
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
                                    {purchase.balanceAmount > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openPaymentDialog(purchase.id, 'purchase', purchase.billerName, purchase.balanceAmount)}
                                        className="gap-1"
                                      >
                                        <Plus className="h-3 w-3" />
                                        Add Payment
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          
                          {report.purchases.some(p => p.payments.length > 0) && (
                            <div className="mt-4">
                              <h4 className="text-sm font-semibold mb-3">Payment History</h4>
                              <div className="space-y-2">
                                {report.purchases.flatMap(p => 
                                  p.payments.map(payment => (
                                    <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                      <div>
                                        <p className="text-sm font-medium">{format(new Date(payment.date), 'dd/MM/yyyy')}</p>
                                        {payment.note && <p className="text-xs text-muted-foreground">{payment.note}</p>}
                                      </div>
                                      <p className="font-medium text-success">+₹{payment.amount.toLocaleString()}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Customer-wise Sales Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer name..."
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredCustomerReports.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No sales data found</p>
              ) : (
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredCustomerReports.map((report, index) => (
                    <AccordionItem key={index} value={`customer-${index}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="text-left">
                            <p className="font-semibold">{report.customerName}</p>
                            <p className="text-sm text-muted-foreground">{report.customerPhone || 'No phone'}</p>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-medium">₹{report.totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground">Paid</p>
                              <p className="font-medium text-success">₹{report.paidAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground">Balance</p>
                              <p className={`font-medium ${report.balanceAmount > 0 ? 'text-destructive' : ''}`}>
                                ₹{report.balanceAmount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-3">Sales History</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead className="text-right">Weight</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.sales.map((sale) => (
                                <TableRow key={sale.id}>
                                  <TableCell>{format(new Date(sale.createdAt), 'dd/MM/yyyy')}</TableCell>
                                  <TableCell className="min-w-[250px]" title={getItemsDisplay(sale.items)}>
                                    {getItemsDisplay(sale.items)}
                                  </TableCell>
                                  <TableCell className="text-right">{getTotalWeight(sale.items)} kg</TableCell>
                                  <TableCell className="text-right">₹{sale.totalAmount.toLocaleString()}</TableCell>
                                  <TableCell className="text-right text-success">₹{sale.paidAmount.toLocaleString()}</TableCell>
                                  <TableCell className="text-right">
                                    {sale.balanceAmount > 0 ? (
                                      <Badge variant="destructive">₹{sale.balanceAmount.toLocaleString()}</Badge>
                                    ) : (
                                      <Badge className="bg-success text-success-foreground">Paid</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {sale.balanceAmount > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openPaymentDialog(sale.id, 'sale', sale.customerName, sale.balanceAmount)}
                                        className="gap-1"
                                      >
                                        <Plus className="h-3 w-3" />
                                        Add Payment
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          
                          {report.sales.some(s => s.payments.length > 0) && (
                            <div className="mt-4">
                              <h4 className="text-sm font-semibold mb-3">Payment History</h4>
                              <div className="space-y-2">
                                {report.sales.flatMap(s => 
                                  s.payments.map(payment => (
                                    <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                      <div>
                                        <p className="text-sm font-medium">{format(new Date(payment.date), 'dd/MM/yyyy')}</p>
                                        {payment.note && <p className="text-xs text-muted-foreground">{payment.note}</p>}
                                      </div>
                                      <p className="font-medium text-success">+₹{payment.amount.toLocaleString()}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loose">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Loose Stock Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {looseStock.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No loose stock data found</p>
              ) : (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Products</p>
                      <p className="text-2xl font-bold">{looseStock.length}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Bags Converted</p>
                      <p className="text-2xl font-bold">{looseStock.reduce((acc, l) => acc + l.bags_converted, 0)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Loose Quantity</p>
                      <p className="text-2xl font-bold">{looseStock.reduce((acc, l) => acc + Number(l.loose_quantity), 0).toLocaleString()} kg</p>
                    </div>
                  </div>

                  {/* Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Weight/Unit</TableHead>
                        <TableHead className="text-center">Bags Converted</TableHead>
                        <TableHead className="text-center">Original Qty (kg)</TableHead>
                        <TableHead className="text-right">Current Loose (kg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {looseStock.map((item) => {
                        const originalQty = item.bags_converted * item.weight_per_unit;
                        const used = originalQty - Number(item.loose_quantity);
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell className="text-center">{item.weight_per_unit} kg</TableCell>
                            <TableCell className="text-center">{item.bags_converted}</TableCell>
                            <TableCell className="text-center">{originalQty.toLocaleString()} kg</TableCell>
                            <TableCell className="text-right">
                              <div>
                                <span className="font-medium text-primary">{Number(item.loose_quantity).toLocaleString()} kg</span>
                                {used > 0 && (
                                  <span className="text-xs text-muted-foreground ml-2">({used.toLocaleString()} kg used)</span>
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
        </TabsContent>
      </Tabs>

      <AddPaymentDialog
        open={paymentDialog.open}
        onOpenChange={(open) => setPaymentDialog(prev => ({ ...prev, open }))}
        billId={paymentDialog.billId}
        billType={paymentDialog.billType}
        partyName={paymentDialog.partyName}
        balanceAmount={paymentDialog.balanceAmount}
        onAddPayment={handleAddPayment}
      />
    </div>
  );
}
