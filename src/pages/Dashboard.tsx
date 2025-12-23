import { Package, ShoppingCart, TrendingUp, AlertCircle, TrendingDown, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { usePurchases } from '@/hooks/usePurchases';
import { useSales } from '@/hooks/useSales';
import { useLooseStock } from '@/hooks/useLooseStock';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const { data: products = [] } = useProducts();
  const { data: purchases = [] } = usePurchases();
  const { data: sales = [] } = useSales();
  const { data: looseStock = [] } = useLooseStock();

  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const totalLooseStock = looseStock.reduce((acc, l) => acc + Number(l.loose_quantity), 0);
  const totalPurchaseAmount = purchases.reduce((acc, p) => acc + Number(p.total_amount), 0);
  const totalPurchaseBalance = purchases.reduce((acc, p) => acc + Number(p.balance_amount), 0);
  const totalSalesAmount = sales.reduce((acc, s) => acc + Number(s.total_amount), 0);
  const totalSalesBalance = sales.reduce((acc, s) => acc + Number(s.balance_amount), 0);
  
  // Profit calculation: Sales - Purchases (based on total amounts)
  const profit = totalSalesAmount - totalPurchaseAmount;
  const profitMargin = totalPurchaseAmount > 0 ? ((profit / totalPurchaseAmount) * 100).toFixed(1) : '0';

  const lowStockProducts = products.filter(p => p.quantity <= p.low_stock_alert);
  const recentPurchases = [...purchases].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const recentSales = [...sales].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  // Pie chart data: Sales by product
  const salesByProduct = sales.flatMap(s => s.items || []).reduce((acc, item) => {
    const existing = acc.find(a => a.name === item.product_name);
    if (existing) {
      existing.value += Number(item.amount);
    } else {
      acc.push({ name: item.product_name, value: Number(item.amount) });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Pie chart data: Purchases by product
  const purchasesByProduct = purchases.flatMap(p => p.items || []).reduce((acc, item) => {
    const existing = acc.find(a => a.name === item.product_name);
    if (existing) {
      existing.value += Number(item.amount);
    } else {
      acc.push({ name: item.product_name, value: Number(item.amount) });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Payment status pie charts
  const purchasePaymentData = [
    { name: 'Paid', value: totalPurchaseAmount - totalPurchaseBalance },
    { name: 'Pending', value: totalPurchaseBalance },
  ].filter(d => d.value > 0);

  const salesPaymentData = [
    { name: 'Received', value: totalSalesAmount - totalSalesBalance },
    { name: 'Pending', value: totalSalesBalance },
  ].filter(d => d.value > 0);

  const getItemsSummary = (items: { product_name: string; weight: number }[]) => {
    if (!items || items.length === 0) return 'No items';
    if (items.length === 1) return `${items[0].product_name} - ${items[0].weight} kg`;
    const totalWeight = items.reduce((sum, i) => sum + Number(i.weight), 0);
    return `${items.length} items - ${totalWeight} kg`;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Dashboard" description="Overview of your rice inventory" />
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        <StatCard title="Total Products" value={products.length} icon={<Package className="h-6 w-6" />} />
        <StatCard title="Total Stock" value={`${totalStock.toLocaleString()} kg`} icon={<Package className="h-6 w-6" />} />
        <StatCard title="Loose Stock" value={`${totalLooseStock.toLocaleString()} kg`} icon={<Package className="h-6 w-6" />} />
        <StatCard title="Purchase Payable" value={`₹${totalPurchaseBalance.toLocaleString()}`} icon={<ShoppingCart className="h-6 w-6" />} />
        <StatCard title="Sales Receivable" value={`₹${totalSalesBalance.toLocaleString()}`} icon={<TrendingUp className="h-6 w-6" />} />
        <StatCard 
          title="Profit" 
          value={`₹${Math.abs(profit).toLocaleString()}`} 
          icon={profit >= 0 ? <Wallet className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
          description={profit >= 0 ? `+${profitMargin}% margin` : `${profitMargin}% loss`}
        />
      </div>

      {/* Pie Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4 mb-8">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sales by Product</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByProduct.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No sales data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={salesByProduct}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {salesByProduct.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Purchases by Product</CardTitle>
          </CardHeader>
          <CardContent>
            {purchasesByProduct.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No purchase data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={purchasesByProduct}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {purchasesByProduct.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Purchase Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {purchasePaymentData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No payment data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={purchasePaymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="hsl(var(--chart-2))" />
                    <Cell fill="hsl(var(--destructive))" />
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sales Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {salesPaymentData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No payment data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={salesPaymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="hsl(var(--chart-2))" />
                    <Cell fill="hsl(var(--destructive))" />
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" />Recent Purchases</CardTitle></CardHeader>
          <CardContent>
            {recentPurchases.length === 0 ? <p className="text-muted-foreground text-center py-4">No purchases yet</p> : (
              <div className="space-y-3">
                {recentPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{purchase.biller_name}</p>
                      <p className="text-sm text-muted-foreground">{getItemsSummary(purchase.items)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{Number(purchase.total_amount).toLocaleString()}</p>
                      {Number(purchase.balance_amount) > 0 && <Badge variant="destructive" className="text-xs">Due: ₹{Number(purchase.balance_amount).toLocaleString()}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Recent Sales</CardTitle></CardHeader>
          <CardContent>
            {recentSales.length === 0 ? <p className="text-muted-foreground text-center py-4">No sales yet</p> : (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{sale.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{getItemsSummary(sale.items)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{Number(sale.total_amount).toLocaleString()}</p>
                      {Number(sale.balance_amount) > 0 && <Badge variant="destructive" className="text-xs">Due: ₹{Number(sale.balance_amount).toLocaleString()}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="shadow-card border-warning/50">
          <CardHeader><CardTitle className="flex items-center gap-2 text-warning"><AlertCircle className="h-5 w-5" />Low Stock Alert</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <span className="font-medium">{product.name}</span>
                  <Badge variant="outline" className="border-warning text-warning">{product.quantity} bags</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
