-- Create table for loose sales (retail billing)
CREATE TABLE public.loose_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  balance_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for loose sale items
CREATE TABLE public.loose_sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loose_sale_id UUID NOT NULL REFERENCES public.loose_sales(id) ON DELETE CASCADE,
  loose_stock_id UUID NOT NULL REFERENCES public.loose_stock(id),
  product_name TEXT NOT NULL,
  quantity_kg NUMERIC NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loose_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loose_sale_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for loose_sales
CREATE POLICY "Users can view own loose sales"
ON public.loose_sales FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loose sales"
ON public.loose_sales FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loose sales"
ON public.loose_sales FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loose sales"
ON public.loose_sales FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for loose_sale_items
CREATE POLICY "Users can view own loose sale items"
ON public.loose_sale_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.loose_sales
  WHERE loose_sales.id = loose_sale_items.loose_sale_id
  AND loose_sales.user_id = auth.uid()
));

CREATE POLICY "Users can insert own loose sale items"
ON public.loose_sale_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.loose_sales
  WHERE loose_sales.id = loose_sale_items.loose_sale_id
  AND loose_sales.user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_loose_sales_updated_at
BEFORE UPDATE ON public.loose_sales
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();