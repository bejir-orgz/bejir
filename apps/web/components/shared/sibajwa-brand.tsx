import Image from "next/image";
import Link from "next/link";

export function SibajwaBrand() {
  return (
    <Link href="/" aria-label="SIBAJAWA — beranda" className="inline-flex shrink-0 rounded-md">
      <Image src="/images/sibajawa-logo.svg" alt="" width={151} height={35} unoptimized />
    </Link>
  );
}
