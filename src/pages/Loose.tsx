import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackageOpen, Scale, Loader2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useLooseStock, useMakeLoose } from '@/hooks/useLooseStock';
import { toast } from 'sonner';

export default function Loose() {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: looseStock = [], isLoading: looseLoading } = useLooseStock();
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

  if (productsLoading || looseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Loose Stock"
        description="Convert bags to loose quantity for loose selling"
      />

      <div className="grid gap-6 lg:grid-cols-2">
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
    </div>
  );
}
