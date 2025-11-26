import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: string;
  billType: 'purchase' | 'sale';
  partyName: string;
  balanceAmount: number;
  onAddPayment: (billId: string, payment: { amount: number; date: Date; note?: string }) => void;
}

export function AddPaymentDialog({
  open,
  onOpenChange,
  billId,
  billType,
  partyName,
  balanceAmount,
  onAddPayment,
}: AddPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paymentAmount > balanceAmount) {
      toast.error(`Amount cannot exceed balance (₹${balanceAmount})`);
      return;
    }

    onAddPayment(billId, {
      amount: paymentAmount,
      date: new Date(),
      note: note.trim() || undefined,
    });

    toast.success('Payment added successfully');
    setAmount('');
    setNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        <div className="bg-muted rounded-lg p-4 mb-4">
          <p className="text-sm text-muted-foreground">
            {billType === 'purchase' ? 'Biller' : 'Customer'}: <span className="font-medium text-foreground">{partyName}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Balance Due: <span className="font-medium text-destructive">₹{balanceAmount.toLocaleString()}</span>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              max={balanceAmount}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Payment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
