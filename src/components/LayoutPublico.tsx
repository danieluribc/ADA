"use client";

import { Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { useCart } from "@/context/CartContext";

type LayoutPublicoProps = {
  children: ReactNode;
};

const navigationLinks = [
  { href: "/tienda", label: "TIENDA" },
  { href: "/coleccion", label: "COLECCIÓN" },
  { href: "/archivo", label: "ARCHIVO" },
] as const;

const serviceLinks = [
  { href: "/terminos-de-uso", label: "Términos de uso" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/envios-y-devoluciones", label: "Envíos y Devoluciones" },
  { href: "/contacto", label: "Contacto" },
] as const;

export default function LayoutPublico({ children }: LayoutPublicoProps) {
  const { cartCount, loading } = useCart();

  const formattedCartCount =
    cartCount > 99 ? "99+" : String(Math.max(0, cartCount));
  const shouldShowCartCount = !loading && cartCount > 0;

  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-primary/10 bg-background px-container-margin py-4">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-8">
          <Link
            href="/"
            aria-label="ADA inicio"
            className="font-headline-md font-bold tracking-tighter text-primary transition-colors duration-300 hover:text-on-surface-variant"
          >
            ADA
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Navegación principal">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-label-caps text-on-surface-variant transition-colors duration-300 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-6 text-primary">
            <Link href="/buscar" aria-label="Buscar">
              <Search className="h-5 w-5" />
            </Link>
            <Link href="/cuenta" aria-label="Cuenta">
              <User className="h-5 w-5" />
            </Link>
            <Link href="/carrito" aria-label="Carrito" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {shouldShowCartCount ? (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-neon-lime px-1 text-[10px] font-semibold leading-none text-primary">
                  {formattedCartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-screen pt-[73px]">{children}</main>

      <footer className="border-t border-primary/10 px-container-margin py-12">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <Link
            href="/"
            aria-label="ADA inicio"
            className="font-headline-md tracking-tighter text-primary transition-colors duration-300 hover:text-on-surface-variant"
          >
            ADA
          </Link>

          <nav className="flex flex-wrap gap-x-8 gap-y-3" aria-label="Servicio al cliente">
            {serviceLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-link-sm text-on-surface-variant transition-colors duration-300 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-12 font-link-sm text-on-surface-variant">
          © 2026 ADA. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
