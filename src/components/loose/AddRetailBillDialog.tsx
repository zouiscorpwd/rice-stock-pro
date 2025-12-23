import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Receipt } from 'lucide-react';
import { useLooseStock, LooseStock } from '@/hooks/useLooseStock';
import { useCreateLooseSale } from '@/hooks/useLooseSales';
import { toast } from 'sonner';

interface SaleItemForm {
  looseStockId: string;
  productName: string;
  quantityKg: string;
  pricePerKg: string;
  availableQty: number;
}

const emptyItem: SaleItemForm = {
  looseStockId: '',
  productName: '',
  quantityKg: '',
  pricePerKg: '',
  availableQty: 0,
};

export function AddRetailBillDialog() {
  const [open, setOpen] = useState(false);
  const { data: looseStock = [] } = useLooseStock();
  const createLooseSale = useCreateLooseSale();
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<SaleItemForm[]>([{ ...emptyItem }]);
  const [paidAmount, setPaidAmount] = useState('');

  const availableLooseStock = looseStock.filter(l => Number(l.loose_quantity) > 0);

  const getItemAmount = (item: SaleItemForm) => {
    return (Number(item.pricePerKg) || 0) * (Number(item.quantityKg) || 0);
  };

  const totalAmount = items.reduce((sum, item) => sum + getItemAmount(item), 0);
  const balance = Math.max(0, totalAmount - (Number(paidAmount) || 0));

  const handleProductChange = (index: number, looseStockId: string) => {
    const stock = looseStock.find(l => l.id === looseStockId);
    if (stock) {
      setItems(prev => prev.map((item, i) => 
        i === index ? { 
          ...item, 
          looseStockId, 
          productName: stock.product_name, 
          availableQty: Number(stock.loose_quantity)
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

    const validItems = items.filter(item => 
      item.looseStockId && Number(item.quantityKg) > 0 && Number(item.pricePerKg) > 0
    );
    
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    // Check stock availability
    for (const item of validItems) {
      if (Number(item.quantityKg) > item.availableQty) {
        toast.error(`Insufficient stock for ${item.productName}. Available: ${item.availableQty} kg`);
        return;
      }
    }

    createLooseSale.mutate({
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || undefined,
      items: validItems.map(item => ({
        loose_stock_id: item.looseStockId,
        product_name: item.productName,
        quantity_kg: Number(item.quantityKg),
        price_per_kg: Number(item.pricePerKg),
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
          <Receipt className="h-4 w-4" />
          Retail Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Retail Bill (Loose)</DialogTitle>
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
              {items.map((item, index) => (
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
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Product *</Label>
                      <Select value={item.looseStockId} onValueChange={(val) => handleProductChange(index, val)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableLooseStock.map((stock) => (
                            <SelectItem key={stock.id} value={stock.id}>
                              {stock.product_name} ({Number(stock.loose_quantity).toFixed(1)} kg)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Quantity (kg) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={item.quantityKg}
                        onChange={(e) => handleItemChange(index, 'quantityKg', e.target.value)}
                        placeholder="0"
                        className="h-9"
                        min="0.1"
                        max={item.availableQty}
                      />
                      {item.looseStockId && (
                        <p className="text-xs text-muted-foreground">Available: {item.availableQty.toFixed(1)} kg</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price/kg *</Label>
                      <Input
                        type="number"
                        value={item.pricePerKg}
                        onChange={(e) => handleItemChange(index, 'pricePerKg', e.target.value)}
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
              ))}
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
            <Button type="submit" disabled={createLooseSale.isPending}>
              {createLooseSale.isPending ? 'Creating...' : 'Create Bill'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
