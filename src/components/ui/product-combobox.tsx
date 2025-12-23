import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Product {
  id: string;
  name: string;
  weight_per_unit: number;
  quantity: number;
}

interface ProductComboboxProps {
  products: Product[];
  value: string;
  onSelect: (productId: string) => void;
  placeholder?: string;
  showStock?: boolean;
}

export function ProductCombobox({ 
  products, 
  value, 
  onSelect, 
  placeholder = "Select product...",
  showStock = true 
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const selectedProduct = products.find(p => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 font-normal"
        >
          {selectedProduct ? (
            <span className="truncate">
              {selectedProduct.name} ({selectedProduct.weight_per_unit}kg)
              {showStock && ` - ${selectedProduct.quantity} bags`}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-50" align="start">
        <Command>
          <CommandInput 
            placeholder="Type to search products..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {filteredProducts.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onSelect(product.id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{product.name} ({product.weight_per_unit}kg)</span>
                    {showStock && (
                      <span className="text-xs text-muted-foreground">
                        Available: {product.quantity} bags
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
