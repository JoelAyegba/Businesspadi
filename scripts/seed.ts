/**
 * Seed local dev DB with one business, one client, one issued receipt.
 * Run: npm run db:seed
 *
 * Safe to re-run — uses upsert by stable keys.
 */
import { PrismaClient, ReceiptStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@receiptflow.app" },
    update: {},
    create: { clerkId: "seed_user_demo", email: "demo@receiptflow.app" },
  });

  const business = await prisma.business.upsert({
    where: { slug: "demo-co" },
    update: {},
    create: {
      name: "Demo Co",
      slug: "demo-co",
      defaultCurrency: "NGN",
      defaultTaxRate: "7.5",
      address: "12 Marina, Lagos",
      phone: "+234 800 000 0000",
    },
  });

  await prisma.membership.upsert({
    where: { userId_businessId: { userId: user.id, businessId: business.id } },
    update: {},
    create: { userId: user.id, businessId: business.id, role: "owner" },
  });

  const client = await prisma.client.upsert({
    where: { id: "seed_client_demo" }, // upsert by id so re-runs are stable
    update: {},
    create: {
      id: "seed_client_demo",
      businessId: business.id,
      name: "Acme Holdings",
      email: "ops@acme.test",
    },
  });

  const existingReceipt = await prisma.receipt.findFirst({
    where: { businessId: business.id, number: "RCPT-2026-0001" },
  });

  if (!existingReceipt) {
    await prisma.receipt.create({
      data: {
        businessId: business.id,
        clientId: client.id,
        number: "RCPT-2026-0001",
        status: ReceiptStatus.ISSUED,
        issueDate: new Date(),
        currency: "NGN",
        taxRate: "7.5",
        subtotal: "100000.00",
        taxTotal: "7500.00",
        total: "107500.00",
        businessSnapshot: {
          name: business.name,
          address: business.address,
          phone: business.phone,
        },
        notes: "Seed receipt — safe to delete.",
        lineItems: {
          create: [
            {
              description: "Website design",
              quantity: "1",
              unitPrice: "100000.00",
              subtotal: "100000.00",
              position: 0,
            },
          ],
        },
      },
    });
  }

  console.info("Seed complete:", { user: user.email, business: business.slug });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
