-- Drop the existing weight_per_unit check constraint
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_weight_per_unit_check;

-- Add new check constraint with all allowed weight values
ALTER TABLE public.products ADD CONSTRAINT products_weight_per_unit_check 
CHECK (weight_per_unit IN (1, 5, 10, 25, 26, 30, 50, 75));