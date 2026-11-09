import type { Metadata } from "next";
import { LandingPage } from "./landing/_components/landing-page";

export const metadata: Metadata = { title: { absolute: "SIBAJAWA — Sistem Informasi Banjir Jawa Barat" }, description: "Jelajahi riwayat banjir dan kondisi geografis Jawa Barat melalui SIBAJAWA." };

export default function Home() {
  return <LandingPage />;
}
