import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, Package, Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Products() {
  const { data: products = [], isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();
  const [search, setSearch] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    deleteProduct.mutate(id);
  };

  const getStockBadge = (quantity: number, lowStockAlert: number) => {
    if (quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (quantity <= lowStockAlert) return <Badge className="bg-warning text-warning-foreground">Low Stock</Badge>;
    return <Badge className="bg-success text-success-foreground">In Stock</Badge>;
  };
  
  const lowStockProducts = products.filter(p => p.quantity <= p.low_stock_alert);

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
        title="Products"
        description="Manage your rice products inventory"
        action={<AddProductDialog />}
      />

      {lowStockProducts.length > 0 && (
        <Card className="mb-6 border-warning bg-warning/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-warning">Low Stock Alert</p>
                <p className="text-sm text-muted-foreground">
                  {lowStockProducts.length} product(s) running low: {lowStockProducts.map(p => p.name).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Weight/Bag</TableHead>
                    <TableHead className="text-right">Quantity (Bags)</TableHead>
                    <TableHead className="text-right">Total Stock (kg)</TableHead>
                    <TableHead className="text-right">Low Stock Alert (Bags)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.weight_per_unit} kg</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {product.quantity <= product.low_stock_alert && product.quantity > 0 && (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                          <span className={product.quantity <= product.low_stock_alert ? 'text-warning font-medium' : ''}>
                            {product.quantity.toLocaleString()} bags
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{product.stock.toLocaleString()} {product.unit}</TableCell>
                      <TableCell className="text-right">{product.low_stock_alert.toLocaleString()} bags</TableCell>
                      <TableCell>{getStockBadge(product.quantity, product.low_stock_alert)}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(product.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
