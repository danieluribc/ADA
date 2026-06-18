"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import toast from "react-hot-toast";
import { AUTH_STORAGE_KEY } from "@/lib/supabase-auth";

const supabase = createClientComponentClient({
  cookieOptions: {
    name: AUTH_STORAGE_KEY,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    domain: undefined,
  },
});

type ProfileRow = {
  role: string | null;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function verifyExistingSession() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!isActive || !sessionData.session) {
        return;
      }

      const { data: userData } = await supabase.auth.getUser();

      if (!isActive || !userData.user) {
        return;
      }

      const { data: profile } = (await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single()) as { data: ProfileRow | null };

      if (profile?.role === "admin") {
        router.replace("/admin/productos");
        return;
      }

      await supabase.auth.signOut();
    }

    verifyExistingSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      if (!email || !password) {
        toast.error("Correo electrónico y contraseña son requeridos.");
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        toast.error("Correo electrónico o contraseña inválidos.");
        return;
      }

      const { data: profile, error: profileError } = (await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single()) as { data: ProfileRow | null; error: unknown | null };

      if (profileError || profile?.role !== "admin") {
        await supabase.auth.signOut();
        toast.error("Acceso denegado. No eres administrador.");
        return;
      }

      router.refresh();
      await wait(150);
      router.replace("/admin/productos");
    } catch {
      toast.error("No fue posible iniciar sesión. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-20 text-on-background">
      <section className="w-full max-w-md" aria-labelledby="admin-login-title">
        <p className="text-center font-label-caps text-on-surface-variant">ADA / ADMIN</p>
        <h1 id="admin-login-title" className="mt-4 text-center font-headline-lg text-primary">
          Inicio de sesión
        </h1>
        <p className="mt-4 text-center font-body-md text-on-surface-variant">
          Ingresa solo si tienes acceso autorizado al panel.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 grid gap-8">
          <label className="grid gap-2">
            <span className="font-label-caps text-on-surface-variant">
              Correo electrónico
            </span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isSubmitting}
              className="border-0 border-b border-primary bg-transparent px-0 py-4 text-primary outline-none placeholder:text-outline focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="admin@ada.com"
            />
          </label>

          <label className="grid gap-2">
            <span className="font-label-caps text-on-surface-variant">Contraseña</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isSubmitting}
              className="border-0 border-b border-primary bg-transparent px-0 py-4 text-primary outline-none placeholder:text-outline focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 border-y border-primary bg-transparent px-0 py-4 font-label-caps tracking-widest text-primary transition-all hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "INGRESANDO..." : "INGRESAR"}
          </button>
        </form>
      </section>
    </div>
  );
}
