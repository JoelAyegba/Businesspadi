"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientDialog } from "@/components/clients/client-dialog";
import Link from "next/link";

type ClientData = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    taxId: string | null;
    notes: string | null;
};

interface ClientActionsProps {
    client: ClientData;
    isMobile?: boolean;
}

export function ClientActions({ client, isMobile }: ClientActionsProps) {
    const [editOpen, setEditOpen] = useState(false);

    if (isMobile) {
        return (
            <>
                <div className="mt-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5 h-8">
                        <Edit className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button asChild size="sm" variant="outline" className="gap-1.5 h-8">
                        <Link href={`/app/receipts/new?clientId=${client.id}`}>
                            <FilePlus2 className="h-3.5 w-3.5" /> New receipt
                        </Link>
                    </Button>
                </div>
                <ClientDialog client={client} open={editOpen} onOpenChange={setEditOpen} />
            </>
        );
    }

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="gap-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100 focus-visible:opacity-100 h-8"
                >
                    <Link href={`/app/receipts/new?clientId=${client.id}`}>
                        <FilePlus2 className="h-3.5 w-3.5" /> New receipt
                    </Link>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit client
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <ClientDialog client={client} open={editOpen} onOpenChange={setEditOpen} />
        </>
    );
}
