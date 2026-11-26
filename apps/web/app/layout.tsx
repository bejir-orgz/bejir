import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
import "./globals.css";
import { RegionSelectionProvider } from "@/features/regions/region-selection";
import { getCatalog } from "@/features/geography/catalog";
import { Scrollbar } from "@/components/ui/scrollbar";

const googleSans = Google_Sans_Flex({
  variable: "--font-google-sans-flex",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: { default: "SIBAJAWA - Sistem Informasi Banjir Jawa Barat", template: "%s | SIBAJAWA" },
  description: "Kenali riwayat banjir dan kondisi geografis Jawa Barat melalui Bejir, platform WebGIS untuk mendukung pemantauan dan mitigasi banjir.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const catalog = await getCatalog();
  return (
    <Scrollbar asChild>
      <html
        lang="id"
        className={`${googleSans.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col" suppressHydrationWarning>
          <RegionSelectionProvider catalog={catalog}>{children}</RegionSelectionProvider>
        </body>
      </html>
    </Scrollbar>
  );
}
