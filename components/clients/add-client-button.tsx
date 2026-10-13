"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientDialog } from "@/components/clients/client-dialog";

export function AddClientButton() {
  return (
    <ClientDialog
      trigger={
        <Button className="w-full gap-2 shadow-lg shadow-primary/20 sm:w-auto">
          <Plus className="h-4 w-4" /> Add client
        </Button>
      }
    />
  );
}
