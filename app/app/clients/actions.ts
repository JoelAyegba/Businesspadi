"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireBusinessContext } from "@/lib/auth";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
});

export type SaveClientInput = z.input<typeof clientSchema>;
export type SaveClientResult = { ok: true; id: string } | { ok: false; error: string };

export async function createClient(input: SaveClientInput): Promise<SaveClientResult> {
  const { business } = await requireBusinessContext();

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    const client = await prisma.client.create({
      data: {
        businessId: business.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        notes: data.notes || null,
        taxId: data.taxId || null,
      },
      select: { id: true },
    });

    revalidatePath("/app/clients");
    revalidatePath("/app/receipts/new");
    revalidatePath("/app/invoices/new");
    revalidateTag(`receipts-${business.id}`);

    return { ok: true, id: client.id };
  } catch (error) {
    console.error("Failed to create client:", error);
    return { ok: false, error: "Failed to create client. Please try again." };
  }
}

export async function updateClient(id: string, input: SaveClientInput): Promise<SaveClientResult> {
  const { business } = await requireBusinessContext();

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    // Verify ownership
    const existing = await prisma.client.findFirst({
      where: { id, businessId: business.id },
    });

    if (!existing) {
      return { ok: false, error: "Client not found" };
    }

    await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        notes: data.notes || null,
        taxId: data.taxId || null,
      },
    });

    revalidatePath("/app/clients");
    revalidatePath(`/app/clients/${id}`);

    // Changing a client's details might not change historical receipts because of businessSnapshot,
    // but we revalidate anyway to be safe.
    revalidatePath("/app/receipts/new");
    revalidatePath("/app/invoices/new");

    return { ok: true, id };
  } catch (error) {
    console.error("Failed to update client:", error);
    return { ok: false, error: "Failed to update client. Please try again." };
  }
}
