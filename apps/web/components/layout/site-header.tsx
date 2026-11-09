"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";
import Link from "next/link";
import { IconArrowUpRight, IconMenu2, IconX } from "@tabler/icons-react";
import { SibajwaBrand } from "@/components/shared/sibajwa-brand";
import { Button } from "@/components/ui/button";
import styles from "./site-header.module.css";

const navigation = [
  { href: "#tentang", label: "Tentang SIBAJAWA" },
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara kerja" },
];

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHash() { return window.location.hash; }
function getServerHash() { return ""; }

export function SiteHeader() {
  const activeHash = useSyncExternalStore(subscribeToHash, getHash, getServerHash);
  const [menuOrigin, setMenuOrigin] = useState({ "--menu-origin-right": "28px", "--menu-origin-top": "40px" });

  return (
    <header className="relative z-20 border-b border-neutral-100 bg-white/95">
      <div className="site-container flex h-20 items-center justify-between gap-4">
        <SibajwaBrand />
        <nav aria-label="Navigasi utama" className="hidden items-center gap-4 md:flex">
          {navigation.map((item) => <a key={item.href} href={item.href} aria-current={activeHash === item.href ? "location" : undefined} className="rounded-md p-2 text-sm text-neutral-600 transition-colors hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-600 aria-[current=location]:text-blue-700">{item.label}</a>)}
        </nav>
        <Button asChild className="hidden sm:inline-flex"><Link href="/map">Buka WebGIS <IconArrowUpRight aria-hidden="true" /></Link></Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Buka menu navigasi" onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setMenuOrigin({
                "--menu-origin-right": `${document.documentElement.clientWidth - rect.right + rect.width / 2}px`,
                "--menu-origin-top": `${rect.top + rect.height / 2}px`,
              });
            }}>
              <IconMenu2 size={21} aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent className={`${styles.menu} overflow-y-auto bg-white`} style={menuOrigin as React.CSSProperties} showCloseButton={false} aria-describedby={undefined}>
            <div className="flex items-center justify-between gap-2">
              <SheetTitle><Image src="/images/sibajawa-logo.svg" alt="SIBAJAWA" width={151} height={35} unoptimized /></SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="size-10 shrink-0" aria-label="Tutup menu navigasi">
                  <IconX className="size-6" aria-hidden="true" />
                </Button>
              </SheetClose>
            </div>
            <nav aria-label="Navigasi seluler" className="flex flex-col gap-2">
              {navigation.map((item) => (
                <SheetClose asChild key={item.href}>
                  <a href={item.href} aria-current={activeHash === item.href ? "location" : undefined} className="rounded-lg px-3 py-3 text-sm hover:bg-neutral-50 aria-[current=location]:bg-blue-50 aria-[current=location]:font-semibold aria-[current=location]:text-blue-700">{item.label}</a>
                </SheetClose>
              ))}
              <Button asChild><Link href="/map">Buka WebGIS <IconArrowUpRight aria-hidden="true" /></Link></Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
