import type { Metadata } from "next";
import { Poppins, Raleway, Rubik_Glitch } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import AppShell from "@/components/AppShell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: '--font-poppins'
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["900"],
  variable: '--font-raleway'
});

const rubikGlitch = Rubik_Glitch({
  subsets: ["latin"],
  weight: ["400"],
  variable: '--font-rubik-glitch'
});

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
    <html lang="en" className={`${poppins.variable} ${raleway.variable} ${rubikGlitch.variable}`} suppressHydrationWarning>
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
