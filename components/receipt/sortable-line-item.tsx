"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/utils";

import type { ProductRow } from "@/lib/queries/products";
import { ProductComboboxInput } from "@/components/receipt/product-combobox-input";

export type LineItemDraft = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

type Props = {
  item: LineItemDraft;
  index: number;
  products?: ProductRow[];
  currency: string;
  subtotal: number;
  isRemovable: boolean;
  onUpdate: (id: string, patch: Partial<LineItemDraft>) => void;
  onRemove: (id: string) => void;
};

export function SortableLineItem({
  item,
  index,
  products = [],
  currency,
  subtotal,
  isRemovable,
  onUpdate,
  onRemove,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group grid grid-cols-12 gap-2 rounded-xl border border-border/60 bg-surface/50 p-3 transition-all duration-200 hover:border-border hover:bg-surface sm:gap-3 sm:p-4"
    >
      <div className="col-span-12 flex flex-col gap-1.5 sm:col-span-6 relative">
        <Label htmlFor={`desc-${item.id}`} className="text-xs flex items-center gap-1.5">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground -ml-1 p-0.5"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          Description
        </Label>
        <ProductComboboxInput
          id={`desc-${item.id}`}
          products={products}
          value={item.description}
          onChange={(value) => onUpdate(item.id, { description: value })}
          onSelectProduct={(p) => {
            onUpdate(item.id, {
              description: p.name + (p.description ? ` — ${p.description}` : ""),
              unitPrice: p.unitPrice.toString(),
            });
          }}
          placeholder="e.g. Logo design"
        />
      </div>
      <div className="col-span-4 flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={`qty-${item.id}`} className="text-xs">
          Qty
        </Label>
        <Input
          id={`qty-${item.id}`}
          type="number"
          inputMode="decimal"
          min="0"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, { quantity: e.target.value })}
          className="text-right tabular-nums"
        />
      </div>
      <div className="col-span-5 flex flex-col gap-1.5 sm:col-span-3">
        <Label htmlFor={`unit-${item.id}`} className="text-xs">
          Unit price
        </Label>
        <Input
          id={`unit-${item.id}`}
          type="number"
          inputMode="decimal"
          min="0"
          value={item.unitPrice}
          onChange={(e) => onUpdate(item.id, { unitPrice: e.target.value })}
          className="text-right tabular-nums"
          placeholder="0.00"
        />
      </div>
      <div className="col-span-3 flex items-end justify-between gap-2 sm:col-span-1 sm:justify-end">
        {/* Row subtotal */}
        <span className="mb-2.5 text-xs font-medium tabular-nums text-muted-foreground sm:hidden">
          {formatMoney(subtotal || 0, currency)}
        </span>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={!isRemovable}
          aria-label={`Remove line ${index + 1}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
