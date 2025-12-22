import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PurchaseItem {
  id: string;
  product_id: string;
  product_name: string;
  weight_per_unit: number;
  quantity: number;
  weight: number;
  amount: number;
}

export interface Purchase {
  id: string;
  biller_name: string;
  biller_phone: string | null;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  created_at: string;
  items: PurchaseItem[];
}

export function usePurchases() {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch items for each purchase
      const purchasesWithItems: Purchase[] = await Promise.all(
        (purchases || []).map(async (purchase) => {
          const { data: items, error: itemsError } = await supabase
            .from('purchase_items')
            .select('*')
            .eq('purchase_id', purchase.id);

          if (itemsError) throw itemsError;

          return {
            ...purchase,
            items: (items || []).map(item => ({
              id: item.id,
              product_id: item.product_id,
              product_name: item.product_name,
              weight_per_unit: item.weight_per_unit,
              quantity: item.quantity,
              weight: Number(item.weight),
              amount: Number(item.amount),
            })),
          };
        })
      );

      return purchasesWithItems;
    },
  });
}

interface CreatePurchaseInput {
  biller_name: string;
  biller_phone?: string;
  items: {
    product_id: string;
    product_name: string;
    weight_per_unit: number;
    quantity: number;
    amount: number;
  }[];
  paid_amount: number;
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePurchaseInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const totalAmount = input.items.reduce((sum, item) => sum + item.amount, 0);
      const balanceAmount = totalAmount - input.paid_amount;

      // Create the purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          biller_name: input.biller_name,
          biller_phone: input.biller_phone || null,
          total_amount: totalAmount,
          paid_amount: input.paid_amount,
          balance_amount: balanceAmount,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create purchase items
      const purchaseItems = input.items.map(item => ({
        purchase_id: purchase.id,
        product_id: item.product_id,
        product_name: item.product_name,
        weight_per_unit: item.weight_per_unit,
        quantity: item.quantity,
        weight: item.weight_per_unit * item.quantity,
        amount: item.amount,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      // Update product stock (increase quantity)
      for (const item of input.items) {
        const { data: product } = await supabase
          .from('products')
          .select('quantity, stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const weightToAdd = item.weight_per_unit * item.quantity;
          await supabase
            .from('products')
            .update({ 
              quantity: product.quantity + item.quantity,
              stock: product.stock + weightToAdd 
            })
            .eq('id', item.product_id);
        }
      }

      return purchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Purchase added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add purchase: ${error.message}`);
    },
  });
}

export function useAddPurchasePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ purchaseId, amount, note }: { purchaseId: string; amount: number; note?: string }) => {
      const { data: purchase, error: fetchError } = await supabase
        .from('purchases')
        .select('paid_amount, balance_amount')
        .eq('id', purchaseId)
        .single();

      if (fetchError) throw fetchError;

      const newPaidAmount = Number(purchase.paid_amount) + amount;
      const newBalance = Number(purchase.balance_amount) - amount;

      // Update purchase amounts
      const { error: updateError } = await supabase
        .from('purchases')
        .update({
          paid_amount: newPaidAmount,
          balance_amount: Math.max(0, newBalance),
        })
        .eq('id', purchaseId);

      if (updateError) throw updateError;

      // Record payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          purchase_id: purchaseId,
          amount,
          note: note || null,
        });

      if (paymentError) throw paymentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });
}
