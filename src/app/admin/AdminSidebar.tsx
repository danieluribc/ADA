"use client";

import { ClipboardList, LogOut, Package } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { signOutAdmin } from "./actions";

const navigationLinks = [
  { href: "/admin/productos", label: "📦 Productos", icon: Package },
  { href: "/admin/pedidos", label: "📋 Pedidos", icon: ClipboardList },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    const result = await signOutAdmin();

    if (!result.ok) {
      toast.error(result.message);
      setIsSigningOut(false);
      return;
    }

    router.replace("/admin/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-primary/20 bg-background px-8 py-10">
      <Link
        href="/admin/productos"
        className="font-headline-md tracking-tighter text-primary"
        aria-label="ADA panel de administración"
      >
        ADA
      </Link>

      <nav className="mt-16 grid gap-2" aria-label="Navegación del panel">
        {navigationLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href || (link.href !== "/admin/productos" && pathname.startsWith(`${link.href}/`));

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 border-b border-transparent py-4 font-label-caps transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-primary/20 pt-8">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center gap-3 border-b border-transparent py-4 font-label-caps text-on-surface-variant transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {isSigningOut ? "CERRANDO..." : "Cerrar Sesión"}
        </button>
      </div>
    </aside>
  );
}
