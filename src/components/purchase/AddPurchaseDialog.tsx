import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { toast } from 'sonner';

export function AddPurchaseDialog() {
  const [open, setOpen] = useState(false);
  const { products, addPurchase } = useInventory();
  
  const [billerName, setBillerName] = useState('');
  const [billerPhone, setBillerPhone] = useState('');
  const [productId, setProductId] = useState('');
  const [weight, setWeight] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!billerName.trim() || !productId || !weight || !totalAmount) {
      toast.error('Please fill all required fields');
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('Please select a valid product');
      return;
    }

    addPurchase({
      billerName: billerName.trim(),
      billerPhone: billerPhone.trim(),
      productId,
      productName: product.name,
      weight: Number(weight),
      totalAmount: Number(totalAmount),
      paidAmount: Number(paidAmount) || 0,
    });

    toast.success('Purchase added successfully');
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setBillerName('');
    setBillerPhone('');
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
          Add Purchase
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Purchase</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billerName">Biller Name *</Label>
              <Input
                id="billerName"
                value={billerName}
                onChange={(e) => setBillerName(e.target.value)}
                placeholder="Enter biller name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billerPhone">Biller Phone</Label>
              <Input
                id="billerPhone"
                value={billerPhone}
                onChange={(e) => setBillerPhone(e.target.value)}
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
                      {product.name} ({product.weightPerUnit}kg bags)
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
              />
              {productId && products.find(p => p.id === productId) && (
                <p className="text-xs text-muted-foreground">
                  ≈ {Math.ceil(Number(weight || 0) / (products.find(p => p.id === productId)?.weightPerUnit || 1))} bags
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
            <Button type="submit">Add Purchase</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
