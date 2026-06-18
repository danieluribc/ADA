// src/components/admin/AdminHeader.tsx
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface AdminHeaderProps {
    title: string;
    subtitle: string;
}

/**
 * SERVER ACTION CENTRALIZADA
 */
async function handleLogoutAction() {
    "use server";

    const supabase = createSupabaseAdminClient();
    await supabase.auth.signOut();

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    allCookies.forEach(cookie => {
        if (cookie.name.startsWith('sb-') || cookie.name.includes('auth')) {
            cookieStore.set({
                name: cookie.name,
                value: '',
                expires: new Date(0),
                path: '/',
            });
        }
    });

    redirect("/admin/login");
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
    return (
        <header className="border-b border-primary pb-6 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
                <h1 className="font-headline-lg tracking-wider text-primary uppercase font-light">
                    {title}
                </h1>
                <p className="font-label-caps text-on-surface-variant text-xs mt-1 tracking-widest">
                    {subtitle}
                </p>
            </div>

            {/* CORRECCIÓN: ID único al formulario para evitar envíos automáticos del navegador */}
            <form action={handleLogoutAction} id="admin-logout-form">
                <button
                    type="submit"
                    form="admin-logout-form" // Vinculación estricta al formulario
                    className="border border-primary bg-background text-primary px-4 py-2 font-label-caps text-xs tracking-widest uppercase hover:bg-primary hover:text-background transition-all duration-200 cursor-pointer"
                >
                    CERRAR SESIÓN
                </button>
            </form>
        </header>
    );
}