import Link from "next/link";
import { BRANDING, brandTagline } from "@/lib/branding";
import { BRANDS } from "@/lib/brands";
import { BitsolBranding } from "./BitsolBranding";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary/40">
      <div className="container grid gap-8 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-sm font-semibold text-foreground">
            {BRANDING.product.name}
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {BRANDING.product.description}
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground/80">
            © {year} {BRANDING.product.company}. All rights reserved.
          </p>
        </div>

        {[BRANDS.MARKETING, BRANDS.INSTITUTE].map((brand) => (
          <div key={brand.id}>
            <p className="text-xs font-semibold text-foreground">
              {brand.emoji} {brand.shortName}
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              <li>{brand.contact.phone}</li>
              <li className="break-all">{brand.contact.email}</li>
              <li>{brand.contact.city}</li>
              <li>{brand.contact.hours}</li>
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t">
        <div className="container flex flex-col items-center gap-3 py-5 md:flex-row md:justify-between">
          <nav className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/about" className="hover:text-primary">About</Link>
            <Link href="/chat" className="hover:text-primary">Assistant</Link>
            <Link href="/login" className="hover:text-primary">Staff sign in</Link>
          </nav>
          <div className="text-center md:text-right">
            <BitsolBranding className="justify-center md:justify-end" />
            <p className="mt-1 text-[11px] text-muted-foreground/80">{brandTagline}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
