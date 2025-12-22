import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCreatePurchase } from '@/hooks/usePurchases';
import { toast } from 'sonner';

interface ItemInput {
  productId: string;
  quantity: number;
  pricePerBag: number;
}

export function AddPurchaseDialog() {
  const [open, setOpen] = useState(false);
  const { data: products = [] } = useProducts();
  const createPurchase = useCreatePurchase();
  
  const [billerName, setBillerName] = useState('');
  const [billerPhone, setBillerPhone] = useState('');
  const [items, setItems] = useState<ItemInput[]>([{ productId: '', quantity: 0, pricePerBag: 0 }]);
  const [paidAmount, setPaidAmount] = useState('');

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 0, pricePerBag: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ItemInput, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const getItemAmount = (item: ItemInput) => {
    return (Number(item.pricePerBag) || 0) * (Number(item.quantity) || 0);
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + getItemAmount(item), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!billerName.trim()) {
      toast.error('Please enter biller name');
      return;
    }

    const validItems = items.filter(item => item.productId && item.quantity > 0 && item.pricePerBag > 0);
    
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    createPurchase.mutate({
      biller_name: billerName.trim(),
      biller_phone: billerPhone.trim() || undefined,
      items: validItems.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        return {
          product_id: item.productId,
          product_name: product.name,
          weight_per_unit: product.weight_per_unit,
          quantity: item.quantity,
          amount: getItemAmount(item),
        };
      }),
      paid_amount: Number(paidAmount) || 0,
    }, {
      onSuccess: () => {
        resetForm();
        setOpen(false);
      }
    });
  };

  const resetForm = () => {
    setBillerName('');
    setBillerPhone('');
    setItems([{ productId: '', quantity: 0, pricePerBag: 0 }]);
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="h-3 w-3" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => {
              const selectedProduct = products.find(p => p.id === item.productId);
              const totalWeight = selectedProduct ? selectedProduct.weight_per_unit * item.quantity : 0;

              return (
                <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => removeItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label>Product *</Label>
                      <Select 
                        value={item.productId} 
                        onValueChange={(value) => updateItem(index, 'productId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.weight_per_unit}kg)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantity (Bags) *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        placeholder="0"
                      />
                      {selectedProduct && item.quantity > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Weight: {totalWeight} kg
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Price/Bag *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.pricePerBag || ''}
                        onChange={(e) => updateItem(index, 'pricePerBag', Number(e.target.value))}
                        placeholder="₹0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground text-sm">
                        ₹{getItemAmount(item).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground font-medium">
                ₹{getTotalAmount().toLocaleString()}
              </div>
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
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground font-medium">
                ₹{Math.max(0, getTotalAmount() - (Number(paidAmount) || 0)).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPurchase.isPending}>
              {createPurchase.isPending ? 'Adding...' : 'Add Purchase'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
