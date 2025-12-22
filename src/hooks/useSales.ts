import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  weight_per_unit: number;
  quantity: number;
  weight: number;
  amount: number;
}

export interface Sale {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  created_at: string;
  items: SaleItem[];
}

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch items for each sale
      const salesWithItems: Sale[] = await Promise.all(
        (sales || []).map(async (sale) => {
          const { data: items, error: itemsError } = await supabase
            .from('sale_items')
            .select('*')
            .eq('sale_id', sale.id);

          if (itemsError) throw itemsError;

          return {
            ...sale,
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

      return salesWithItems;
    },
  });
}

interface CreateSaleInput {
  customer_name: string;
  customer_phone?: string;
  items: {
    product_id: string;
    product_name: string;
    weight_per_unit: number;
    quantity: number;
    amount: number;
  }[];
  paid_amount: number;
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const totalAmount = input.items.reduce((sum, item) => sum + item.amount, 0);
      const balanceAmount = totalAmount - input.paid_amount;

      // Create the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
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

      // Create sale items
      const saleItems = input.items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        weight_per_unit: item.weight_per_unit,
        quantity: item.quantity,
        weight: item.weight_per_unit * item.quantity,
        amount: item.amount,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock (decrease quantity)
      for (const item of input.items) {
        const { data: product } = await supabase
          .from('products')
          .select('quantity, stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const weightToDeduct = item.weight_per_unit * item.quantity;
          await supabase
            .from('products')
            .update({ 
              quantity: product.quantity - item.quantity,
              stock: product.stock - weightToDeduct 
            })
            .eq('id', item.product_id);
        }
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Sale recorded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add sale: ${error.message}`);
    },
  });
}

export function useAddSalePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ saleId, amount, note }: { saleId: string; amount: number; note?: string }) => {
      const { data: sale, error: fetchError } = await supabase
        .from('sales')
        .select('paid_amount, balance_amount')
        .eq('id', saleId)
        .single();

      if (fetchError) throw fetchError;

      const newPaidAmount = Number(sale.paid_amount) + amount;
      const newBalance = Number(sale.balance_amount) - amount;

      // Update sale amounts
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          paid_amount: newPaidAmount,
          balance_amount: Math.max(0, newBalance),
        })
        .eq('id', saleId);

      if (updateError) throw updateError;

      // Record payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          sale_id: saleId,
          amount,
          note: note || null,
        });

      if (paymentError) throw paymentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });
}
