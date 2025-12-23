import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LooseStock {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  weight_per_unit: number;
  bags_converted: number;
  loose_quantity: number;
  created_at: string;
  updated_at: string;
}

export function useLooseStock() {
  return useQuery({
    queryKey: ['loose_stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loose_stock')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LooseStock[];
    },
  });
}

export function useMakeLoose() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      product_id: string;
      product_name: string;
      weight_per_unit: number;
      bags_quantity: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First reduce the product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', input.product_id)
        .single();

      if (productError) throw productError;
      if (product.quantity < input.bags_quantity) {
        throw new Error('Insufficient stock');
      }

      // Update product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity: product.quantity - input.bags_quantity })
        .eq('id', input.product_id);

      if (updateError) throw updateError;

      // Check if loose stock entry exists
      const { data: existingLoose, error: existingError } = await supabase
        .from('loose_stock')
        .select('*')
        .eq('product_id', input.product_id)
        .eq('user_id', user.id)
        .single();

      const looseQuantity = input.bags_quantity * input.weight_per_unit;

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingLoose) {
        // Update existing loose stock
        const { error: looseUpdateError } = await supabase
          .from('loose_stock')
          .update({
            bags_converted: existingLoose.bags_converted + input.bags_quantity,
            loose_quantity: Number(existingLoose.loose_quantity) + looseQuantity,
          })
          .eq('id', existingLoose.id);

        if (looseUpdateError) throw looseUpdateError;
      } else {
        // Create new loose stock entry
        const { error: insertError } = await supabase
          .from('loose_stock')
          .insert({
            user_id: user.id,
            product_id: input.product_id,
            product_name: input.product_name,
            weight_per_unit: input.weight_per_unit,
            bags_converted: input.bags_quantity,
            loose_quantity: looseQuantity,
          });

        if (insertError) throw insertError;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loose_stock'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Bags converted to loose stock successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to convert to loose stock');
    },
  });
}

export function useReduceLooseStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      loose_stock_id: string;
      quantity_kg: number;
    }) => {
      const { data: looseStock, error: fetchError } = await supabase
        .from('loose_stock')
        .select('*')
        .eq('id', input.loose_stock_id)
        .single();

      if (fetchError) throw fetchError;
      if (Number(looseStock.loose_quantity) < input.quantity_kg) {
        throw new Error('Insufficient loose quantity');
      }

      const { error: updateError } = await supabase
        .from('loose_stock')
        .update({
          loose_quantity: Number(looseStock.loose_quantity) - input.quantity_kg,
        })
        .eq('id', input.loose_stock_id);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loose_stock'] });
      toast.success('Loose stock updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update loose stock');
    },
  });
}
