import Link from "next/link";
import { BRANDING, brandTagline } from "@/lib/branding";
import { BRANDS } from "@/lib/brands";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 text-neutral-400">
      <div className="container max-w-6xl mx-auto grid gap-8 py-10 px-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-sm font-bold text-white">
            {BRANDING.product.name}
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-neutral-400">
            {BRANDING.product.description}
          </p>
          <p className="mt-3 text-[11px] text-neutral-500">
            © {year} {BRANDING.product.company}. All rights reserved.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-white">
            🍔 A-ONE Restaurant
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-neutral-400">
            <li>{BRANDS.RESTAURANT.contact.phone}</li>
            <li className="break-all">{BRANDS.RESTAURANT.contact.email}</li>
            <li>{BRANDS.RESTAURANT.contact.city}</li>
            <li>{BRANDS.RESTAURANT.contact.hours}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-800/80">
        <div className="container max-w-6xl mx-auto flex flex-col items-center gap-3 py-4 px-4 md:flex-row md:justify-between text-xs">
          <nav className="flex items-center gap-5 text-neutral-500">
            <Link href="/login" className="hover:text-amber-400">Staff Portal</Link>
            <Link href="https://www.instagram.com/aone_foods/" target="_blank" className="hover:text-amber-400">Instagram</Link>
          </nav>
          <div className="text-neutral-500 text-[11px]">
            {brandTagline}
          </div>
        </div>
      </div>
    </footer>
  );
}
