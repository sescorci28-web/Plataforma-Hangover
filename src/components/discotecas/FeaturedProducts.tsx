"use client";

import { Wine, Plus, Sparkles, Check } from "lucide-react";
import { useState } from "react";

interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  featured: boolean;
  available: boolean;
}

interface FeaturedProductsProps {
  clubId: string;
  menuItems: MenuItem[];
}

export function FeaturedProducts({ clubId, menuItems }: FeaturedProductsProps) {
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  // Display up to 6 products
  // Sort featured products first, then others
  const sortedProducts = [...menuItems]
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    })
    .slice(0, 6);

  const handleAddToCart = (product: MenuItem) => {
    if (!product.available) return;

    const cartKey = "hangover_menu_cart";
    let cartData = { clubId: clubId, items: [] as any[] };

    try {
      const existing = localStorage.getItem(cartKey);
      if (existing) {
        const parsed = JSON.parse(existing);
        if (parsed.clubId === clubId && Array.isArray(parsed.items)) {
          cartData = parsed;
        }
      }
    } catch (e) {
      console.error("Error reading cart from localStorage:", e);
    }

    const items = [...cartData.items];
    const existingIndex = items.findIndex((i: any) => i.id === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += 1;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1,
      });
    }

    cartData.items = items;
    localStorage.setItem(cartKey, JSON.stringify(cartData));

    // Notify other components like ClubTabs
    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("storage"));

    // Show temporary "added" animation checkmark
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  if (sortedProducts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          Carta Destacada
        </h3>
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
          Los más recomendados
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {sortedProducts.map((product) => {
          const isAdded = addedItems[product.id];
          return (
            <div
              key={product.id}
              className={`group glass-card p-4 bg-zinc-950/40 hover:bg-zinc-950/60 border border-white/5 hover:border-primary-500/20 transition-all duration-300 rounded-2xl flex flex-col justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative overflow-hidden ${
                !product.available ? "opacity-60 saturate-50" : ""
              }`}
            >
              {/* Product Card Top */}
              <div>
                <div className="w-full h-40 rounded-xl border border-white/10 bg-zinc-900 overflow-hidden relative mb-4">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900/60 text-zinc-700">
                      <Wine className="w-10 h-10" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                    {product.featured && (
                      <span className="text-[9px] text-amber-300 bg-amber-950/80 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow">
                        ★ Destacado
                      </span>
                    )}
                    {!product.available && (
                      <span className="text-[9px] text-red-300 bg-red-950/90 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow">
                        Agotado
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
                    {product.category}
                  </span>
                  <h4 className="font-bold text-white text-base truncate font-outfit group-hover:text-primary-400 transition-colors">
                    {product.name}
                  </h4>
                  {product.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                      {product.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Price and Cart Button */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-3.5 border-t border-white/5">
                <span className="text-sm font-extrabold text-emerald-400 font-outfit">
                  ${product.price.toLocaleString("es-CO")} COP
                </span>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.available}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer select-none ${
                    !product.available
                      ? "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed"
                      : isAdded
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                      : "bg-primary-600 hover:bg-primary-500 text-white border-primary-500/10 shadow-[0_4px_15px_rgba(236,72,153,0.15)] hover:shadow-[0_4px_20px_rgba(236,72,153,0.3)] hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 animate-bounce" />
                      <span>Agregado</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
