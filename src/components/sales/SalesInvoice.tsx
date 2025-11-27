import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { Sale } from '@/types/inventory';

interface SalesInvoiceProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalesInvoice({ sale, open, onOpenChange }: SalesInvoiceProps) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full">
        <DialogHeader className="print:hidden">
          <DialogTitle>Sales Invoice</DialogTitle>
        </DialogHeader>
        
        <div className="invoice-content space-y-6 p-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary">RiceStock</h1>
            <p className="text-sm text-muted-foreground">Inventory Manager</p>
            <h2 className="text-xl font-semibold mt-4">Sales Invoice</h2>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {sale.customerName}</p>
                {sale.customerPhone && (
                  <p><span className="text-muted-foreground">Phone:</span> {sale.customerPhone}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <h3 className="font-semibold mb-2">Invoice Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Invoice #:</span> {sale.id.slice(0, 8).toUpperCase()}</p>
                <p><span className="text-muted-foreground">Date:</span> {format(new Date(sale.createdAt), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Products Table */}
          <div>
            <h3 className="font-semibold mb-3">Products Details</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-center">Weight/Unit</TableHead>
                  <TableHead className="text-center">Quantity (Bags)</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-center">{item.weightPerUnit} kg</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.weight} kg</TableCell>
                    <TableCell className="text-right">₹{item.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium border-t-2">
                  <TableCell colSpan={4} className="text-right">Total Weight:</TableCell>
                  <TableCell className="text-right">
                    {sale.items.reduce((sum, item) => sum + item.weight, 0)} kg
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold">₹{sale.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg text-success">
              <span className="font-medium">Paid Amount:</span>
              <span className="font-bold">₹{sale.paidAmount.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl">
              <span className="font-semibold">Balance Due:</span>
              <span className={`font-bold ${sale.balanceAmount > 0 ? 'text-destructive' : 'text-success'}`}>
                ₹{sale.balanceAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment History */}
          {sale.payments.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Payment History</h3>
                <div className="space-y-2">
                  {sale.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{format(new Date(payment.date), 'dd/MM/yyyy')}</p>
                        {payment.note && <p className="text-sm text-muted-foreground">{payment.note}</p>}
                      </div>
                      <p className="font-semibold text-success">+₹{payment.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-6 border-t print:mt-12">
            <p>Thank you for your business!</p>
            <p className="mt-1">Generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
