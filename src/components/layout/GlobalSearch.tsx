'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  User, 
  Wrench, 
  Building2, 
  Calendar, 
  Sparkles, 
  Clock, 
  Trash2, 
  Loader2,
  ExternalLink,
  Star
} from 'lucide-react';
import { searchUniversal } from '@/app/services/searchActions';
import { motion, AnimatePresence } from 'framer-motion';

interface GlobalSearchProps {
  userEmail?: string;
}

interface RecentSearchItem {
  id: string;
  type: 'persona' | 'proveedor' | 'discoteca' | 'evento' | 'servicio';
  title: string;
  subtitle?: string;
  image?: string | null;
  link: string;
  timestamp: number;
}

export function GlobalSearch({ userEmail = 'anonymous' }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [results, setResults] = useState<{
    personas: any[];
    proveedores: any[];
    discotecas: any[];
    eventos: any[];
    servicios: any[];
  }>({
    personas: [],
    proveedores: [],
    discotecas: [],
    eventos: [],
    servicios: []
  });

  // LocalStorage key unique to user
  const recentKey = `hangover_recent_searches_${userEmail}`;

  // Load recent searches on mount or user change
  useEffect(() => {
    const saved = localStorage.getItem(recentKey);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [recentKey]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({
        personas: [],
        proveedores: [],
        discotecas: [],
        eventos: [],
        servicios: []
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const searchResults = await searchUniversal(query);
        setResults(searchResults);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Add item to recent searches
  const handleAddRecent = (item: Omit<RecentSearchItem, 'timestamp'>) => {
    const newItem: RecentSearchItem = {
      ...item,
      timestamp: Date.now()
    };
    
    // Filter duplicates
    const filtered = recentSearches.filter(x => x.id !== item.id);
    const updated = [newItem, ...filtered].slice(0, 5); // max 5
    
    setRecentSearches(updated);
    localStorage.setItem(recentKey, JSON.stringify(updated));
    setIsFocused(false);
    setIsMobileOpen(false);
  };

  // Remove single item from recent searches
  const handleRemoveRecent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = recentSearches.filter(x => x.id !== id);
    setRecentSearches(updated);
    localStorage.setItem(recentKey, JSON.stringify(updated));
  };

  // Clean query input
  const clearSearch = () => {
    setQuery('');
    setResults({
      personas: [],
      proveedores: [],
      discotecas: [],
      eventos: [],
      servicios: []
    });
  };

  // Mock static Trends (Popular options)
  const trends = {
    profiles: [
      { id: 't-p-1', name: 'Carlos DJ', link: '/connect?userId=carlos-dj-id', avatar: null },
      { id: 't-p-2', name: 'Laura Gómez', link: '/connect?userId=laura-gomez-id', avatar: null }
    ],
    clubs: [
      { id: 't-c-1', name: 'Hangover Club', link: '/discotecas/hangover-club', rating: 4.9 },
      { id: 't-c-2', name: 'Dulcinea Medellín', link: '/discotecas/dulcinea-medellin', rating: 4.8 }
    ],
    events: [
      { id: 't-e-1', name: 'Medellín Electronic Fest', link: '/events', date: 'Jul 24' }
    ]
  };

  const hasResults = 
    results.personas.length > 0 ||
    results.proveedores.length > 0 ||
    results.discotecas.length > 0 ||
    results.eventos.length > 0 ||
    results.servicios.length > 0;

  // Render Result Row Helper
  const renderResultItem = (
    id: string,
    type: RecentSearchItem['type'],
    title: string,
    subtitle: string | undefined,
    image: string | null | undefined,
    link: string,
    buttonText: string,
    extraBadge?: React.ReactNode
  ) => {
    const initials = title[0]?.toUpperCase() || 'H';
    
    return (
      <Link
        href={link}
        onClick={() => handleAddRecent({ id, type, title, subtitle, image, link })}
        className="flex items-center justify-between p-3 rounded-2xl bg-white/2 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all gap-4 group"
      >
        <div className="flex items-center gap-3 min-w-0">
          {image ? (
            <img src={image} alt={title} className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-purple-650/15 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-white truncate group-hover:text-primary-400 transition-colors">{title}</span>
              {extraBadge}
            </div>
            {subtitle && <p className="text-[10px] text-zinc-450 truncate">{subtitle}</p>}
          </div>
        </div>
        <button className="px-3 py-1.5 bg-white/5 group-hover:bg-primary-600 text-zinc-300 group-hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0 border border-white/5 group-hover:border-primary-500 flex items-center gap-1 cursor-pointer">
          <span>{buttonText}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </button>
      </Link>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full md:w-[380px] lg:w-[420px]">
      
      {/* Desktop Search Input */}
      <div className="hidden md:block relative z-30">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-zinc-500" />
        </div>
        <input
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar personas, discotecas, eventos o servicios..."
          className="w-full bg-[#0d0d16] border border-white/10 rounded-full py-2.5 pl-10 pr-9 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-zinc-500 transition-all font-outfit"
        />
        {query && (
          <button 
            onClick={clearSearch}
            className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mobile Search Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Buscar..."
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Dropdown Panel */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute left-0 right-0 top-full mt-2 bg-[#09090f] border border-white/10 rounded-3xl shadow-2xl p-5 z-40 max-h-[500px] overflow-y-auto scrollbar-thin space-y-5"
          >
            {/* 1. Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Buscando en Hangover...</span>
              </div>
            )}

            {/* 2. Empty Input: Show Recent Searches & Trends */}
            {!loading && !query && (
              <div className="space-y-4">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Búsquedas Recientes
                    </h5>
                    <div className="space-y-1.5">
                      {recentSearches.map(item => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                          onClick={() => {
                            router.push(item.link);
                            setIsFocused(false);
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.image ? (
                              <img src={item.image} alt={item.title} className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs text-zinc-400">
                                {item.title[0]?.toUpperCase() || 'H'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate block">{item.title}</span>
                              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">{item.type}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleRemoveRecent(item.id, e)}
                            className="p-1 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Trends */}
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Tendencias Populares
                  </h5>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">🔥 Locales y DJs</span>
                      {trends.clubs.map(c => (
                        <Link 
                          key={c.id} 
                          href={c.link}
                          onClick={() => handleAddRecent({ id: c.id, type: 'discoteca', title: c.name, link: c.link })}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/2 hover:bg-white/5 transition-all text-zinc-350 hover:text-white font-bold"
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="text-[9px] text-amber-400 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-amber-450" /> {c.rating}</span>
                        </Link>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">🎉 Eventos Destacados</span>
                      {trends.events.map(e => (
                        <Link 
                          key={e.id} 
                          href={e.link}
                          onClick={() => handleAddRecent({ id: e.id, type: 'evento', title: e.name, link: e.link })}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/2 hover:bg-white/5 transition-all text-zinc-350 hover:text-white font-bold"
                        >
                          <span className="truncate">{e.name}</span>
                          <span className="text-[9px] text-purple-400 font-extrabold">{e.date}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Has Query: Show Results Grouped */}
            {!loading && query && hasResults && (
              <div className="space-y-4">
                
                {/* 👤 PERSONAS */}
                {results.personas.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-1">👤 Personas</h6>
                    <div className="space-y-2">
                      {results.personas.map(p => 
                        renderResultItem(
                          p.id, 
                          'persona', 
                          p.full_name || 'Usuario', 
                          p.username ? `@${p.username}` : undefined, 
                          p.avatar_url, 
                          `/connect?userId=${p.id}`, 
                          'Ver Perfil',
                          p.city && p.city !== "No especificada" ? (
                            <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-zinc-400 font-bold uppercase">{p.city}</span>
                          ) : null
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* 🛠 PROVEEDORES */}
                {results.proveedores.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-1">🛠 Proveedores</h6>
                    <div className="space-y-2">
                      {results.proveedores.map(p => 
                        renderResultItem(
                          p.id, 
                          'proveedor', 
                          p.full_name || 'Proveedor', 
                          p.city ? `Ciudad: ${p.city}` : undefined, 
                          p.avatar_url, 
                          `/connect?userId=${p.id}`, 
                          'Ver Perfil',
                          <span className="text-[7.5px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded font-black uppercase">PROV</span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* 🏛 DISCOTECAS */}
                {results.discotecas.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-1">🏛 Discotecas</h6>
                    <div className="space-y-2">
                      {results.discotecas.map(c => 
                        renderResultItem(
                          c.id, 
                          'discoteca', 
                          c.name, 
                          c.city ? `Ciudad: ${c.city}` : undefined, 
                          c.logo || c.banner_image, 
                          `/discotecas/${c.slug}`, 
                          'Ver Discoteca',
                          c.rating && (
                            <span className="text-[8px] text-amber-400 flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded font-black"><Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> {c.rating}</span>
                          )
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* 🎉 EVENTOS */}
                {results.eventos.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-1">🎉 Eventos</h6>
                    <div className="space-y-2">
                      {results.eventos.map(e => {
                        const dateText = new Date(e.event_date).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short'
                        });
                        return renderResultItem(
                          e.id, 
                          'evento', 
                          e.title, 
                          e.city ? `${dateText} • Ciudad: ${e.city}` : dateText, 
                          e.image_url, 
                          `/events`, 
                          'Ver Evento'
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ⭐ SERVICIOS */}
                {results.servicios.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-1">⭐ Servicios</h6>
                    <div className="space-y-2">
                      {results.servicios.map(s => 
                        renderResultItem(
                          s.id, 
                          'servicio', 
                          s.title, 
                          s.category ? `Categoría: ${s.category} • Desde $${Math.round(s.price).toLocaleString('es-CO')}` : `Desde $${Math.round(s.price).toLocaleString('es-CO')}`, 
                          s.image_url, 
                          `/services`, 
                          'Ver Servicio',
                          s.provider?.full_name && (
                            <span className="text-[8px] text-purple-300 font-bold">por {s.provider.full_name}</span>
                          )
                        )
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 4. No Results State */}
            {!loading && query && !hasResults && (
              <div className="text-center py-10 px-4 space-y-4">
                <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center mx-auto text-zinc-500 select-none">
                  🔍
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-black text-white font-outfit uppercase tracking-wider">No encontramos resultados</h5>
                  <p className="text-[10px] text-zinc-500 leading-relaxed max-w-xs mx-auto">Prueba buscando otros términos o navega por nuestro catálogo completo.</p>
                </div>
                <Link 
                  href="/services"
                  onClick={() => setIsFocused(false)}
                  className="inline-flex bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Explorar Marketplace
                </Link>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Fullscreen Search Modal */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#030307] flex flex-col p-4 md:hidden overflow-y-auto"
          >
            {/* Header Mobile Search */}
            <div className="flex items-center gap-3 shrink-0 pb-4 border-b border-white/5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={query}
                  autoFocus
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar perfiles, discotecas..."
                  className="w-full bg-[#0d0d16] border border-white/10 rounded-full py-2.5 pl-10 pr-9 text-xs text-white focus:outline-none placeholder:text-zinc-500 font-outfit"
                />
                {query && (
                  <button 
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-3 flex items-center text-zinc-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="text-xs text-zinc-400 font-bold px-2 py-1.5"
              >
                Cerrar
              </button>
            </div>

            {/* Mobile Content (Matches Dropdown logic) */}
            <div className="flex-1 overflow-y-auto pt-4 pb-12 space-y-6">
              
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Buscando...</span>
                </div>
              )}

              {!loading && !query && (
                <div className="space-y-5">
                  {/* Recents */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Recientes
                      </h5>
                      <div className="space-y-2">
                        {recentSearches.map(item => (
                          <div 
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-2xl bg-white/2 border border-white/5"
                            onClick={() => {
                              router.push(item.link);
                              setIsMobileOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.image ? (
                                <img src={item.image} alt={item.title} className="w-8 h-8 rounded-lg object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs text-zinc-400">
                                  {item.title[0]?.toUpperCase() || 'H'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-zinc-200 truncate block">{item.title}</span>
                                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold block">{item.type}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleRemoveRecent(item.id, e)}
                              className="p-2 bg-white/5 rounded-xl text-zinc-500 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trends */}
                  <div className="space-y-4 border-t border-white/5 pt-4">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Tendencias Populares
                    </h5>
                    
                    <div className="flex flex-col gap-2.5 text-xs">
                      {trends.clubs.map(c => (
                        <Link 
                          key={c.id} 
                          href={c.link}
                          onClick={() => handleAddRecent({ id: c.id, type: 'discoteca', title: c.name, link: c.link })}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-white/2 border border-white/5 text-zinc-300 hover:text-white font-bold"
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="text-[9px] text-amber-400 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-amber-450" /> {c.rating}</span>
                        </Link>
                      ))}
                      {trends.events.map(e => (
                        <Link 
                          key={e.id} 
                          href={e.link}
                          onClick={() => handleAddRecent({ id: e.id, type: 'evento', title: e.name, link: e.link })}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-white/2 border border-white/5 text-zinc-300 hover:text-white font-bold"
                        >
                          <span className="truncate">{e.name}</span>
                          <span className="text-[9px] text-purple-400 font-extrabold">{e.date}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!loading && query && hasResults && (
                <div className="space-y-5">
                  {/* Personas */}
                  {results.personas.length > 0 && (
                    <div className="space-y-2.5">
                      <h6 className="text-[9px] font-black uppercase tracking-widest text-zinc-550 border-b border-white/5 pb-1">👤 Personas</h6>
                      {results.personas.map(p => 
                        renderResultItem(p.id, 'persona', p.full_name || 'Usuario', p.username ? `@${p.username}` : undefined, p.avatar_url, `/connect?userId=${p.id}`, 'Perfil')
                      )}
                    </div>
                  )}

                  {/* Proveedores */}
                  {results.proveedores.length > 0 && (
                    <div className="space-y-2.5">
                      <h6 className="text-[9px] font-black uppercase tracking-widest text-zinc-550 border-b border-white/5 pb-1">🛠 Proveedores</h6>
                      {results.proveedores.map(p => 
                        renderResultItem(p.id, 'proveedor', p.full_name || 'Proveedor', p.city, p.avatar_url, `/connect?userId=${p.id}`, 'Perfil')
                      )}
                    </div>
                  )}

                  {/* Discotecas */}
                  {results.discotecas.length > 0 && (
                    <div className="space-y-2.5">
                      <h6 className="text-[9px] font-black uppercase tracking-widest text-zinc-550 border-b border-white/5 pb-1">🏛 Discotecas</h6>
                      {results.discotecas.map(c => 
                        renderResultItem(c.id, 'discoteca', c.name, c.city, c.logo || c.banner_image, `/discotecas/${c.slug}`, 'Club')
                      )}
                    </div>
                  )}

                  {/* Eventos */}
                  {results.eventos.length > 0 && (
                    <div className="space-y-2.5">
                      <h6 className="text-[9px] font-black uppercase tracking-widest text-zinc-550 border-b border-white/5 pb-1">🎉 Eventos</h6>
                      {results.eventos.map(e => 
                        renderResultItem(e.id, 'evento', e.title, e.city, e.image_url, `/events`, 'Evento')
                      )}
                    </div>
                  )}

                  {/* Servicios */}
                  {results.servicios.length > 0 && (
                    <div className="space-y-2.5">
                      <h6 className="text-[9px] font-black uppercase tracking-widest text-zinc-550 border-b border-white/5 pb-1">⭐ Servicios</h6>
                      {results.servicios.map(s => 
                        renderResultItem(s.id, 'servicio', s.title, s.category, s.image_url, `/services`, 'Servicio')
                      )}
                    </div>
                  )}
                </div>
              )}

              {!loading && query && !hasResults && (
                <div className="text-center py-16 px-4 space-y-4">
                  <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center mx-auto text-zinc-500">
                    🔍
                  </div>
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-black text-white font-outfit uppercase tracking-wider">No encontramos resultados</h5>
                    <p className="text-[10px] text-zinc-500 leading-relaxed max-w-xs mx-auto">Intenta modificando tu término de búsqueda.</p>
                  </div>
                  <Link 
                    href="/services"
                    onClick={() => setIsMobileOpen(false)}
                    className="inline-flex bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Explorar Marketplace
                  </Link>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
