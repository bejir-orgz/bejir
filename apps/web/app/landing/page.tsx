import type { Metadata } from "next";
import { LandingPage } from "./_components/landing-page";

export const metadata: Metadata = { title: "Beranda" };

export default function Landing() {
  return <LandingPage />;
}
