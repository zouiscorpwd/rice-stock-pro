import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PackageOpen, Scale, Loader2, Receipt } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useLooseStock, useMakeLoose } from '@/hooks/useLooseStock';
import { useLooseSales } from '@/hooks/useLooseSales';
import { AddRetailBillDialog } from '@/components/loose/AddRetailBillDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Loose() {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: looseStock = [], isLoading: looseLoading } = useLooseStock();
  const { data: looseSales = [], isLoading: salesLoading } = useLooseSales();
  const makeLoose = useMakeLoose();

  const [selectedProductId, setSelectedProductId] = useState('');
  const [bagsQuantity, setBagsQuantity] = useState('');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleMakeLoose = () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }
    if (!bagsQuantity || Number(bagsQuantity) < 1) {
      toast.error('Please enter valid bags quantity');
      return;
    }
    if (selectedProduct && Number(bagsQuantity) > selectedProduct.quantity) {
      toast.error(`Insufficient stock. Available: ${selectedProduct.quantity} bags`);
      return;
    }

    makeLoose.mutate({
      product_id: selectedProductId,
      product_name: selectedProduct!.name,
      weight_per_unit: selectedProduct!.weight_per_unit,
      bags_quantity: Number(bagsQuantity),
    }, {
      onSuccess: () => {
        setSelectedProductId('');
        setBagsQuantity('');
      }
    });
  };

  if (productsLoading || looseLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getItemsSummary = (items: { product_name: string; quantity_kg: number }[]) => {
    if (!items || items.length === 0) return 'No items';
    if (items.length === 1) return `${items[0].product_name} - ${items[0].quantity_kg} kg`;
    const totalWeight = items.reduce((sum, i) => sum + Number(i.quantity_kg), 0);
    return `${items.length} items - ${totalWeight} kg`;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Loose Stock"
        description="Convert bags to loose quantity for retail selling"
        action={<AddRetailBillDialog />}
      />

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Make Loose Panel */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageOpen className="h-5 w-5 text-primary" />
              Make Loose
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Product *</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.quantity > 0).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.weight_per_unit}kg) - {product.quantity} bags
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bags Quantity *</Label>
              <Input
                type="number"
                min="1"
                max={selectedProduct?.quantity || 1}
                value={bagsQuantity}
                onChange={(e) => setBagsQuantity(e.target.value)}
                placeholder="Enter number of bags to convert"
              />
              {selectedProduct && bagsQuantity && (
                <p className="text-sm text-muted-foreground">
                  This will add {Number(bagsQuantity) * selectedProduct.weight_per_unit} kg to loose stock
                </p>
              )}
            </div>

            <Button 
              onClick={handleMakeLoose} 
              disabled={makeLoose.isPending || !selectedProductId || !bagsQuantity}
              className="w-full"
            >
              {makeLoose.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Converting...
                </>
              ) : (
                <>
                  <PackageOpen className="h-4 w-4 mr-2" />
                  Make Loose
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Current Loose Stock Panel */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Current Loose Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {looseStock.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No loose stock available</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Weight/Unit</TableHead>
                    <TableHead className="text-center">Bags Converted</TableHead>
                    <TableHead className="text-right">Loose Qty (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {looseStock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-center">{item.weight_per_unit} kg</TableCell>
                      <TableCell className="text-center">{item.bags_converted}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {Number(item.loose_quantity).toLocaleString()} kg
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Retail Sales History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Retail Sales (Loose)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {looseSales.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No retail sales yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {looseSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sale.customer_name}</p>
                        {sale.customer_phone && (
                          <p className="text-xs text-muted-foreground">{sale.customer_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getItemsSummary(sale.items)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{Number(sale.total_amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      ₹{Number(sale.paid_amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(sale.balance_amount) > 0 ? (
                        <Badge variant="destructive">₹{Number(sale.balance_amount).toLocaleString()}</Badge>
                      ) : (
                        <Badge className="bg-success text-success-foreground">Paid</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
