"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Info,
  Wine,
  Settings2,
  Sparkles,
  Star,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Local SVG icon to avoid version mismatch in lucide-react
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

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

interface ClubService {
  id: string;
  name: string;
  description: string;
  price: number | null;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
}

interface ClubTabsProps {
  clubId: string;
  clubName: string;
  clubDescription: string | null;
  clubAddress: string | null;
  clubOpeningHours: string | null;
  clubInstagram: string | null;
  menuItems: MenuItem[];
  clubServices: ClubService[];
}

const CATEGORIES = [
  "Todos",
  "Whisky",
  "Vodka",
  "Ron",
  "Tequila",
  "Cerveza",
  "Cócteles",
  "Hookahs",
  "Comida",
  "Combos",
  "Otros"
] as const;

export function ClubTabs({
  clubId,
  clubName,
  clubDescription,
  clubAddress,
  clubOpeningHours,
  clubInstagram,
  menuItems,
  clubServices,
}: ClubTabsProps) {
  const [activeTab, setActiveTab] = useState<"info" | "menu" | "services">("info");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  
  // Local Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [orderSimulated, setOrderSimulated] = useState(false);

  // Sync and validate cart on load
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedCartRaw = localStorage.getItem("hangover_menu_cart");
      if (savedCartRaw) {
        const savedCart = JSON.parse(savedCartRaw);
        if (savedCart.clubId === clubId && Array.isArray(savedCart.items)) {
          setCart(savedCart.items);
        } else {
          // Different club or corrupted data, reset
          localStorage.removeItem("hangover_menu_cart");
          setCart([]);
        }
      }
    } catch (err) {
      console.error("Error cargando el carrito:", err);
    }
  }, [clubId]);

  // Save cart changes helper
  const saveCart = (newItems: CartItem[]) => {
    setCart(newItems);
    try {
      localStorage.setItem(
        "hangover_menu_cart",
        JSON.stringify({
          clubId,
          items: newItems,
        })
      );
    } catch (err) {
      console.error("Error guardando el carrito:", err);
    }
  };

  // Cart operations
  const addToCart = (item: MenuItem) => {
    if (item.available === false) return;
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      saveCart(
        cart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      saveCart([
        ...cart,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);
    saveCart(updated);
  };

  const removeFromCart = (itemId: string) => {
    saveCart(cart.filter((item) => item.id !== itemId));
  };

  const simulateCheckout = () => {
    setOrderSimulated(true);
    setTimeout(() => {
      setOrderSimulated(false);
      saveCart([]);
      setIsCartOpen(false);
    }, 4000);
  };

  // Calculate totals
  const totalItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  // Group and count menu items
  const categoryCounts = menuItems.reduce((acc, item) => {
    const cat = item.category || "Otros";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Determine categories with at least 1 product
  const visibleCategories = [
    "Todos",
    ...CATEGORIES.slice(1).filter((cat) => (categoryCounts[cat] || 0) > 0),
  ];

  // Featured items list
  const featuredItems = menuItems.filter((item) => item.featured);

  // Filtered menu items for the current active list
  const filteredMenuItems = menuItems.filter((item) => {
    if (selectedCategory === "Todos") return true;
    return item.category === selectedCategory;
  });

  const hasMenu = menuItems.length > 0;
  const hasServices = clubServices.length > 0;

  return (
    <div className="space-y-6 relative">
      {/* Navigation Tabs */}
      <div className="flex border-b border-white/5 p-1 bg-black/30 rounded-2xl gap-2 shrink-0 max-w-md">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === "info"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          Información
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === "menu"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Wine className="w-3.5 h-3.5" />
          Carta / Menú
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === "services"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Servicios
        </button>
      </div>

      {/* Tab Contents with animations */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          {activeTab === "info" && (
            <motion.div
              key="info-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white font-outfit">Sobre {clubName}</h3>
                <p className="text-zinc-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {clubDescription || "Esta discoteca no cuenta con una descripción detallada en este momento."}
                </p>
              </div>

              {/* Grid cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl border border-white/5 bg-gradient-to-tr from-white/5 to-transparent">
                  <h4 className="font-bold text-white mb-2 text-sm font-outfit">Servicio de Reservas</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Reserva mesas VIP, botellas y accesos rápidos directamente sin comisiones adicionales.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-white/5 bg-gradient-to-tr from-white/5 to-transparent">
                  <h4 className="font-bold text-white mb-2 text-sm font-outfit">Seguridad Garantizada</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Acceso seguro con control digital de entradas. Tu diversión está protegida con Hangover.
                  </p>
                </div>
              </div>

              {/* Location details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clubAddress && (
                  <div className="p-5 rounded-2xl border border-white/5 bg-black/30">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Dirección</p>
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-zinc-300 leading-relaxed">{clubAddress}</p>
                    </div>
                  </div>
                )}

                {clubOpeningHours && (
                  <div className="p-5 rounded-2xl border border-white/5 bg-black/30">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Horario</p>
                    <div className="flex gap-3">
                      <Clock className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-zinc-300 leading-relaxed">{clubOpeningHours}</p>
                    </div>
                  </div>
                )}

                {clubInstagram && (
                  <div className="p-5 rounded-2xl border border-white/5 bg-black/30 sm:col-span-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Redes Sociales</p>
                    <div className="flex gap-3">
                      <InstagramIcon className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                      <a
                        href={`https://instagram.com/${clubInstagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-400 hover:text-primary-300 transition-colors hover:underline font-semibold"
                      >
                        {clubInstagram}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "menu" && (
            <motion.div
              key="menu-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {!hasMenu ? (
                <div className="text-center py-16 border border-white/5 bg-black/20 rounded-2xl">
                  <Wine className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-white mb-1">Carta no disponible</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Esta discoteca aún no ha publicado su menú de productos.
                  </p>
                </div>
              ) : (
                <>
                  {/* Category Filter Bar */}
                  <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide shrink-0 border-b border-white/5">
                    {visibleCategories.map((cat) => {
                      const count =
                        cat === "Todos" ? menuItems.length : categoryCounts[cat] || 0;
                      const isActive = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`relative px-4.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                            isActive
                              ? "bg-gradient-to-r from-primary-600 to-accent-600 text-white border-primary-500 shadow-md shadow-primary-500/20"
                              : "bg-white/5 text-zinc-400 border-white/5 hover:text-zinc-200 hover:bg-white/10"
                          }`}
                        >
                          <span>{cat}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                              isActive ? "bg-white/20 text-white" : "bg-white/5 text-zinc-500"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 🔥 "Más vendidos" / Featured Row */}
                  {selectedCategory === "Todos" && featuredItems.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest pl-1 border-l-2 border-amber-500 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                        🔥 Más vendidos / Destacados
                      </h4>

                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {featuredItems.map((item) => (
                          <div
                            key={`featured-${item.id}`}
                            className={`glass-card p-4 bg-zinc-950/60 border border-amber-500/20 hover:border-amber-500/40 transition-all rounded-2xl flex flex-col justify-between w-64 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.05)] relative ${
                              item.available === false ? "opacity-60 saturate-50" : ""
                            }`}
                          >
                            <div>
                              <div className="w-full h-32 rounded-xl border border-white/5 bg-zinc-900 overflow-hidden relative mb-3">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                                    <Wine className="w-8 h-8" />
                                  </div>
                                )}
                                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                                  <span className="text-[9px] text-amber-300 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    🔥 TOP
                                  </span>
                                  {item.available === false && (
                                    <span className="text-[9px] text-red-300 bg-red-950/85 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                      AGOTADO
                                    </span>
                                  )}
                                </div>
                              </div>
                              <h5 className="font-bold text-white text-sm truncate font-outfit">
                                {item.name}
                              </h5>
                              <p className="text-[10px] text-zinc-500 uppercase font-semibold mt-0.5 tracking-wider">
                                {item.category}
                              </p>
                              {item.description && (
                                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed min-h-[2rem]">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5">
                              <span className="text-xs font-extrabold text-emerald-400">
                                ${item.price.toLocaleString("es-CO")}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                disabled={item.available === false}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  item.available !== false
                                    ? "bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-500/10 active:scale-95"
                                    : "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                                }`}
                              >
                                {item.available !== false ? "Agregar" : "Agotado"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filtered Menu Cards Grid */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-primary-400 uppercase tracking-widest pl-1 border-l-2 border-primary-500">
                      {selectedCategory === "Todos" ? "Todos los Productos" : selectedCategory}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredMenuItems.map((item) => (
                        <div
                          key={item.id}
                          className={`glass-card p-4 bg-zinc-950/40 border border-white/5 hover:border-white/10 transition-all rounded-2xl flex gap-4 items-center relative ${
                            item.available === false ? "opacity-60 saturate-50" : ""
                          }`}
                        >
                          <div className="w-18 h-18 rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shrink-0 relative">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                                <Wine className="w-7 h-7" />
                              </div>
                            )}
                            {item.available === false && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-[9px] text-red-400 bg-red-950/90 border border-red-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                  AGOTADO
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-grow pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-bold text-white text-sm truncate font-outfit">
                                {item.name}
                              </h5>
                              {item.featured && (
                                <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded-full font-bold">
                                  🔥 TOP
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            <p className="text-xs font-extrabold text-emerald-400 mt-1">
                              ${item.price.toLocaleString("es-CO")} COP
                            </p>
                          </div>
                          <div className="shrink-0">
                            <button
                              onClick={() => addToCart(item)}
                              disabled={item.available === false}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                item.available !== false
                                  ? "bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-500/10 active:scale-90"
                                  : "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                              }`}
                              title={item.available !== false ? "Agregar al carrito" : "Agotado"}
                            >
                              {item.available !== false ? <Plus className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === "services" && (
            <motion.div
              key="services-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {!hasServices ? (
                <div className="text-center py-16 border border-white/5 bg-black/20 rounded-2xl">
                  <Settings2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-white mb-1">Servicios no especificados</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Esta discoteca no tiene catálogo de servicios adicionales en el sistema.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clubServices.map((service) => (
                    <div
                      key={service.id}
                      className="p-5 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-xl">
                        <h5 className="font-bold text-white text-sm font-outfit flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                          {service.name}
                        </h5>
                        <p className="text-xs text-zinc-400 leading-relaxed">{service.description}</p>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Precio</p>
                        <p className="text-sm font-extrabold text-accent-400 font-outfit mt-0.5">
                          {service.price && Number(service.price) > 0
                            ? `$${Number(service.price).toLocaleString("es-CO")} COP`
                            : "Incluido"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Shopping Cart Button */}
      {isMounted && cart.length > 0 && activeTab === "menu" && (
        <motion.button
          initial={{ scale: 0, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 50 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white px-5 py-4 rounded-full shadow-[0_0_30px_rgba(217,70,239,0.3)] flex items-center gap-3 border border-white/10 cursor-pointer backdrop-blur-md"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-2.5 -right-2.5 bg-white text-zinc-950 text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md">
              {totalItemsCount}
            </span>
          </div>
          <span className="text-xs font-bold font-outfit tracking-wide hidden sm:inline">
            Ver Pedido (${cartTotal.toLocaleString("es-CO")} COP)
          </span>
        </motion.button>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!orderSimulated) setIsCartOpen(false);
              }}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            />
            {/* Drawer container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-zinc-950 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col h-full overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20">
                <div>
                  <h3 className="text-base font-bold text-white font-outfit flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-primary-400" />
                    <span>Tu Pedido en Vivo</span>
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{clubName}</p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  disabled={orderSimulated}
                  className="w-8 h-8 rounded-full border border-white/5 bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-grow overflow-y-auto p-5 space-y-4">
                {orderSimulated ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                    >
                      <CheckCircle2 className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]" />
                    </motion.div>
                    <div className="space-y-2 max-w-xs">
                      <h4 className="text-lg font-bold text-white font-outfit">¡Pedido Generado!</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Tu pre-pedido local se ha registrado con éxito para esta mesa en{" "}
                        <span className="text-white font-medium">{clubName}</span>.
                      </p>
                      <p className="text-[11px] text-primary-400 font-medium">
                        Código Temporal: HNGR-{Math.floor(1000 + Math.random() * 9000)}
                      </p>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 mt-4">
                        <p className="text-[10px] text-zinc-400">
                          Muestra esta pantalla a tu mesero o en la barra para que preparen y carguen tu orden a tu mesa.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-8">
                    <Wine className="w-12 h-12 text-zinc-700" />
                    <p className="text-sm font-bold text-white">El carrito está vacío</p>
                    <p className="text-xs text-zinc-500 max-w-xs">
                      Agrega botellas, tragos o comida desde la carta de la discoteca.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={`cart-item-${item.id}`}
                      className="p-3.5 bg-black/40 rounded-xl border border-white/5 flex gap-3.5 items-center justify-between"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-lg border border-white/10 bg-zinc-900 overflow-hidden shrink-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                              <Wine className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-white text-xs truncate font-outfit">
                            {item.name}
                          </h5>
                          <p className="text-[11px] font-semibold text-zinc-500 mt-0.5">
                            ${item.price.toLocaleString("es-CO")} COP c/u
                          </p>
                          <p className="text-xs font-bold text-emerald-400 mt-1">
                            ${(item.price * item.quantity).toLocaleString("es-CO")} COP
                          </p>
                        </div>
                      </div>

                      {/* Quantity Selector & Action Button */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {!orderSimulated && cart.length > 0 && (
                <div className="p-5 border-t border-white/5 bg-black/40 space-y-4 shrink-0">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-zinc-400">
                      <span>Subtotal</span>
                      <span>${cartTotal.toLocaleString("es-CO")} COP</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-extrabold text-white pt-1 border-t border-white/5">
                      <span>Total de la Cuenta</span>
                      <span className="text-emerald-400 font-outfit">
                        ${cartTotal.toLocaleString("es-CO")} COP
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Este pedido se guarda localmente en tu app. Presiona el botón para confirmar y
                      poder mostrarlo en barra/mesa para despacho.
                    </p>
                  </div>

                  <button
                    onClick={simulateCheckout}
                    className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white py-3 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/15 cursor-pointer active:scale-98"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Confirmar Pedido Local
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
