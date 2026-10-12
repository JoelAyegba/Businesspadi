import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client with automatic transient-error retry.
 *
 * In Next.js dev, hot reload would otherwise spawn a new client per HMR cycle
 * and exhaust Postgres connections in minutes.
 *
 * The serverless Neon instance auto-suspends and is slow/unreliable on cold
 * start (first query after idle can fail or take several seconds; a burst of
 * concurrent connections can be rejected outright). The retry wrapper below
 * transparently recovers from those blips — the first request warms the
 * instance and the retry succeeds — so a cold DB doesn't surface as an error.
 */

/** Backoff schedule (ms) between retry attempts. Length = max retries. */
const RETRY_BACKOFF_MS = [300, 800, 1500, 2500];

/**
 * True for errors that are worth retrying: connection/cold-start failures that
 * are expected to clear once Neon warms up. Real query/constraint errors are
 * NOT transient and must surface immediately.
 */
export function isTransientDbError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  const message = e instanceof Error ? e.message : String(e ?? "");
  return (
    /Can't reach database server/i.test(message) ||
    /Timed out fetching a new connection/i.test(message) ||
    /Connection pool/i.test(message) ||
    /Server has closed the connection/i.test(message)
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run `fn`, retrying on transient DB errors with backoff. Use this to wrap
 * whole units of work that must retry atomically — notably interactive
 * `prisma.$transaction(...)` calls, which the client-level retry below cannot
 * safely re-run piecemeal.
 */
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_BACKOFF_MS.length; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!isTransientDbError(e)) throw e;
      lastError = e;
      const delay = RETRY_BACKOFF_MS[attempt];
      if (delay !== undefined) await sleep(delay);
    }
  }
  throw lastError;
}

function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  // Retry every model/raw operation on transient connection errors. Non-transient
  // errors (constraint violations, bad queries) are re-thrown immediately.
  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        return withDbRetry(() => query(args));
      },
    },
  });
}

// The retrying client is a superset of PrismaClient at runtime. We expose it
// typed as the base PrismaClient so interactive-transaction callbacks yield a
// `Prisma.TransactionClient` (keeping helpers like generateDocumentNumber(tx)
// assignable) — the $allOperations retry still runs regardless of the type.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? (createPrismaClient() as unknown as PrismaClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
