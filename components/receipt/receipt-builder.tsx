"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Send,
  Link2,
  Save,
  Mail,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReceiptDocument } from "@/components/receipt/receipt-document";
import { TemplateSelector } from "@/components/receipt/template-selector";
import { EmailSendButton } from "@/components/receipt/email-send-button";
import { ClientCombobox } from "@/components/receipt/client-combobox";
import { SortableLineItem, type LineItemDraft } from "@/components/receipt/sortable-line-item";
import { ProductPicker } from "@/components/receipt/product-picker";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { DocumentType, MockReceipt, MockBusiness, MockClient } from "@/lib/mock";
import type { ProductRow } from "@/lib/queries/products";
import { cn, formatMoney } from "@/lib/utils";
import { saveReceipt, updateReceipt } from "@/app/app/receipts/actions";

/** User-facing copy that differs between receipts and invoices. */
const DOC_COPY: Record<DocumentType, { noun: string; listName: string; basePath: string; issueCta: string; detailsHint: string; lineItemsHint: string }> = {
  RECEIPT: {
    noun: "receipt",
    listName: "All receipts",
    basePath: "/app/receipts",
    issueCta: "Issue receipt",
    detailsHint: "Basic receipt information",
    lineItemsHint: "Add products or services to this receipt",
  },
  INVOICE: {
    noun: "invoice",
    listName: "All invoices",
    basePath: "/app/invoices",
    issueCta: "Issue invoice",
    detailsHint: "Basic invoice information",
    lineItemsHint: "Add products or services to this invoice",
  },
};

const today = () => new Date().toISOString().slice(0, 10);
const newId = () => Math.random().toString(36).slice(2, 10);

const blankLine = (): LineItemDraft => ({
  id: newId(),
  description: "",
  quantity: "1",
  unitPrice: "",
});

