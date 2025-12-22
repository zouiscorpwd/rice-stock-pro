-- Add low_stock_alert column to products table
ALTER TABLE public.products ADD COLUMN low_stock_alert integer NOT NULL DEFAULT 0;