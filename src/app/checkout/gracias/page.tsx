import Link from "next/link";

export default function CheckoutThankYouPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-container-margin py-section-gap">
      <section className="w-full max-w-3xl text-center">
        <p className="font-label-caps text-on-surface-variant">ADA / GRACIAS</p>
        <h1 className="mt-6 font-headline-lg text-primary">
          GRACIAS POR TU COMPRA. TU ORDEN HA SIDO REGISTRADA.
        </h1>
        <p className="mt-6 font-body-lg text-on-surface-variant">
          Hemos enviado un correo de confirmación con los detalles de tu envío.
        </p>
        <Link
          href="/tienda"
          className="mt-10 inline-flex w-full items-center justify-center bg-primary px-8 py-5 font-label-caps tracking-widest text-on-primary transition-all hover:bg-neon-lime hover:text-primary md:w-auto"
        >
          VOLVER A LA TIENDA
        </Link>
      </section>
    </main>
  );
}
