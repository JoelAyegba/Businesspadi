"use client";

import { useState, useRef, useEffect } from "react";
import { Package, ChevronDown } from "lucide-react";
import type { ProductRow } from "@/lib/queries/products";

type Props = {
  products: ProductRow[];
  value: string;
  onChange: (value: string) => void;
  onSelectProduct: (p: ProductRow) => void;
  id?: string;
  placeholder?: string;
};

export function ProductComboboxInput({ products, value, onChange, onSelectProduct, id, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(value.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(value.toLowerCase()))
  );

  return (
    <div className="relative flex w-full items-center" ref={ref}>
      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (products.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:text-sm"
      />
      {products.length > 0 && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen(!open)}
          className="absolute right-2 px-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {open && products.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-background text-popover-foreground shadow-md">
          <div className="p-1">
            {filtered.length === 0 && (
              <div className="py-3 text-center text-sm text-muted-foreground">
                No matching products
              </div>
            )}
            {filtered.map(p => (
              <div
                key={p.id}
                className="relative flex w-full cursor-pointer select-none flex-col items-start justify-center rounded-sm py-1.5 pl-3 pr-2 text-sm outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectProduct(p);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  <span className="font-medium">{p.name}</span>
                </div>
                {p.description && (
                  <span className="ml-[22px] text-xs text-muted-foreground font-normal line-clamp-1">{p.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
