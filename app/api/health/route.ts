import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Health probe used by uptime monitoring (BetterStack / similar).
 * Returns 200 only if Postgres responds within 1s.
 */
// Without this, Next prerenders the GET at build time and the probe never
// touches the DB again.
export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "ok",
      ms: Date.now() - start,
      env: process.env.NODE_ENV,
    });
  } catch (err) {
    // Public endpoint — log the detail, don't return it (DB host, auth errors).
    console.error("Health check DB failure:", err);
    return NextResponse.json(
      {
        status: "degraded",
        db: "fail",
        ms: Date.now() - start,
      },
      { status: 503 },
    );
  }
}
