import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Anything matched here is PUBLIC. Everything else requires auth.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/r/(.*)", // public receipt views (Phase 4)
  "/api/webhooks/(.*)", // Clerk / Stripe / Resend webhooks
  "/api/health",
  // Dev-only template gallery (the page itself 404s in production).
  ...(process.env.NODE_ENV !== "production" ? ["/dev/(.*)"] : []),
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  // Match every route except Next internals and static files.
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
