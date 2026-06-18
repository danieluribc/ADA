import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Noto_Serif } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import LayoutPublico from "@/components/LayoutPublico";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ADA | Tienda de ropa deportiva femenina",
  description: "Tienda online de ropa deportiva femenina ADA.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const shouldRenderPublicShell = !pathname.startsWith("/admin");

  return (
    <html lang="es" className={`${inter.variable} ${notoSerif.variable}`}>
      <body className="bg-background text-on-background font-body-md min-h-screen antialiased">
        {shouldRenderPublicShell ? (
          <CartProvider>
            <LayoutPublico>{children}</LayoutPublico>
          </CartProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
