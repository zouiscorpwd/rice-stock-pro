import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Search, FileText, Plus, Scale, Receipt, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { useLooseStock } from '@/hooks/useLooseStock';
import { usePurchases, useAddPurchasePayment } from '@/hooks/usePurchases';
import { useSales, useAddSalePayment } from '@/hooks/useSales';
import { useLooseSales, useAddLooseSalePayment } from '@/hooks/useLooseSales';

interface LooseCustomerReport {
  customerName: string;
  customerPhone: string | null;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  sales: {
    id: string;
    customer_name: string;
    customer_phone: string | null;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    created_at: string;
    items: { product_name: string; quantity_kg: number; price_per_kg: number; amount: number }[];
  }[];
}

export default function Reports() {
  const { data: purchases = [], isLoading: purchasesLoading } = usePurchases();
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: looseStock = [], isLoading: looseStockLoading } = useLooseStock();
  const { data: looseSales = [], isLoading: looseSalesLoading } = useLooseSales();
  
  const addPurchasePayment = useAddPurchasePayment();
  const addSalePayment = useAddSalePayment();
  const addLooseSalePayment = useAddLooseSalePayment();

  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [salesSearch, setSalesSearch] = useState('');
  const [looseRetailSearch, setLooseRetailSearch] = useState('');
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    billId: string;
    billType: 'purchase' | 'sale' | 'loose_sale';
    partyName: string;
    balanceAmount: number;
  }>({ open: false, billId: '', billType: 'purchase', partyName: '', balanceAmount: 0 });

  const billerReports = useMemo(() => {
    const reportMap = new Map<string, {
      billerName: string;
      billerPhone: string | null;
      totalAmount: number;
      paidAmount: number;
      balanceAmount: number;
      purchases: typeof purchases;
    }>();
    
    purchases.forEach(purchase => {
      const key = `${purchase.biller_name}-${purchase.biller_phone || ''}`;
      const existing = reportMap.get(key);
      
      if (existing) {
        existing.totalAmount += Number(purchase.total_amount);
        existing.paidAmount += Number(purchase.paid_amount);
        existing.balanceAmount += Number(purchase.balance_amount);
        existing.purchases.push(purchase);
      } else {
        reportMap.set(key, {
          billerName: purchase.biller_name,
          billerPhone: purchase.biller_phone,
          totalAmount: Number(purchase.total_amount),
          paidAmount: Number(purchase.paid_amount),
          balanceAmount: Number(purchase.balance_amount),
          purchases: [purchase],
        });
      }
    });
    
    return Array.from(reportMap.values());
  }, [purchases]);

  const customerReports = useMemo(() => {
    const reportMap = new Map<string, {
      customerName: string;
      customerPhone: string | null;
      totalAmount: number;
      paidAmount: number;
      balanceAmount: number;
      sales: typeof sales;
    }>();
    
    sales.forEach(sale => {
      const key = `${sale.customer_name}-${sale.customer_phone || ''}`;
      const existing = reportMap.get(key);
      
      if (existing) {
        existing.totalAmount += Number(sale.total_amount);
        existing.paidAmount += Number(sale.paid_amount);
        existing.balanceAmount += Number(sale.balance_amount);
        existing.sales.push(sale);
      } else {
        reportMap.set(key, {
          customerName: sale.customer_name,
          customerPhone: sale.customer_phone,
          totalAmount: Number(sale.total_amount),
          paidAmount: Number(sale.paid_amount),
          balanceAmount: Number(sale.balance_amount),
          sales: [sale],
        });
      }
    });
    
    return Array.from(reportMap.values());
  }, [sales]);

  const looseRetailReports = useMemo(() => {
    const reportMap = new Map<string, LooseCustomerReport>();
    
    looseSales.forEach(sale => {
      const key = `${sale.customer_name}-${sale.customer_phone || ''}`;
      const existing = reportMap.get(key);
      
      if (existing) {
        existing.totalAmount += Number(sale.total_amount);
        existing.paidAmount += Number(sale.paid_amount);
        existing.balanceAmount += Number(sale.balance_amount);
        existing.sales.push(sale);
      } else {
        reportMap.set(key, {
          customerName: sale.customer_name,
          customerPhone: sale.customer_phone,
          totalAmount: Number(sale.total_amount),
          paidAmount: Number(sale.paid_amount),
          balanceAmount: Number(sale.balance_amount),
          sales: [sale],
        });
      }
    });
    
    return Array.from(reportMap.values());
  }, [looseSales]);

  const filteredBillerReports = billerReports.filter(report =>
    report.billerName.toLowerCase().includes(purchaseSearch.toLowerCase())
  );

  const filteredCustomerReports = customerReports.filter(report =>
    report.customerName.toLowerCase().includes(salesSearch.toLowerCase())
  );

  const filteredLooseRetailReports = looseRetailReports.filter(report =>
    report.customerName.toLowerCase().includes(looseRetailSearch.toLowerCase())
  );

  const openPaymentDialog = (
    billId: string,
    billType: 'purchase' | 'sale' | 'loose_sale',
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
      addPurchasePayment.mutate({ purchaseId: billId, amount: payment.amount, note: payment.note });
    } else if (paymentDialog.billType === 'sale') {
      addSalePayment.mutate({ saleId: billId, amount: payment.amount, note: payment.note });
    } else if (paymentDialog.billType === 'loose_sale') {
      addLooseSalePayment.mutate({ sale_id: billId, amount: payment.amount, note: payment.note });
    }
  };

  const getTotalWeight = (items: { weight: number }[]) => {
    return items.reduce((sum, item) => sum + item.weight, 0);
  };

  const getItemsDisplay = (items: { product_name: string; quantity: number; weight_per_unit: number }[]) => {
    return items.map(item => `${item.product_name} (${item.quantity}×${item.weight_per_unit}kg)`).join(', ');
  };

  const getLooseItemsDisplay = (items: { product_name: string; quantity_kg: number }[]) => {
    if (!items || items.length === 0) return 'No items';
    return items.map(item => `${item.product_name} (${item.quantity_kg} kg)`).join(', ');
  };

  const isLoading = purchasesLoading || salesLoading || looseStockLoading || looseSalesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        description="View purchase, sales, and loose retail reports by biller/customer"
      />

      <Tabs defaultValue="purchase" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="loose">Loose Stock</TabsTrigger>
          <TabsTrigger value="loose-retail">Loose Retail</TabsTrigger>
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
                                  <TableCell>{format(new Date(purchase.created_at), 'dd/MM/yyyy')}</TableCell>
                                  <TableCell className="min-w-[250px]" title={getItemsDisplay(purchase.items)}>
                                    {getItemsDisplay(purchase.items)}
                                  </TableCell>
                                  <TableCell className="text-right">{getTotalWeight(purchase.items)} kg</TableCell>
                                  <TableCell className="text-right">₹{Number(purchase.total_amount).toLocaleString()}</TableCell>
                                  <TableCell className="text-right text-success">₹{Number(purchase.paid_amount).toLocaleString()}</TableCell>
                                  <TableCell className="text-right">
                                    {Number(purchase.balance_amount) > 0 ? (
                                      <Badge variant="destructive">₹{Number(purchase.balance_amount).toLocaleString()}</Badge>
                                    ) : (
                                      <Badge className="bg-success text-success-foreground">Paid</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {Number(purchase.balance_amount) > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openPaymentDialog(purchase.id, 'purchase', purchase.biller_name, Number(purchase.balance_amount))}
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
                                  <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy')}</TableCell>
                                  <TableCell className="min-w-[250px]" title={getItemsDisplay(sale.items)}>
                                    {getItemsDisplay(sale.items)}
                                  </TableCell>
                                  <TableCell className="text-right">{getTotalWeight(sale.items)} kg</TableCell>
                                  <TableCell className="text-right">₹{Number(sale.total_amount).toLocaleString()}</TableCell>
                                  <TableCell className="text-right text-success">₹{Number(sale.paid_amount).toLocaleString()}</TableCell>
                                  <TableCell className="text-right">
                                    {Number(sale.balance_amount) > 0 ? (
                                      <Badge variant="destructive">₹{Number(sale.balance_amount).toLocaleString()}</Badge>
                                    ) : (
                                      <Badge className="bg-success text-success-foreground">Paid</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {Number(sale.balance_amount) > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openPaymentDialog(sale.id, 'sale', sale.customer_name, Number(sale.balance_amount))}
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
                                  <span className="text-xs text-muted-foreground ml-2">({used.toLocaleString()} kg sold)</span>
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

        <TabsContent value="loose-retail">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Customer-wise Loose Retail Sales Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer name..."
                    value={looseRetailSearch}
                    onChange={(e) => setLooseRetailSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid gap-4 sm:grid-cols-4 mb-6">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{looseRetailReports.length}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">₹{looseRetailReports.reduce((acc, r) => acc + r.totalAmount, 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-bold text-success">₹{looseRetailReports.reduce((acc, r) => acc + r.paidAmount, 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Pending</p>
                  <p className="text-2xl font-bold text-destructive">₹{looseRetailReports.reduce((acc, r) => acc + r.balanceAmount, 0).toLocaleString()}</p>
                </div>
              </div>

              {filteredLooseRetailReports.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No loose retail sales data found</p>
              ) : (
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredLooseRetailReports.map((report, index) => (
                    <AccordionItem key={index} value={`loose-customer-${index}`} className="border rounded-lg px-4">
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
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.sales.map((sale) => (
                                <TableRow key={sale.id}>
                                  <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy')}</TableCell>
                                  <TableCell className="min-w-[250px]">
                                    {getLooseItemsDisplay(sale.items)}
                                  </TableCell>
                                  <TableCell className="text-right">₹{Number(sale.total_amount).toLocaleString()}</TableCell>
                                  <TableCell className="text-right text-success">₹{Number(sale.paid_amount).toLocaleString()}</TableCell>
                                  <TableCell className="text-right">
                                    {Number(sale.balance_amount) > 0 ? (
                                      <Badge variant="destructive">₹{Number(sale.balance_amount).toLocaleString()}</Badge>
                                    ) : (
                                      <Badge className="bg-success text-success-foreground">Paid</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {Number(sale.balance_amount) > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openPaymentDialog(sale.id, 'loose_sale', sale.customer_name, Number(sale.balance_amount))}
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
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddPaymentDialog
        open={paymentDialog.open}
        onOpenChange={(open) => setPaymentDialog(prev => ({ ...prev, open }))}
        billId={paymentDialog.billId}
        billType={paymentDialog.billType === 'loose_sale' ? 'sale' : paymentDialog.billType}
        partyName={paymentDialog.partyName}
        balanceAmount={paymentDialog.balanceAmount}
        onAddPayment={handleAddPayment}
      />
    </div>
  );
}
