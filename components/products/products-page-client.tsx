"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Plus,
  Search,
  Package,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Check,
  Loader2,
  Tag,
  DollarSign,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/utils";
import type { ProductRow } from "@/lib/queries/products";
import {
  createProduct,
  updateProduct,
  toggleProductActive,
  deleteProduct,
  type ProductFormData,
} from "@/app/app/products/actions";
import { useRouter } from "next/navigation";

type Props = {
  initialProducts: ProductRow[];
  currency: string;
};

export function ProductsPageClient({ initialProducts, currency }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return initialProducts.filter((p) => {
      if (!showInactive && !p.active) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [initialProducts, search, showInactive]);

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteProduct(id);
      setDeleteConfirm(null);
      router.refresh();
    });
  };

  const handleToggle = (id: string, active: boolean) => {
    startTransition(async () => {
      await toggleProductActive(id, active);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[28px] sm:leading-tight">
            My Products
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your catalog. Products are available when creating receipts and invoices.
          </p>
        </div>
        <Button
          className="gap-2 bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" /> Add product
        </Button>
      </header>

      {/* ─── Search & Filters ────────────────────────────────── */}
      <div className="animate-fade-in-delay-1 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowInactive(!showInactive)}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-slate-500 transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Archive className="h-3 w-3" />
            {showInactive ? "Hide inactive" : "Show inactive"}
          </button>
        </div>
      </div>

      {/* ─── Products Grid ───────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="animate-fade-in-delay-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-16 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Package className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            {initialProducts.length === 0 ? "No products yet" : "No matching products"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {initialProducts.length === 0
              ? "Add your first product or service to start building your catalog."
              : "Try adjusting your search or filters."}
          </p>
          {initialProducts.length === 0 && (
            <Button
              className="mt-4 gap-2 bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4" /> Add your first product
            </Button>
          )}
        </div>
      ) : (
        <div className="animate-fade-in-delay-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <Card
              key={product.id}
              className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                !product.active
                  ? "border-slate-200/50 bg-slate-50/50 opacity-60 dark:border-slate-800/50 dark:bg-slate-900/30"
                  : "border-slate-200/60 hover:border-blue-500/30 dark:border-slate-800 dark:hover:border-blue-500/20"
              }`}
            >
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {product.name}
                      </h3>
                      {!product.active && (
                        <Badge variant="muted" className="shrink-0 text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {product.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {product.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-extrabold tabular-nums text-slate-900 dark:text-white">
                      {formatMoney(product.unitPrice, currency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {product.sku && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <Tag className="h-2.5 w-2.5" /> {product.sku}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    onClick={() => setEditingProduct(product)}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    onClick={() => handleToggle(product.id, !product.active)}
                    disabled={isPending}
                  >
                    {product.active ? (
                      <>
                        <ToggleRight className="h-3 w-3" /> Deactivate
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-3 w-3" /> Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-8 gap-1.5 text-xs text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                    onClick={() => setDeleteConfirm(product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Create / Edit Dialog ────────────────────────────── */}
      <ProductDialog
        open={isCreateOpen || !!editingProduct}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        currency={currency}
      />

      {/* ─── Delete Confirmation ─────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The product will be permanently removed from your
              catalog. Consider deactivating it instead if you want to keep it for reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Product Create/Edit Dialog ───────────────────────────────────────────

function ProductDialog({
  open,
  onClose,
  product,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  product: ProductRow | null;
  currency: string;
}) {
  const router = useRouter();
  const isEdit = !!product;
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Sync form with product when it changes
  const resetForm = () => {
    if (product) {
      setName(product.name);
      setDescription(product.description ?? "");
      setUnitPrice(product.unitPrice.toString());
    } else {
      setName("");
      setDescription("");
      setUnitPrice("");
    }
    setErrors({});
  };

  // Use effect-like pattern with key
  const [lastProduct, setLastProduct] = useState<string | null>(null);
  const productKey = product?.id ?? (open ? "create" : null);
  if (productKey !== lastProduct) {
    setLastProduct(productKey);
    if (productKey) resetForm();
  }

  const handleSubmit = () => {
    const price = parseFloat(unitPrice);
    if (!name.trim()) {
      setErrors({ name: ["Product name is required"] });
      return;
    }
    if (isNaN(price) || price < 0) {
      setErrors({ unitPrice: ["Enter a valid price"] });
      return;
    }

    const data: ProductFormData = {
      name: name.trim(),
      description: description.trim() || undefined,
      unitPrice: price,
    };

    startTransition(async () => {
      setErrors({});
      let result;
      if (isEdit && product) {
        result = await updateProduct(product.id, data);
      } else {
        result = await createProduct(data);
      }

      if (result.ok) {
        onClose();
        router.refresh();
      } else if ("error" in result && result.error) {
        setErrors(result.error as Record<string, string[]>);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update product details. Changes apply to future receipts only."
              : "Add a product or service to your catalog. You can select it when creating receipts and invoices."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="productName">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="productName"
              placeholder="e.g. Logo Design Package"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="productDesc">Description</Label>
            <Input
              id="productDesc"
              placeholder="Brief description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="productPrice">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Unit price ({currency}){" "}
                <span className="text-destructive">*</span>
              </span>
            </Label>
            <Input
              id="productPrice"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="text-right font-mono tabular-nums"
            />
            {errors.unitPrice && <p className="text-xs text-destructive">{errors.unitPrice[0]}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className="gap-1.5 bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isEdit ? "Save changes" : "Add product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
