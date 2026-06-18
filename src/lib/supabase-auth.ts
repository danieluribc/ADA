export const AUTH_STORAGE_KEY = "supabase.auth.token";

type CookieStorage = {
  isServer?: boolean;
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan las variables de entorno públicas de Supabase.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

function getCookieAttributes() {
  const attributes = ["path=/", "SameSite=Lax"];

  if (process.env.NODE_ENV === "production") {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

function getCookieOptions() {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function getBrowserCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}

function setBrowserCookie(name: string, value: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; ${getCookieAttributes()}`;
}

function removeBrowserCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; Max-Age=0; ${getCookieAttributes()}`;
}

export function createCookieStorage(): CookieStorage {
  return {
    isServer: typeof window === "undefined",
    async getItem(key) {
      return getBrowserCookie(key);
    },
    async setItem(key, value) {
      setBrowserCookie(key, value);
    },
    async removeItem(key) {
      removeBrowserCookie(key);
    },
  };
}

export { getCookieOptions };