function toNumber(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Receipt Builder — the core creation experience.
 *
 * Design decisions:
 * - Two-column layout (60/40) on desktop: form left, live preview right
 * - Preview panel is sticky so it remains visible while scrolling the form
 * - Toolbar above preview with PDF, Email, and Copy Link quick actions
 * - Line items use a clean card-per-row pattern with inline remove
 * - Running totals section shows subtotal/tax/discount/total in real-time
 * - Sticky bottom action bar with total always visible
 * - Mobile: full-screen sheet overlay for preview toggle
 * - All inputs have visible labels for accessibility
 */
export function ReceiptBuilder({
  business,
  clients,
  products = [],
  defaultClientId,
  initialReceipt,
  documentType = "RECEIPT",
}: {
  business: MockBusiness;
  clients: MockClient[];
  products?: ProductRow[];
  defaultClientId: string | null;
  initialReceipt?: MockReceipt;
  documentType?: DocumentType;
}) {
  const router = useRouter();
  const isInvoice = documentType === "INVOICE";
  const copy = DOC_COPY[documentType];
  const [issueDate, setIssueDate] = useState(initialReceipt?.issueDate ?? today());
  const [dueDate, setDueDate] = useState(initialReceipt?.dueDate ?? "");
  const [paymentTerms, setPaymentTerms] = useState(initialReceipt?.paymentTerms ?? "");
  const [clientId, setClientId] = useState<string>(initialReceipt?.clientId ?? defaultClientId ?? "");
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [currency, setCurrency] = useState(initialReceipt?.currency ?? business.defaultCurrency);
  const [taxRate, setTaxRate] = useState(initialReceipt?.taxRate?.toString() ?? "7.5");
  const [taxEnabled, setTaxEnabled] = useState((initialReceipt?.taxRate ?? 7.5) > 0);
  const [discount, setDiscount] = useState(initialReceipt?.discountValue?.toString() ?? "0");
  const [notes, setNotes] = useState(initialReceipt?.notes ?? "");
  const [lines, setLines] = useState<LineItemDraft[]>(
    initialReceipt?.lineItems?.length
      ? initialReceipt.lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        quantity: li.quantity.toString(),
        unitPrice: li.unitPrice.toString(),
      }))
      : [blankLine()]
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [templateId, setTemplateId] = useState(initialReceipt?.templateId ?? "classic");

  const totals = useMemo(() => {
    const itemSubtotals = lines.map((li) => toNumber(li.quantity) * toNumber(li.unitPrice));
    const subtotal = itemSubtotals.reduce((a, b) => a + b, 0);
    const discountAmt = toNumber(discount);
    const taxable = Math.max(subtotal - discountAmt, 0);
    const effectiveTaxRate = taxEnabled ? toNumber(taxRate) : 0;
    const taxTotal = taxable * (effectiveTaxRate / 100);
    const total = taxable + taxTotal;
    return { itemSubtotals, subtotal, discountAmt, taxTotal, total, effectiveTaxRate };
  }, [lines, discount, taxRate, taxEnabled]);

  const previewReceipt: MockReceipt = useMemo(() => {
    const client = clientId === "NEW" || (clientId === "" && (newClientPhone.trim() || newClientName.trim()))
      ? { id: "new", name: clientId === "NEW" ? (newClientName || "New Client") : (newClientName.trim() || "Walk-in Customer"), email: newClientEmail || null, phone: newClientPhone || null }
      : (clientId ? clients.find((c) => c.id === clientId) : null);

    return {
      id: "preview",
      businessId: business.id,
      clientId: clientId === "NEW" ? null : (clientId || null),
      // Real number is assigned by the server on save; show a placeholder.
      number: "—",
      documentType,
      status: "ISSUED",
      issueDate,
      paidAt: null,
      dueDate: dueDate || null,
      paymentTerms: paymentTerms || null,
      currency,
      subtotal: totals.subtotal,
      taxRate: totals.effectiveTaxRate,
      taxTotal: totals.taxTotal,
      total: totals.total,
      client: client ? { id: client.id, name: client.name, email: client.email, phone: client.phone } : null,
      lineItems: lines.map((li, i) => ({
        id: li.id,
        description: li.description || "Line item",
        quantity: toNumber(li.quantity) || 1,
        unitPrice: toNumber(li.unitPrice),
        subtotal: totals.itemSubtotals[i] ?? 0,
      })),
    };
  }, [clientId, newClientName, newClientEmail, newClientPhone, business.id, clients, issueDate, currency, lines, taxRate, totals, documentType, dueDate, paymentTerms]);

  const updateLine = (id: string, patch: Partial<LineItemDraft>) =>
    setLines((prev) => prev.map((li) => (li.id === id ? { ...li, ...patch } : li)));
  const addLine = () => setLines((prev) => [...prev, blankLine()]);
  const addLineFromProduct = (product: ProductRow) => {
    setLines((prev) => [
      ...prev,
      {
        id: newId(),
        description: product.name + (product.description ? ` — ${product.description}` : ""),
        quantity: "1",
        unitPrice: product.unitPrice.toString(),
      },
    ]);
  };
  const removeLine = (id: string) =>
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((li) => li.id !== id)));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLines((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    if (!initialReceipt) return;

    const handler = setTimeout(async () => {
      setIsAutosaving(true);
      const payload = {
        documentType,
        issueDate,
        dueDate: dueDate || null,
        paymentTerms: paymentTerms.trim() || null,
        clientId: (clientId === "NEW" || (clientId === "" && (newClientPhone.trim() || newClientName.trim()))) ? null : (clientId || null),
        clientName: clientId === "NEW" ? newClientName.trim() : (clientId === "" && (newClientPhone.trim() || newClientName.trim()) ? (newClientName.trim() || "Walk-in Customer") : undefined),
        clientEmail: clientId === "NEW" ? (newClientEmail.trim() || undefined) : undefined,
        clientPhone: (clientId === "NEW" || clientId === "") ? (newClientPhone.trim() || undefined) : undefined,
        currency,
        taxRate: taxEnabled ? toNumber(taxRate) : 0,
        discount: toNumber(discount),
        notes: notes.trim() || null,
        templateId,
        status: "DRAFT" as const,
        lineItems: lines.map((li) => ({
          description: li.description.trim() || "Line item",
          quantity: toNumber(li.quantity) || 1,
          unitPrice: toNumber(li.unitPrice),
        })),
      };

      const result = await updateReceipt({ id: initialReceipt.id, ...payload });
      setIsAutosaving(false);
      if (result.ok) {
        setLastSaved(new Date());
      }
    }, 2000);

    return () => clearTimeout(handler);
  }, [initialReceipt, documentType, issueDate, dueDate, paymentTerms, clientId, newClientName, newClientEmail, newClientPhone, currency, taxRate, discount, notes, templateId, lines]);

  const submit = (status: "DRAFT" | "ISSUED") => {
    setError(null);
    startTransition(async () => {
      let result;
      const payload = {
        documentType,
        issueDate,
        dueDate: dueDate || null,
        paymentTerms: paymentTerms.trim() || null,
        clientId: (clientId === "NEW" || (clientId === "" && (newClientPhone.trim() || newClientName.trim()))) ? null : (clientId || null),
        clientName: clientId === "NEW" ? newClientName.trim() : (clientId === "" && (newClientPhone.trim() || newClientName.trim()) ? (newClientName.trim() || "Walk-in Customer") : undefined),
        clientEmail: clientId === "NEW" ? (newClientEmail.trim() || undefined) : undefined,
        clientPhone: (clientId === "NEW" || clientId === "") ? (newClientPhone.trim() || undefined) : undefined,
        currency,
        taxRate: taxEnabled ? toNumber(taxRate) : 0,
        discount: toNumber(discount),
        notes: notes.trim() || null,
        templateId,
        status,
        lineItems: lines.map((li) => ({
          description: li.description.trim(),
          quantity: toNumber(li.quantity),
          unitPrice: toNumber(li.unitPrice),
        })),
      };

      if (initialReceipt) {
        result = await updateReceipt({ id: initialReceipt.id, ...payload });
      } else {
        result = await saveReceipt(payload);
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`${copy.basePath}/${result.id}`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Breadcrumb & Preview Toggle ────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href={copy.basePath}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> {copy.listName}
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 sm:hidden"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Page Header ────────────────────────────────────────────── */}
      <header className="animate-fade-in">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[32px] sm:leading-tight">
          {initialReceipt ? `Edit ${copy.noun}` : `New ${copy.noun}`}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Fill in the details below. Changes update the preview in real time.
        </p>
      </header>

      {/* ─── Template Selector ──────────────────────────────────────── */}
      <div className="animate-fade-in flex flex-col gap-4">
        <TemplateSelector value={templateId} onChange={setTemplateId} />

        {/* Mobile Preview Toggle Button */}
        <button
          type="button"
          onClick={() => setPreviewOpen((v) => !v)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-100 active:scale-[0.98] dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 lg:hidden"
        >
          {previewOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {previewOpen ? "Hide live preview" : "View live preview"}
        </button>
      </div>

      {/* ─── Two-Column Layout ──────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        {/* ─── FORM COLUMN ─────────────────────────────────────────── */}
        <form className="flex flex-col gap-5 pb-32 lg:pb-0" onSubmit={(e) => e.preventDefault()}>
          {/* Details Card */}
          <Card className="animate-fade-in-delay-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <span className="text-xs font-bold">1</span>
                </span>
                Details
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">{copy.detailsHint}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="issueDate">Issue date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{isInvoice ? "Invoice" : "Receipt"} number</Label>
                <p className="flex h-11 items-center rounded-lg border border-dashed border-border bg-muted/30 px-3 text-sm text-muted-foreground md:h-10">
                  Assigned automatically on save
                </p>
              </div>
              {isInvoice && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="dueDate">Due date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="paymentTerms">Payment terms</Label>
                    <Input
                      id="paymentTerms"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="e.g. Net 30"
                    />
                  </div>
                </>
              )}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="client">Client</Label>
                <ClientCombobox
                  clients={clients}
                  value={clientId}
                  onChange={(val, newName) => {
                    setClientId(val);
                    if (newName) setNewClientName(newName);
                  }}
                />
              </div>

              {clientId === "NEW" && (
                <>
                  <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="newClientName">Client Name</Label>
                    <Input
                      id="newClientName"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="newClientEmail">Client Email (optional)</Label>
                    <Input
                      id="newClientEmail"
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="newClientPhone">Client Phone (optional)</Label>
                    <Input
                      id="newClientPhone"
                      type="tel"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </>
              )}

              {clientId === "" && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 sm:col-span-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="walkInName">Customer Name (optional)</Label>
                    <Input
                      id="walkInName"
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="e.g. John Doe (Defaults to Walk-in Customer)"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="walkInPhone">Customer Phone (optional)</Label>
                    <Input
                      id="walkInPhone"
                      type="tel"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">If provided, this walk-in customer will be saved to your contacts.</p>
                </div>
              )}

              {clientId && clientId !== "NEW" && (() => {
                const selectedClient = clients.find(c => c.id === clientId);
                if (!selectedClient) return null;
                return (
                  <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2 animate-in fade-in rounded-xl border border-border/50 bg-muted/10 p-4">
                    <div className="flex flex-col gap-1.5">
                      <Label>Client Name</Label>
                      <Input value={selectedClient.name} disabled className="bg-background/50" />
                    </div>
                    {selectedClient.email && (
                      <div className="flex flex-col gap-1.5">
                        <Label>Client Email</Label>
                        <Input value={selectedClient.email} disabled className="bg-background/50" />
                      </div>
                    )}
                    {selectedClient.phone && (
                      <div className="flex flex-col gap-1.5">
                        <Label>Client Phone</Label>
                        <Input value={selectedClient.phone} disabled className="bg-background/50" />
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card className="animate-fade-in-delay-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <span className="text-xs font-bold">2</span>
                </span>
                Line items
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">{copy.lineItemsHint}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={lines.map(li => li.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {lines.map((li, i) => (
                    <SortableLineItem
                      key={li.id}
                      item={li}
                      index={i}
                      products={products}
                      currency={currency}
                      subtotal={totals.itemSubtotals[i] ?? 0}
                      isRemovable={lines.length > 1}
                      onUpdate={updateLine}
                      onRemove={removeLine}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLine}
                  className="justify-center border-dashed sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add blank line
                </Button>
                {products.length > 0 && (
                  <ProductPicker
                    products={products}
                    currency={currency}
                    onSelect={addLineFromProduct}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Totals & Tax Card */}
          <Card className="animate-fade-in-delay-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                    <span className="text-xs font-bold">3</span>
                  </span>
                  Totals &amp; tax
                </CardTitle>
                {/* Tax toggle */}
                <label htmlFor="taxToggle" className="flex cursor-pointer items-center gap-2">
                  <span className={cn("text-sm font-semibold transition-colors", taxEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500")}>
                    {taxEnabled ? "Tax on" : "Tax off"}
                  </span>
                  <Switch
                    id="taxToggle"
                    checked={taxEnabled}
                    onCheckedChange={setTaxEnabled}
                  />
                </label>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className={cn("grid gap-4", taxEnabled ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="builderCurrency">Currency</Label>
                  <Input
                    id="builderCurrency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                    maxLength={3}
                  />
                </div>
                {taxEnabled && (
                  <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label htmlFor="builderTaxRate">Tax rate (%)</Label>
                    <Input
                      id="builderTaxRate"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="text-right tabular-nums"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="builderDiscount">Discount</Label>
                  <Input
                    id="builderDiscount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="text-right tabular-nums"
                  />
                </div>
              </div>

              {/* Live summary */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                <dl className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500 dark:text-slate-400 shrink-0">Subtotal</dt>
                    <dd className="font-semibold tabular-nums text-slate-900 dark:text-white break-all text-right">{formatMoney(totals.subtotal, currency)}</dd>
                  </div>
                  {totals.discountAmt > 0 && (
                    <div className="flex justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                      <dt className="shrink-0">Discount</dt>
                      <dd className="font-semibold tabular-nums break-all text-right">−{formatMoney(totals.discountAmt, currency)}</dd>
                    </div>
                  )}
                  {taxEnabled && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400 shrink-0">Tax ({taxRate}%)</dt>
                      <dd className="font-semibold tabular-nums text-slate-900 dark:text-white break-all text-right">{formatMoney(totals.taxTotal, currency)}</dd>
                    </div>
                  )}
                  <div className="mt-1 flex justify-between gap-4 border-t border-slate-200 pt-3 text-base dark:border-slate-700">
                    <dt className="font-bold text-slate-900 dark:text-white shrink-0 mt-1">Total</dt>
                    <dd className="font-extrabold tabular-nums text-slate-900 dark:text-white break-all text-right">{formatMoney(totals.total, currency)}</dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <span className="text-xs font-bold">4</span>
                </span>
                Notes
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Visible on the {copy.noun} — thank-you message, extra details, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Thanks for your business!"
                className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 ring-offset-background transition-all placeholder:text-slate-400 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus-visible:ring-blue-500 md:text-sm"
              />
            </CardContent>
          </Card>
        </form>

        {/* ─── PREVIEW COLUMN (Desktop) ────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-4">
            {/* Preview toolbar */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <p className="px-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Live preview
              </p>
              {!isInvoice && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" type="button" className="h-8 gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                  <EmailSendButton
                    receiptId={initialReceipt?.id || "preview"}
                    status={initialReceipt?.status || "DRAFT"}
                    defaultEmail={clientId ? clients.find(c => c.id === clientId)?.email : undefined}
                    variant="ghost"
                    iconType="mail"
                    className="h-8 gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  />
                  <Button variant="ghost" size="sm" type="button" className="h-8 gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    <Link2 className="h-3.5 w-3.5" /> Link
                  </Button>
                </div>
              )}
            </div>

            {/* Receipt preview */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-inner dark:border-slate-700 dark:bg-slate-800/50">
              <ReceiptDocument receipt={previewReceipt} business={business} templateId={templateId} />
            </div>
          </div>
        </aside>

        {/* ─── PREVIEW — Mobile full-screen sheet ──────────────────── */}
        <div
          className={cn(
            "fixed inset-0 z-40 flex flex-col bg-slate-50 transition-transform duration-300 dark:bg-slate-900 lg:hidden",
            previewOpen ? "translate-y-0" : "translate-y-full",
          )}
          aria-hidden={!previewOpen}
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{isInvoice ? "Invoice" : "Receipt"} Preview</p>
            <div className="flex items-center gap-2">
              {!isInvoice && (
                <>
                  <Button variant="ghost" size="sm" type="button" className="h-8 gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                  <EmailSendButton
                    receiptId={initialReceipt?.id || "preview"}
                    status={initialReceipt?.status || "DRAFT"}
                    defaultEmail={clientId ? clients.find(c => c.id === clientId)?.email : undefined}
                    variant="ghost"
                    iconType="mail"
                    className="h-8 gap-1.5 text-xs text-slate-600 dark:text-slate-300"
                  />
                </>
              )}
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-sm font-bold text-blue-600 dark:text-blue-400"
              >
                Done
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ReceiptDocument receipt={previewReceipt} business={business} templateId={templateId} />
          </div>
        </div>
      </div>

      {/* ─── Sticky Action Bar ──────────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 glass px-4 py-3 sm:px-6 lg:left-60 lg:px-8 dark:border-slate-700 dark:bg-slate-900/90",
          "pb-[calc(env(safe-area-inset-bottom)+80px)] lg:pb-3",
        )}
      >
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3">
          <div className="hidden flex-col sm:flex">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total</span>
            <span className="text-2xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
              {formatMoney(totals.total, currency)}
            </span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-initial">
            {error && (
              <span className="hidden items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 sm:inline-flex">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </span>
            )}

            {initialReceipt && (
              <span className="mr-2 hidden text-xs text-slate-500 dark:text-slate-400 sm:inline-flex">
                {isAutosaving ? (
                  <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>
                ) : lastSaved ? (
                  <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                ) : null}
              </span>
            )}

            <Button
              variant="outline"
              type="button"
              className="hidden sm:inline-flex h-8 px-3 text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              disabled={isPending}
              onClick={() => submit("DRAFT")}
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save draft
            </Button>
            <Button
              type="button"
              className="sm:hidden h-8 px-2.5 text-xs font-semibold gap-1 bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
              disabled={isPending}
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
            <Button
              type="button"
              className="h-8 px-2.5 sm:px-4 text-xs font-semibold gap-1 sm:gap-1.5 bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
              disabled={isPending}
              onClick={() => submit("ISSUED")}
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copy.issueCta}</span>
              <span className="sm:hidden">Issue</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
