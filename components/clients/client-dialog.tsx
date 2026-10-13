"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createClient, updateClient } from "@/app/app/clients/actions";

const clientFormSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    taxId: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
});

type ClientData = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    taxId: string | null;
    notes: string | null;
};

interface ClientDialogProps {
    client?: ClientData;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ClientDialog({ client, trigger, open: controlledOpen, onOpenChange: setControlledOpen }: ClientDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen : setInternalOpen;

    const isEditing = !!client;

    // Reset form errors when dialog opens
    useEffect(() => {
        if (open) {
            setError(null);
            setFieldErrors({});
        }
    }, [open]);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setFieldErrors({});

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            taxId: formData.get("taxId") as string,
            notes: formData.get("notes") as string,
        };

        const parsed = clientFormSchema.safeParse(data);
        if (!parsed.success) {
            const errors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                if (issue.path[0]) {
                    errors[issue.path[0] as string] = issue.message;
                }
            }
            setFieldErrors(errors);
            setIsSubmitting(false);
            return;
        }

        try {
            const result = isEditing && client
                ? await updateClient(client.id, parsed.data)
                : await createClient(parsed.data);

            if (!result.ok) {
                setError(result.error);
                return;
            }

            if (setOpen) setOpen(false);
        } catch (err) {
            console.error("Failed to save client:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Client" : "Add Client"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update your client's contact information." : "Add a new client to your directory."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Client Name <span className="text-destructive">*</span></Label>
                        <Input id="name" name="name" defaultValue={client?.name || ""} placeholder="Acme Corp or Jane Doe" />
                        {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={client?.email || ""} placeholder="jane@example.com" />
                            {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" type="tel" defaultValue={client?.phone || ""} placeholder="+1 (555) 000-0000" />
                            {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="taxId">Tax ID (Optional)</Label>
                        <Input id="taxId" name="taxId" defaultValue={client?.taxId || ""} placeholder="VAT / GST / EIN" />
                        {fieldErrors.taxId && <p className="text-xs text-destructive">{fieldErrors.taxId}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input id="notes" name="notes" defaultValue={client?.notes || ""} placeholder="Private notes about this client" />
                        {fieldErrors.notes && <p className="text-xs text-destructive">{fieldErrors.notes}</p>}
                    </div>

                    {error && <p className="text-sm rounded-md bg-destructive/10 p-2 text-destructive">{error}</p>}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen && setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Save changes" : "Add client"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
