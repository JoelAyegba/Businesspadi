import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Businesspadi — Beautiful receipts in seconds",
    template: "%s | Businesspadi",
  },
  description:
    "Create, manage, and deliver professional receipts to your clients. Built for freelancers, SMEs, and agencies.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: 'hsl(221 83% 53%)', // Matches --primary
              colorBackground: 'hsl(0 0% 100%)', // Default light background to start
              fontFamily: 'inherit',
              borderRadius: '0.5rem',
            },
            elements: {
              card: "bg-card border-border shadow-2xl rounded-xl",
              headerTitle: "text-foreground font-semibold tracking-tight text-2xl",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-border text-foreground hover:bg-secondary transition-colors",
              socialButtonsBlockButtonText: "text-foreground font-medium",
              formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all",
              formFieldLabel: "text-foreground font-medium",
              formFieldInput: "bg-background border-input text-foreground focus:ring-2 focus:ring-ring focus:border-ring",
              footerActionLink: "text-primary hover:text-primary/90 hover:underline font-medium",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              navbar: "hidden", // If we want to hide the nested sidebar stuff
            }
          }}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
