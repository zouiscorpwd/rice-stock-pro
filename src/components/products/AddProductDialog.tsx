import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useCreateProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';

const WEIGHT_VARIANTS = [1, 5, 10, 25, 26, 30, 50, 75] as const;

export function AddProductDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [weightPerUnit, setWeightPerUnit] = useState<number>(5);
  const [lowStockAlert, setLowStockAlert] = useState('');
  
  const createProduct = useCreateProduct();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter product name');
      return;
    }
    if (!lowStockAlert || Number(lowStockAlert) < 0) {
      toast.error('Please enter valid low stock alert value');
      return;
    }
    
    createProduct.mutate({
      name: name.trim(),
      weight_per_unit: weightPerUnit,
      low_stock_alert: Number(lowStockAlert),
    }, {
      onSuccess: () => {
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setName('');
    setWeightPerUnit(5);
    setLowStockAlert('');
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weightPerUnit">Weight per Bag (kg) *</Label>
            <Select 
              value={weightPerUnit.toString()} 
              onValueChange={(val) => setWeightPerUnit(Number(val))}
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
            <Label htmlFor="lowStockAlert">Low Stock Alert (bags) *</Label>
            <Input
              id="lowStockAlert"
              type="number"
              value={lowStockAlert}
              onChange={(e) => setLowStockAlert(e.target.value)}
              placeholder="Alert when bag count falls below this value"
              min="0"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProduct.isPending}>
              {createProduct.isPending ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
