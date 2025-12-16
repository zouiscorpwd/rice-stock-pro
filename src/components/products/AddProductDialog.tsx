import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { WEIGHT_VARIANTS, WeightVariant } from '@/types/inventory';
import { toast } from 'sonner';

export function AddProductDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [weightPerUnit, setWeightPerUnit] = useState<WeightVariant>(5);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [billerName, setBillerName] = useState('');
  const [billerPhone, setBillerPhone] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const { addProduct } = useInventory();

  const totalStock = weightPerUnit * (Number(quantity) || 0);
  const balanceAmount = (Number(totalAmount) || 0) - (Number(paidAmount) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter product name');
      return;
    }
    if (!billerName.trim()) {
      toast.error('Please enter biller name');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Please enter valid quantity');
      return;
    }
    if (!totalAmount || Number(totalAmount) <= 0) {
      toast.error('Please enter valid total amount');
      return;
    }
    
    addProduct({
      name: name.trim(),
      weightPerUnit,
      quantity: Number(quantity),
      unit,
      billerName: billerName.trim(),
      billerPhone: billerPhone.trim() || undefined,
      totalAmount: Number(totalAmount),
      paidAmount: Number(paidAmount) || 0,
    });
    
    toast.success('Product added successfully');
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setWeightPerUnit(5);
    setQuantity('');
    setUnit('kg');
    setBillerName('');
    setBillerPhone('');
    setTotalAmount('');
    setPaidAmount('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
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

          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weightPerUnit">Weight per Bag (kg) *</Label>
              <Select 
                value={weightPerUnit.toString()} 
                onValueChange={(val) => setWeightPerUnit(Number(val) as WeightVariant)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_VARIANTS.map((w) => (
                    <SelectItem key={w} value={w.toString()}>
                      {w} kg
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (Bags) *</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg"
              />
            </div>
            <div className="space-y-2">
              <Label>Total Stock</Label>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground font-medium">
                {totalStock.toLocaleString()} kg
              </div>
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
                placeholder="0"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount</Label>
              <Input
                id="paidAmount"
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Balance Amount</Label>
              <div className={`h-10 px-3 py-2 rounded-md border border-input font-medium ${balanceAmount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                ₹{balanceAmount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Product</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}