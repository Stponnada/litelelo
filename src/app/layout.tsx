import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import AppShell from "@/components/AppShell";


export const metadata: Metadata = {
  title: "litelelo.",
  description: "Social media for BITSians",

};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-primary-light dark:bg-primary text-text-main-light dark:text-text-main" suppressHydrationWarning>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
