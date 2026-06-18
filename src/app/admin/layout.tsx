import { Toaster } from "react-hot-toast";
import AdminSidebar from "./AdminSidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* La Sidebar solo se mostrará si la ruta está protegida por el middleware */}
      <AdminSidebar />

      <main className="ml-64 min-h-screen p-8">{children}</main>

      <Toaster
        position="top-right"
        toastOptions={{
          className: "font-body-md",
          style: {
            borderRadius: 0,
            border: "1px solid #000000",
            background: "#f9f9f9",
            color: "#1a1c1c",
          },
        }}
      />
    </div>
  );
}