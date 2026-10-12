"use client";

import { useState, useTransition } from "react";
import { Send, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendReceiptEmail } from "@/app/app/receipts/email-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  receiptId: string;
  defaultEmail?: string | null;
  status: string;
  variant?: "outline" | "ghost";
  iconType?: "send" | "mail";
  className?: string;
};

export function EmailSendButton({ 
  receiptId, 
  defaultEmail, 
  status, 
  variant = "outline", 
  iconType = "send",
  className 
}: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail || "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const Icon = iconType === "send" ? Send : Mail;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setSuccess(false);
    
    startTransition(async () => {
      const result = await sendReceiptEmail(receiptId, email);
      if (!result.ok) {
        setError(result.error || "Failed to send email");
      } else {
        setSuccess(true);
        setTimeout(() => setOpen(false), 2000);
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setOpen(false);
      setTimeout(() => {
        setSuccess(false);
        setError(null);
      }, 300);
    } else {
      if (status === "DRAFT") {
        alert("You must issue this receipt before emailing it.");
        return;
      }
      setOpen(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" className={className}>
          <Icon className="h-4 w-4" /> Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSend}>
          <DialogHeader>
            <DialogTitle>Send Receipt</DialogTitle>
            <DialogDescription>
              Enter the recipient&apos;s email address to send this receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="email" className="sr-only">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending || success}
              />
            </div>
          </div>
          {error && <p className="text-sm font-medium text-destructive mb-4">{error}</p>}
          {success && <p className="text-sm font-medium text-emerald-600 mb-4">Email sent successfully!</p>}
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || success || !email}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {success ? "Sent" : "Send Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
