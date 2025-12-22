import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCreateSale } from '@/hooks/useSales';
import { toast } from 'sonner';

interface SaleItemForm {
  productId: string;
  productName: string;
  weightPerUnit: number;
  quantity: string;
  pricePerBag: string;
  availableQty: number;
}

const emptyItem: SaleItemForm = {
  productId: '',
  productName: '',
  weightPerUnit: 0,
  quantity: '',
  pricePerBag: '',
  availableQty: 0,
};

export function AddSaleDialog() {
  const [open, setOpen] = useState(false);
  const { data: products = [] } = useProducts();
  const createSale = useCreateSale();
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<SaleItemForm[]>([{ ...emptyItem }]);
  const [paidAmount, setPaidAmount] = useState('');

  const getItemAmount = (item: SaleItemForm) => {
    return (Number(item.pricePerBag) || 0) * (Number(item.quantity) || 0);
  };

  const totalAmount = items.reduce((sum, item) => sum + getItemAmount(item), 0);
  const balance = Math.max(0, totalAmount - (Number(paidAmount) || 0));

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setItems(prev => prev.map((item, i) => 
        i === index ? { 
          ...item, 
          productId, 
          productName: product.name, 
          weightPerUnit: product.weight_per_unit,
          availableQty: product.quantity 
        } : item
      ));
    }
  };

  const handleItemChange = (index: number, field: keyof SaleItemForm, value: string) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    setItems(prev => [...prev, { ...emptyItem }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    const validItems = items.filter(item => item.productId && Number(item.quantity) > 0 && Number(item.pricePerBag) > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    // Check stock availability
    for (const item of validItems) {
      const product = products.find(p => p.id === item.productId);
      if (product && Number(item.quantity) > product.quantity) {
        toast.error(`Insufficient stock for ${item.productName}. Available: ${product.quantity} bags`);
        return;
      }
    }

    createSale.mutate({
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || undefined,
      items: validItems.map(item => ({
        product_id: item.productId,
        product_name: item.productName,
        weight_per_unit: item.weightPerUnit,
        quantity: Number(item.quantity),
        amount: getItemAmount(item),
      })),
      paid_amount: Number(paidAmount) || 0,
    }, {
      onSuccess: () => {
        resetForm();
        setOpen(false);
      }
    });
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setItems([{ ...emptyItem }]);
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="h-3 w-3" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <div key={index} className="p-3 border rounded-lg space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Product *</Label>
                        <Select value={item.productId} onValueChange={(val) => handleProductChange(index, val)}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.weight_per_unit}kg - {p.quantity} bags)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity (Bags) *</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          placeholder="0"
                          className="h-9"
                          min="1"
                          max={product?.quantity}
                        />
                        {product && (
                          <p className="text-xs text-muted-foreground">Available: {product.quantity} bags</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Total Weight</Label>
                        <div className="h-9 px-3 py-2 rounded-md border border-input bg-muted text-sm text-muted-foreground">
                          {item.weightPerUnit && item.quantity ? `${item.weightPerUnit * Number(item.quantity)} kg` : '-'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price/Bag *</Label>
                        <Input
                          type="number"
                          value={item.pricePerBag}
                          onChange={(e) => handleItemChange(index, 'pricePerBag', e.target.value)}
                          placeholder="₹0"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Amount</Label>
                        <div className="h-9 px-3 py-2 rounded-md border border-input bg-muted text-sm text-muted-foreground">
                          ₹{getItemAmount(item).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted font-medium">
                ₹{totalAmount.toLocaleString()}
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
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground">
                ₹{balance.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSale.isPending}>
              {createSale.isPending ? 'Adding...' : 'Add Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
