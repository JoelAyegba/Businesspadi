import { Bell, FileClock } from "lucide-react";
import Link from "next/link";
import { getOverdueInvoices } from "@/lib/queries/invoices";
import { formatMoney } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export async function NotificationBell({ businessId }: { businessId: string }) {
  const overdueInvoices = await getOverdueInvoices(businessId);
  const hasNotifications = overdueInvoices.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:bg-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Bell className="h-4 w-4" />
          {hasNotifications && (
            <span
              className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-red-500 ring-2 ring-background"
              aria-hidden
            />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 overflow-hidden p-0 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-muted/50 p-4">
          <p className="text-sm font-semibold">Notifications</p>
          {hasNotifications && (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
              {overdueInvoices.length} Overdue
            </span>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {!hasNotifications ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Bell className="mb-2 h-6 w-6 opacity-20" />
              <p className="text-sm">You have no new notifications.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {overdueInvoices.map((invoice) => {
                const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date();
                const daysOverdue = isOverdue
                  ? Math.floor(
                      (new Date().getTime() - new Date(invoice.dueDate!).getTime()) /
                        (1000 * 3600 * 24),
                    )
                  : 0;

                return (
                  <DropdownMenuItem
                    key={invoice.id}
                    asChild
                    className="cursor-pointer rounded-none border-b border-border/50 p-0 last:border-0 focus:bg-muted/50"
                  >
                    <Link
                      href={`/app/invoices/${invoice.id}`}
                      className="flex w-full items-start gap-4 p-4 outline-none"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                        <FileClock className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium leading-none text-foreground">
                            {invoice.client?.name || "Unknown Client"}
                          </p>
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {daysOverdue}d ago
                          </span>
                        </div>
                        <p className="mb-1 truncate text-xs text-muted-foreground">
                          Invoice {invoice.number} is overdue
                        </p>
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {formatMoney(invoice.total, invoice.currency)}
                        </p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
