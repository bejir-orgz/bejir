import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
import "./globals.css";
import { Scrollbar } from "@/components/ui/scrollbar";

const googleSans = Google_Sans_Flex({
  variable: "--font-google-sans-flex",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: { default: "Bejir — WebGIS Banjir Jawa Barat", template: "%s | Bejir" },
  description: "Kenali riwayat banjir dan kondisi geografis Jawa Barat melalui Bejir, platform WebGIS untuk mendukung pemantauan dan mitigasi banjir.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <Scrollbar asChild>
      <html
        lang="id"
        className={`${googleSans.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col" suppressHydrationWarning>
          {children}
        </body>
      </html>
    </Scrollbar>
  );
}
