import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { WebgisHeader } from "@/components/layout/webgis-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/** Route scaffold only; domain screens will be implemented from their own designs. */
export function WebgisSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-dvh bg-background">
      <WebgisHeader />
      <main className="mx-auto w-full max-w-4xl p-4">
        <Card>
          <CardHeader className="pt-4"><Badge variant="secondary" className="w-fit">Dalam pengembangan</Badge><CardTitle><h1 className="text-2xl leading-8">{title}</h1></CardTitle><CardDescription>{description}</CardDescription></CardHeader>
          <CardContent className="space-y-4 pb-4"><p className="text-sm text-muted-foreground">Halaman ini belum diimplementasikan dan belum terhubung ke API atau data nyata.</p><Button asChild variant="outline"><Link href="/map"><IconArrowLeft aria-hidden="true" />Kembali ke Map Interaktif</Link></Button></CardContent>
        </Card>
      </main>
    </div>
  );
}
