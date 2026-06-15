"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

export type ProductFiltersProduct = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  image_url?: string | null;
};

type ProductFiltersProps = {
  products: ProductFiltersProduct[];
  categories: string[];
};

const PAGINATION_PAGES = [1, 2] as const;

function formatPrice(priceInCents: number): string {
  const amount = Math.max(0, priceInCents) / 100;
  const formattedAmount = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return `$${formattedAmount} MXN`;
}

function normalizeCategory(category: string | null): string | null {
  const normalizedCategory = category?.trim().toUpperCase();

  return normalizedCategory && normalizedCategory.length > 0
    ? normalizedCategory
    : null;
}

function ProductImage({ product }: { product: ProductFiltersProduct }) {
  if (!product.image_url) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest text-primary"
        aria-hidden="true"
      >
        <span className="font-display-xl text-5xl tracking-tighter text-primary/20">
          ADA
        </span>
      </div>
    );
  }

  return (
    <Image
      src={product.image_url}
      alt={product.name}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
      unoptimized
    />
  );
}

function ProductCard({ product }: { product: ProductFiltersProduct }) {
  const label = product.category ? "NUEVO" : "ADA";

  return (
    <Link
      href={`/producto/${product.id}`}
      className="group flex flex-col"
      aria-label={`Ver ${product.name}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-high">
        <ProductImage product={product} />

        <span className="absolute left-3 top-3 bg-on-primary px-3 py-2 font-label-caps text-primary">
          {label}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-body-md text-primary">
            {product.name.toUpperCase()}
          </p>
          <p className="mt-1 font-label-caps text-[10px] text-on-surface-variant tracking-widest">
            {normalizeCategory(product.category) ?? "ADA"}
          </p>
        </div>

        <p className="shrink-0 whitespace-nowrap font-label-caps text-primary">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}

function PaginationBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t border-primary/10 bg-background/90 px-container-margin py-4 text-primary backdrop-blur"
      aria-label="Paginación simulada"
    >
      <div className="mx-auto flex max-w-[1920px] items-center justify-center gap-6 font-label-caps">
        <button
          type="button"
          className="transition-opacity hover:opacity-50"
          aria-label="Página anterior"
        >
          ←
        </button>
        {PAGINATION_PAGES.map((page) => (
          <span
            key={page}
            className={
              page === 1
                ? "border-b-2 border-primary"
                : "text-on-surface-variant transition-opacity hover:text-primary"
            }
          >
            {page}
          </span>
        ))}
        <button
          type="button"
          className="transition-opacity hover:opacity-50"
          aria-label="Página siguiente"
        >
          →
        </button>
      </div>
    </nav>
  );
}

export default function ProductFilters({
  products,
  categories,
}: ProductFiltersProps): ReactNode {
  const [selectedCategory, setSelectedCategory] = useState("TODOS");

  const filterOptions = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        categories
          .map((category) => normalizeCategory(category))
          .filter((category): category is string => Boolean(category)),
      ),
    ).sort();

    return ["TODOS", ...uniqueCategories];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "TODOS") {
      return products;
    }

    return products.filter(
      (product) => normalizeCategory(product.category) === selectedCategory,
    );
  }, [products, selectedCategory]);

  return (
    <section className="px-container-margin pb-32 pt-10">
      <div className="border-b border-primary">
        <div className="flex w-full gap-6 overflow-x-auto pb-4 font-label-caps text-on-surface-variant">
          {filterOptions.map((category) => {
            const isActive = category === selectedCategory;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={
                  isActive
                    ? "shrink-0 border-b-2 border-primary pb-4 text-primary"
                    : "shrink-0 border-b-2 border-transparent pb-4 transition-all duration-300 hover:border-primary/30 hover:text-primary"
                }
                aria-current={isActive ? "page" : undefined}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[50vh] items-center justify-center py-20">
          <p className="text-center font-headline-md text-on-surface-variant">
            No hay productos disponibles en esta categoría.
          </p>
        </div>
      )}

      <PaginationBar />
    </section>
  );
}
