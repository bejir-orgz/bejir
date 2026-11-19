import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import Link from "next/link";
import { IconArrowUpRight, IconMenu2 } from "@tabler/icons-react";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/#tentang", label: "Tentang Bejir" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-kerja", label: "Cara kerja" },
];

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-neutral-100 bg-white/95">
      <div className="site-container flex h-20 items-center justify-between gap-4">
        <Brand />
        <nav aria-label="Navigasi utama" className="hidden items-center gap-4 md:flex">
          {navigation.map((item) => <Link key={item.href} href={item.href} className="rounded-md p-2 text-sm text-neutral-600 transition-colors hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-600">{item.label}</Link>)}
        </nav>
        <Button asChild className="hidden rounded-full sm:inline-flex"><Link href="/map">Buka WebGIS <IconArrowUpRight aria-hidden="true" /></Link></Button>
        <Sheet>
          <SheetTrigger asChild><Button variant="outline" size="icon" className="md:hidden" aria-label="Buka menu navigasi"><IconMenu2 size={21} aria-hidden="true" /><span className="sr-only">Buka menu navigasi</span></Button></SheetTrigger><SheetContent className="p-4"><SheetTitle>Navigasi Bejir</SheetTitle><SheetDescription>Pilih halaman atau buka WebGIS.</SheetDescription>
          <nav aria-label="Navigasi seluler" className="flex flex-col gap-2">
            {navigation.map((item) => <SheetClose asChild key={item.href}><Link href={item.href} className="rounded-lg p-2 text-sm hover:bg-neutral-50">{item.label}</Link></SheetClose>)}
            <Button asChild className="rounded-full"><Link href="/map">Buka WebGIS <IconArrowUpRight aria-hidden="true" /></Link></Button>
          </nav>
        </SheetContent></Sheet>
      </div>
    </header>
  );
}
