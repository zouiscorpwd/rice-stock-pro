import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LooseSaleItem {
  id: string;
  loose_sale_id: string;
  loose_stock_id: string;
  product_name: string;
  quantity_kg: number;
  price_per_kg: number;
  amount: number;
  created_at: string;
}

export interface LooseSale {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  created_at: string;
  updated_at: string;
  items: LooseSaleItem[];
}

export function useLooseSales() {
  return useQuery({
    queryKey: ['loose_sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loose_sales')
        .select(`
          *,
          items:loose_sale_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LooseSale[];
    },
  });
}

interface CreateLooseSaleInput {
  customer_name: string;
  customer_phone?: string;
  items: {
    loose_stock_id: string;
    product_name: string;
    quantity_kg: number;
    price_per_kg: number;
  }[];
  paid_amount: number;
}

export function useCreateLooseSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLooseSaleInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const totalAmount = input.items.reduce(
        (sum, item) => sum + item.quantity_kg * item.price_per_kg,
        0
      );
      const balanceAmount = Math.max(0, totalAmount - input.paid_amount);

      // Verify stock availability
      for (const item of input.items) {
        const { data: stock, error: stockError } = await supabase
          .from('loose_stock')
          .select('loose_quantity')
          .eq('id', item.loose_stock_id)
          .single();

        if (stockError) throw stockError;
        if (Number(stock.loose_quantity) < item.quantity_kg) {
          throw new Error(`Insufficient loose stock for ${item.product_name}`);
        }
      }

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('loose_sales')
        .insert({
          user_id: user.id,
          customer_name: input.customer_name,
          customer_phone: input.customer_phone || null,
          total_amount: totalAmount,
          paid_amount: input.paid_amount,
          balance_amount: balanceAmount,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items and reduce loose stock
      for (const item of input.items) {
        const amount = item.quantity_kg * item.price_per_kg;

        const { error: itemError } = await supabase
          .from('loose_sale_items')
          .insert({
            loose_sale_id: sale.id,
            loose_stock_id: item.loose_stock_id,
            product_name: item.product_name,
            quantity_kg: item.quantity_kg,
            price_per_kg: item.price_per_kg,
            amount,
          });

        if (itemError) throw itemError;

        // Reduce loose stock
        const { data: currentStock } = await supabase
          .from('loose_stock')
          .select('loose_quantity')
          .eq('id', item.loose_stock_id)
          .single();

        if (currentStock) {
          await supabase
            .from('loose_stock')
            .update({
              loose_quantity: Number(currentStock.loose_quantity) - item.quantity_kg,
            })
            .eq('id', item.loose_stock_id);
        }
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loose_sales'] });
      queryClient.invalidateQueries({ queryKey: ['loose_stock'] });
      toast.success('Retail bill created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create retail bill');
    },
  });
}

export function useAddLooseSalePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { sale_id: string; amount: number; note?: string }) => {
      const { data: sale, error: fetchError } = await supabase
        .from('loose_sales')
        .select('paid_amount, balance_amount')
        .eq('id', input.sale_id)
        .single();

      if (fetchError) throw fetchError;

      const newPaidAmount = Number(sale.paid_amount) + input.amount;
      const newBalanceAmount = Math.max(0, Number(sale.balance_amount) - input.amount);

      const { error: updateError } = await supabase
        .from('loose_sales')
        .update({
          paid_amount: newPaidAmount,
          balance_amount: newBalanceAmount,
        })
        .eq('id', input.sale_id);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loose_sales'] });
      toast.success('Payment added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add payment');
    },
  });
}
