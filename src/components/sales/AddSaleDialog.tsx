import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { toast } from 'sonner';

export function AddSaleDialog() {
  const [open, setOpen] = useState(false);
  const { products, addSale } = useInventory();
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [productId, setProductId] = useState('');
  const [weight, setWeight] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  const selectedProduct = products.find(p => p.id === productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim() || !productId || !weight || !totalAmount) {
      toast.error('Please fill all required fields');
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('Please select a valid product');
      return;
    }

    if (Number(weight) > product.stock) {
      toast.error(`Insufficient stock. Available: ${product.stock} ${product.unit}`);
      return;
    }

    addSale({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      productId,
      productName: product.name,
      weight: Number(weight),
      totalAmount: Number(totalAmount),
      paidAmount: Number(paidAmount) || 0,
    });

    toast.success('Sale recorded successfully');
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setProductId('');
    setWeight('');
    setTotalAmount('');
    setPaidAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Sale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.weightPerUnit}kg - {product.quantity} bags)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Total Weight (kg) *</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter total weight"
                max={selectedProduct?.stock}
              />
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">
                  Available: {selectedProduct.stock} kg ({selectedProduct.quantity} bags × {selectedProduct.weightPerUnit}kg)
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount *</Label>
              <Input
                id="totalAmount"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="₹0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount</Label>
              <Input
                id="paidAmount"
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="₹0"
              />
            </div>
            <div className="space-y-2">
              <Label>Balance</Label>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground">
                ₹{Math.max(0, (Number(totalAmount) || 0) - (Number(paidAmount) || 0))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Sale</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
