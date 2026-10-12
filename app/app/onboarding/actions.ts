"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireBusinessContext } from "@/lib/auth";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const onboardingSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  address: z.string().min(3, "Address is required"),
  phone: z.string().min(6, "Phone number is required"),
  email: z.string().email("A valid email is required"),
  taxId: z.string().optional(),
  defaultCurrency: z.string().min(2).max(4).default("NGN"),
  signatureDataUrl: z.string().min(1, "Please draw your signature"),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

export async function completeOnboarding(data: OnboardingFormData) {
  const { business } = await requireBusinessContext();

  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, address, phone, email, taxId, defaultCurrency, signatureDataUrl } = parsed.data;

  const slug = slugify(name);

  // Check slug uniqueness — append random suffix if taken by another business
  let finalSlug = slug;
  const existing = await prisma.business.findUnique({ where: { slug } });
  if (existing && existing.id !== business.id) {
    finalSlug = `${slug}-${business.id.slice(0, 6)}`;
  }

  await prisma.business.update({
    where: { id: business.id },
    data: {
      name,
      slug: finalSlug,
      address,
      phone,
      email,
      taxId: taxId || null,
      defaultCurrency,
      signatureUrl: signatureDataUrl,
      profileComplete: true,
    },
  });

  revalidatePath("/app", "layout");

  return { ok: true };
}
