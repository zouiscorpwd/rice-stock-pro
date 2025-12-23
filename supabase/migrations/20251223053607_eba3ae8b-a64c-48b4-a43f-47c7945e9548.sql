-- Create table for loose stock (when bags are opened for loose selling)
CREATE TABLE public.loose_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  weight_per_unit INTEGER NOT NULL,
  bags_converted INTEGER NOT NULL DEFAULT 0,
  loose_quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loose_stock ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own loose stock"
ON public.loose_stock
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loose stock"
ON public.loose_stock
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loose stock"
ON public.loose_stock
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loose stock"
ON public.loose_stock
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_loose_stock_updated_at
BEFORE UPDATE ON public.loose_stock
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();