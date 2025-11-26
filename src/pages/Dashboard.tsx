import { Package, ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { useInventory } from '@/context/InventoryContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { products, purchases, sales } = useInventory();

  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const totalPurchaseValue = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalSalesValue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalPurchaseBalance = purchases.reduce((acc, p) => acc + p.balanceAmount, 0);
  const totalSalesBalance = sales.reduce((acc, s) => acc + s.balanceAmount, 0);

  const lowStockProducts = products.filter(p => p.stock < 100);
  const recentPurchases = [...purchases].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);
  const recentSales = [...sales].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        description="Overview of your rice inventory"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Products"
          value={products.length}
          icon={<Package className="h-6 w-6" />}
        />
        <StatCard
          title="Total Stock"
          value={`${totalStock.toLocaleString()} kg`}
          icon={<Package className="h-6 w-6" />}
        />
        <StatCard
          title="Purchase Payable"
          value={`₹${totalPurchaseBalance.toLocaleString()}`}
          icon={<ShoppingCart className="h-6 w-6" />}
        />
        <StatCard
          title="Sales Receivable"
          value={`₹${totalSalesBalance.toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Recent Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPurchases.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No purchases yet</p>
            ) : (
              <div className="space-y-3">
                {recentPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{purchase.billerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {purchase.productName} - {purchase.weight} kg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{purchase.totalAmount.toLocaleString()}</p>
                      {purchase.balanceAmount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Due: ₹{purchase.balanceAmount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No sales yet</p>
            ) : (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{sale.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.productName} - {sale.weight} kg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{sale.totalAmount.toLocaleString()}</p>
                      {sale.balanceAmount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Due: ₹{sale.balanceAmount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="shadow-card border-warning/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <span className="font-medium">{product.name}</span>
                  <Badge variant="outline" className="border-warning text-warning">
                    {product.stock} {product.unit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
