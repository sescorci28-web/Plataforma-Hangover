"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { createService, updateService } from "@/app/services/actions";
import {
  Loader2, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight,
  MapPin, MessageCircle, UploadCloud, X, Play, Image as ImageIcon,
  Film, Eye, Star, DollarSign, Tag, AlignLeft, Globe, ChevronRight,
  Sparkles, Check, User, Phone
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Service } from "@/types/database.types";

// ─── Icons ───────────────────────────────────────────────────────────────────
const InstagramIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const FacebookIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// ─── Static data ──────────────────────────────────────────────────────────────
const STATIC_CATEGORIES = [
  { id: "music",    name: "Música y Shows",        icon: "🎵" },
  { id: "sound",    name: "Sonido e Iluminación",   icon: "🔊" },
  { id: "bar",      name: "Bar y Coctelería",       icon: "🍸" },
  { id: "media",    name: "Foto y Contenido",       icon: "📸" },
  { id: "staff",    name: "Staff y Personal",       icon: "👥" },
  { id: "decor",    name: "Decoración",             icon: "🎨" },
  { id: "premium",  name: "Experiencias VIP",       icon: "⭐" },
  { id: "other",    name: "Otros Servicios",        icon: "📦" },
];

const STATIC_SUBCATEGORIES_MAP: Record<string, string[]> = {
  music: ["DJ para fiesta privada", "DJ para discoteca", "Banda en vivo", "Show de entretenimiento", "Artista invitado", "Karaoke y animación"],
  sound: ["Equipo completo de sonido", "Solo iluminación", "Producción técnica", "Show láser", "Pantallas y visuales"],
  bar: ["Barra libre completa", "Bartender individual", "Bar móvil temático", "Coctelería de autor", "Estación de shots"],
  media: ["Fotógrafo de eventos", "Videógrafo profesional", "Cabina fotográfica", "Drone / Aéreo", "Streaming en vivo", "Reels y contenido"],
  staff: ["Meseros", "Anfitrionas / Hostess", "Guardia de seguridad", "Coordinador logístico", "Personal de limpieza"],
  decor: ["Decoración temática", "Globos y arreglos", "Flores y centros de mesa", "Photocall / Backing", "Iluminación decorativa"],
  premium: ["Artista invitado famoso", "Producción integral VIP", "Servicio todo incluido", "Experiencia personalizada"],
  other: ["Catering", "Mobiliario", "Transporte VIP", "Wedding Planner", "Event Planner"],
};

const COLOMBIA_CITIES = ["Barranquilla", "Cartagena", "Medellín", "Bogotá", "Cali", "Santa Marta", "Otro"];

const COUNTRY_CODES = [
  { code: "57", country: "Colombia", display: "🇨🇴 +57" },
  { code: "1", country: "USA/Canada", display: "🇺🇸 +1" },
  { code: "34", country: "España", display: "🇪🇸 +34" },
  { code: "52", country: "México", display: "🇲🇽 +52" },
  { code: "54", country: "Argentina", display: "🇦🇷 +54" },
  { code: "58", country: "Venezuela", display: "🇻🇪 +58" },
  { code: "56", country: "Chile", display: "🇨🇱 +56" },
  { code: "51", country: "Perú", display: "🇵🇪 +51" },
  { code: "593", country: "Ecuador", display: "🇪🇨 +593" },
  { code: "502", country: "Guatemala", display: "🇬🇹 +502" },
  { code: "506", country: "Costa Rica", display: "🇨🇷 +506" },
  { code: "507", country: "Panamá", display: "🇵🇦 +507" },
  { code: "591", country: "Bolivia", display: "🇧🇴 +591" },
  { code: "595", country: "Paraguay", display: "🇵🇾 +595" },
  { code: "598", country: "Uruguay", display: "🇺🇾 +598" },
  { code: "503", country: "El Salvador", display: "🇸🇻 +503" },
  { code: "504", country: "Honduras", display: "🇭🇳 +504" },
  { code: "505", country: "Nicaragua", display: "🇳🇮 +505" },
  { code: "509", country: "Haití", display: "🇭🇹 +509" },
  { code: "590", country: "Guadalupe", display: "🇬🇵 +590" },
  { code: "597", country: "Surinam", display: "🇸🇷 +597" },
  { code: "592", country: "Guyana", display: "🇬🇾 +592" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface UploadedMedia {
  id: string;
  file: File;
  previewUrl: string;
  type: "image" | "video";
  uploading: boolean;
  uploaded: boolean;
  publicUrl: string;
  error: string | null;
}

interface NewServiceFormProps {
  initialService?: Service;
  categories?: Array<{ id: string; slug: string; name: string; icon: string | null }>;
  subcategories?: Array<{ id: string; category_id: string; slug: string; name: string }>;
}

// ─── Helper: upload to Supabase ───────────────────────────────────────────────
async function uploadFileToSupabase(
  file: File,
  userId: string,
  bucket: string,
  mediaType: "image" | "video"
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || (mediaType === "video" ? "mp4" : "jpg");
  const path = `${userId}/${mediaType}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ─── Step indicator ──────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: "Categoría",  icon: "🏷️" },
  { n: 2, label: "Multimedia", icon: "📷" },
  { n: 3, label: "Detalles",   icon: "📝" },
  { n: 4, label: "Publicar",   icon: "🚀" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300 ${
                done    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/25"
                : active ? "bg-white/10 border-2 border-primary-500 text-white scale-110"
                : "bg-white/5 border border-white/10 text-zinc-600"
              }`}>
                {done ? <Check className="w-4 h-4" /> : <span>{s.icon}</span>}
              </div>
              <span className={`text-[9px] mt-1.5 font-black uppercase tracking-wider hidden sm:block ${
                active ? "text-primary-400" : done ? "text-zinc-400" : "text-zinc-600"
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 relative overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary-600"
                  initial={false}
                  animate={{ width: current > s.n ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN FORM ────────────────────────────────────────────────────────────────
export function NewServiceForm({ initialService, categories = [], subcategories = [] }: NewServiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Field state ────────────────────────────────────────────────────────────
  const [category, setCategory] = useState(initialService?.category || "music");
  const [categoryId, setCategoryId] = useState(initialService?.category_id || "");
  const [subcategory, setSubcategory] = useState(initialService?.subcategory || "");
  const [subcategoryId, setSubcategoryId] = useState(initialService?.subcategory_id || "");

  const [mediaList, setMediaList] = useState<UploadedMedia[]>([]);
  // We derive imageUrl (first image) and coverUrl (second image) and videoUrl (first video) from mediaList

  const [title, setTitle] = useState(initialService?.title || "");
  const [description, setDescription] = useState(initialService?.description || "");
  const [price, setPrice] = useState(initialService?.price?.toString() || "");
  const [experience, setExperience] = useState(initialService?.experience || "");
  const [baseCity, setBaseCity] = useState(initialService?.base_city || "Barranquilla");
  const [customCity, setCustomCity] = useState("");
  const [citiesCoverage, setCitiesCoverage] = useState<string[]>(initialService?.cities_coverage || []);
  
  // Parse initial WhatsApp number into country code and local number
  const getInitialPhoneParts = () => {
    const raw = initialService?.whatsapp_number?.replace(/\D/g, "") || "";
    if (!raw) return { code: "57", local: "" };
    
    // Sort from longest code prefix to shortest to avoid partial matches
    const sortedCodes = [
      { code: "593" }, { code: "502" }, { code: "506" }, { code: "507" }, 
      { code: "591" }, { code: "595" }, { code: "598" }, { code: "503" }, 
      { code: "504" }, { code: "505" }, { code: "509" }, { code: "590" }, 
      { code: "597" }, { code: "592" }, { code: "57" }, { code: "34" }, 
      { code: "52" }, { code: "54" }, { code: "58" }, { code: "56" }, 
      { code: "51" }, { code: "1" }
    ];
    for (const c of sortedCodes) {
      if (raw.startsWith(c.code)) {
        return { code: c.code, local: raw.substring(c.code.length) };
      }
    }
    return { code: "57", local: raw }; // fallback
  };

  const initialParts = getInitialPhoneParts();
  const [selectedCountryCode, setSelectedCountryCode] = useState(initialParts.code);
  const [localPhone, setLocalPhone] = useState(initialParts.local);

  const [instagram, setInstagram] = useState((initialService?.social_media as any)?.instagram || "");
  const [facebook, setFacebook] = useState((initialService?.social_media as any)?.facebook || "");
  const [providerStatus, setProviderStatus] = useState(initialService?.provider_status || "active");

  const isDynamic = categories.length > 0;

  // Seed initial media from initialService
  useEffect(() => {
    const init: UploadedMedia[] = [];
    if (initialService?.image_url) {
      init.push({ id: "init-img", file: new File([], ""), previewUrl: initialService.image_url, type: "image", uploading: false, uploaded: true, publicUrl: initialService.image_url, error: null });
    }
    if (initialService?.cover_url) {
      init.push({ id: "init-cover", file: new File([], ""), previewUrl: initialService.cover_url, type: "image", uploading: false, uploaded: true, publicUrl: initialService.cover_url, error: null });
    }
    if (initialService?.video_url) {
      init.push({ id: "init-video", file: new File([], ""), previewUrl: initialService.video_url, type: "video", uploading: false, uploaded: true, publicUrl: initialService.video_url, error: null });
    }
    setMediaList(init);
  }, []);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
  }, []);

  // Sync dynamic category on load
  useEffect(() => {
    if (isDynamic && categories.length > 0) {
      const match = categories.find(c => c.slug === category) || categories[0];
      if (match) { setCategoryId(match.id); if (!initialService) setCategory(match.slug); }
    }
  }, [categories, isDynamic]);

  const handleCategorySelect = (slug: string) => {
    setCategory(slug);
    if (isDynamic) {
      const sel = categories.find(c => c.slug === slug);
      if (sel) {
        setCategoryId(sel.id);
        const subs = subcategories.filter(s => s.category_id === sel.id);
        if (subs.length) { setSubcategoryId(subs[0].id); setSubcategory(subs[0].name); }
        else { setSubcategoryId(""); setSubcategory(""); }
      }
    } else {
      const subs = STATIC_SUBCATEGORIES_MAP[slug] || [];
      setSubcategory(subs[0] || "");
      setSubcategoryId("");
    }
  };

  const currentCategoryList = isDynamic ? categories.map(c => ({ id: c.slug, name: c.name, icon: c.icon || "🔧" })) : STATIC_CATEGORIES;
  const currentSubList = isDynamic
    ? subcategories.filter(s => s.category_id === categoryId).map(s => s.name)
    : STATIC_SUBCATEGORIES_MAP[category] || [];

  // ── Media helpers ──────────────────────────────────────────────────────────
  const addFiles = useCallback(async (files: FileList | File[]) => {
    if (!userId) return;
    const arr = Array.from(files).slice(0, 10 - mediaList.length);
    const newItems: UploadedMedia[] = arr.map(f => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      type: f.type.startsWith("video/") ? "video" : "image",
      uploading: true,
      uploaded: false,
      publicUrl: "",
      error: null,
    }));
    setMediaList(prev => [...prev, ...newItems]);

    // Upload each in parallel
    for (const item of newItems) {
      const maxMB = item.type === "video" ? 50 : 5;
      if (item.file.size > maxMB * 1024 * 1024) {
        setMediaList(prev => prev.map(m => m.id === item.id ? { ...m, uploading: false, error: `Máx ${maxMB}MB` } : m));
        continue;
      }
      try {
        const url = await uploadFileToSupabase(item.file, userId, "service-gallery", item.type);
        setMediaList(prev => prev.map(m => m.id === item.id ? { ...m, uploading: false, uploaded: true, publicUrl: url } : m));
      } catch (err: any) {
        setMediaList(prev => prev.map(m => m.id === item.id ? { ...m, uploading: false, error: err.message || "Error al subir" } : m));
      }
    }
  }, [userId, mediaList.length]);

  const removeMedia = (id: string) => {
    setMediaList(prev => {
      const item = prev.find(m => m.id === id);
      if (item?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(m => m.id !== id);
    });
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); };

  // Derive URLs from media list
  const uploadedImages = mediaList.filter(m => m.type === "image" && m.uploaded);
  const uploadedVideos = mediaList.filter(m => m.type === "video" && m.uploaded);
  const imageUrl = uploadedImages[0]?.publicUrl || "";
  const coverUrl = uploadedImages[1]?.publicUrl || uploadedImages[0]?.publicUrl || "";
  const videoUrl = uploadedVideos[0]?.publicUrl || "";

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!category) e.category = "Selecciona una categoría";
    }
    if (s === 2) {
      if (mediaList.filter(m => m.uploaded && m.type === "image").length === 0) {
        e.media = "Sube al menos una foto del servicio";
      }
    }
    if (s === 3) {
      if (!title.trim()) e.title = "El título es obligatorio";
      if (!price || isNaN(Number(price)) || Number(price) <= 0) e.price = "Ingresa un precio válido mayor a cero";
      if (!description.trim()) e.description = "La descripción es obligatoria";
    }
    if (s === 4) {
      const cleanLocal = localPhone.replace(/\D/g, "");
      if (!cleanLocal.trim()) {
        e.whatsapp = "El número de WhatsApp es obligatorio";
      } else if (cleanLocal.length < 7 || cleanLocal.length > 12) {
        e.whatsapp = "Ingresa un número de teléfono local válido";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => { if (validate(step)) { setStep(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  const goPrev = () => { setStep(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    const v1 = validate(1), v2 = validate(2), v3 = validate(3), v4 = validate(4);
    if (!v1 || !v2 || !v3 || !v4) {
      setGlobalError("Completa todos los campos obligatorios.");
      if (!v1) setStep(1); else if (!v2) setStep(2); else if (!v3) setStep(3); else setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const finalCity = baseCity === "Otro" ? customCity : baseCity;
    const payload = {
      title, description,
      price: Number(price),
      category,
      category_id: isDynamic ? categoryId : null,
      subcategory_id: isDynamic ? subcategoryId : null,
      subcategory,
      base_city: finalCity || "Barranquilla",
      image_url: imageUrl || null,
      cover_url: coverUrl || null,
      video_url: videoUrl || null,
      experience: experience || null,
      cities_coverage: citiesCoverage,
      social_media: { instagram: instagram.trim(), facebook: facebook.trim() },
      whatsapp_number: localPhone.trim() ? `${selectedCountryCode}${localPhone.replace(/\D/g, "")}` : null,
      tags: [],
      specialties: [],
      latitude: null,
      longitude: null,
      provider_status: providerStatus as any,
    };

    startTransition(async () => {
      const result = initialService ? await updateService(initialService.id, payload) : await createService(payload);
      if (result.error) {
        setGlobalError(result.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSuccess(true);
        setTimeout(() => { router.push("/dashboard/provider"); router.refresh(); }, 2000);
      }
    });
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* Global alerts */}
      <AnimatePresence>
        {globalError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {globalError}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {initialService ? "¡Servicio actualizado! Redirigiendo..." : "¡Servicio publicado! Redirigiendo..."}
          </motion.div>
        )}
      </AnimatePresence>

      <StepBar current={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
        >

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STEP 1 — CATEGORÍA                                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white font-outfit">¿Qué tipo de servicio ofreces?</h2>
                <p className="text-sm text-zinc-500 mt-1">Selecciona la categoría que mejor describe tu trabajo.</p>
              </div>

              {errors.category && (
                <p className="text-xs text-red-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.category}
                </p>
              )}

              {/* Category grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currentCategoryList.map(cat => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-center group ${
                        isSelected
                          ? "border-primary-500 bg-primary-600/15 shadow-lg shadow-primary-500/10"
                          : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/6"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="text-3xl">{cat.icon}</span>
                      <span className={`text-[11px] font-black leading-tight ${isSelected ? "text-white" : "text-zinc-400 group-hover:text-white"}`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Subcategory */}
              {currentSubList.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Especialidad dentro de esta categoría</label>
                  <div className="flex flex-wrap gap-2">
                    {currentSubList.map(sub => {
                      const subName = isDynamic ? sub : sub;
                      const isActive = subcategory === subName;
                      return (
                        <button
                          key={subName}
                          type="button"
                          onClick={() => {
                            setSubcategory(subName);
                            if (isDynamic) {
                              const found = subcategories.find(s => s.name === subName);
                              if (found) setSubcategoryId(found.id);
                            }
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isActive
                              ? "bg-primary-600 border-primary-500 text-white"
                              : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
                          }`}
                        >
                          {subName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STEP 2 — MULTIMEDIA                                    */}
          {/* ═══════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white font-outfit">Fotos y Videos de tu Servicio</h2>
                <p className="text-sm text-zinc-500 mt-1">Los clientes deciden basándose en lo que ven. Sube tus mejores fotos y videos.</p>
              </div>

              {errors.media && (
                <p className="text-xs text-red-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.media}
                </p>
              )}

              {/* Main drop zone */}
              <div
                ref={dropRef}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                  mediaList.length === 0
                    ? "min-h-[260px] border-white/15 bg-white/[0.02] hover:border-primary-500/40 hover:bg-primary-950/10"
                    : "min-h-[100px] border-white/10 bg-white/[0.02] hover:border-primary-500/30"
                }`}
              >
                {mediaList.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 p-8 text-center pointer-events-none">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <UploadCloud className="w-9 h-9 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-base font-black text-white">Arrastra fotos y videos aquí</p>
                      <p className="text-xs text-zinc-500 mt-1.5">o haz clic para seleccionar archivos</p>
                      <div className="flex items-center justify-center gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-bold">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> Fotos · Máx 5MB
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-bold">
                          <Film className="w-3.5 h-3.5 text-purple-500" /> Videos · Máx 50MB
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-4 px-6 pointer-events-none">
                    <UploadCloud className="w-5 h-5 text-zinc-500" />
                    <span className="text-sm text-zinc-400 font-bold">Agregar más archivos</span>
                    <span className="text-xs text-zinc-600">(máx 10)</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                />
              </div>

              {/* Preview grid */}
              {mediaList.length > 0 && (
                <div className="space-y-3">
                  {/* Labels */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      {mediaList.length} archivo{mediaList.length !== 1 ? "s" : ""} · La 1ª foto es la principal
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {mediaList.filter(m => m.uploaded).length}/{mediaList.length} subidos
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {mediaList.map((item, idx) => (
                      <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-white/8 group">
                        {/* Preview */}
                        {item.type === "video" ? (
                          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                            <video src={item.previewUrl} className="w-full h-full object-cover opacity-60" muted />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="w-8 h-8 text-white/60" />
                            </div>
                          </div>
                        ) : (
                          <img src={item.previewUrl} className="w-full h-full object-cover" />
                        )}

                        {/* Overlay: uploading */}
                        {item.uploading && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                            <span className="text-[9px] text-white font-bold">Subiendo...</span>
                          </div>
                        )}

                        {/* Overlay: error */}
                        {item.error && (
                          <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center gap-1 p-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-[8px] text-red-300 text-center">{item.error}</span>
                          </div>
                        )}

                        {/* Badge: first image = principal */}
                        {idx === 0 && item.type === "image" && item.uploaded && (
                          <div className="absolute top-1.5 left-1.5 bg-primary-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            Principal
                          </div>
                        )}
                        {idx === 1 && item.type === "image" && item.uploaded && (
                          <div className="absolute top-1.5 left-1.5 bg-zinc-700 text-zinc-300 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            Portada
                          </div>
                        )}
                        {item.type === "video" && item.uploaded && (
                          <div className="absolute top-1.5 left-1.5 bg-purple-700 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                            <Play className="w-2.5 h-2.5" /> Video
                          </div>
                        )}

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeMedia(item.id)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/70 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {/* Uploaded check */}
                        {item.uploaded && !item.error && (
                          <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-zinc-600">
                    💡 Sube al menos 2 fotos para un perfil más atractivo. Los videos cortos de tu trabajo aumentan las contrataciones hasta un 3x.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STEP 3 — DETALLES                                      */}
          {/* ═══════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white font-outfit">Cuéntanos sobre tu servicio</h2>
                <p className="text-sm text-zinc-500 mt-1">Un buen título y descripción te consiguen más clientes.</p>
              </div>

              {/* Title — prominent */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Título del Servicio *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => { setTitle(e.target.value); if (errors.title) setErrors(p => ({ ...p, title: "" })); }}
                  disabled={isPending || success}
                  placeholder="Ej. DJ Premium con sonido e iluminación para fiestas"
                  className={`w-full bg-black/40 border rounded-2xl py-4 px-5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 text-base font-semibold ${
                    errors.title ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-primary-500/30"
                  }`}
                />
                {errors.title && <p className="text-xs text-red-400 font-bold">{errors.title}</p>}
              </div>

              {/* Price — prominent */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Precio Base (COP) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-zinc-400 font-black text-lg pointer-events-none">$</span>
                  <input
                    type="number"
                    value={price}
                    onChange={e => { setPrice(e.target.value); if (errors.price) setErrors(p => ({ ...p, price: "" })); }}
                    disabled={isPending || success}
                    placeholder="350000"
                    className={`w-full bg-black/40 border rounded-2xl py-4 pl-10 pr-5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 text-xl font-black font-outfit ${
                      errors.price ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-primary-500/30"
                    }`}
                  />
                </div>
                {errors.price && <p className="text-xs text-red-400 font-bold">{errors.price}</p>}
                <p className="text-[10px] text-zinc-600">Este es el precio mínimo de referencia. Puedes cotizar extras con el cliente.</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Descripción del Servicio *</label>
                <textarea
                  value={description}
                  onChange={e => { setDescription(e.target.value); if (errors.description) setErrors(p => ({ ...p, description: "" })); }}
                  disabled={isPending || success}
                  rows={4}
                  placeholder="Detalla qué incluye tu servicio, tu equipo, experiencia, géneros musicales, etc. Sé específico para generar confianza..."
                  className={`w-full bg-black/40 border rounded-2xl py-3.5 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 text-sm resize-none ${
                    errors.description ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-primary-500/30"
                  }`}
                />
                {errors.description && <p className="text-xs text-red-400 font-bold">{errors.description}</p>}
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Tu Experiencia (Opcional)</label>
                <textarea
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  disabled={isPending || success}
                  rows={2}
                  placeholder="Ej. Más de 8 años tocando en las mejores discotecas de Barranquilla y Bogotá."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm resize-none"
                />
              </div>

              {/* Location row */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Ciudad Base</label>
                  <select
                    value={baseCity}
                    onChange={e => setBaseCity(e.target.value)}
                    disabled={isPending || success}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm cursor-pointer"
                  >
                    {COLOMBIA_CITIES.map(c => <option key={c} value={c} className="bg-zinc-950">{c}</option>)}
                  </select>
                  {baseCity === "Otro" && (
                    <input type="text" value={customCity} onChange={e => setCustomCity(e.target.value)}
                      placeholder="Escribe tu ciudad" className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 mt-2" />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Ciudades de Cobertura</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {COLOMBIA_CITIES.filter(c => c !== "Otro").map(city => {
                      const isSelected = citiesCoverage.includes(city);
                      return (
                        <button
                          key={city}
                          type="button"
                          disabled={isPending || success}
                          onClick={() => {
                            if (isSelected) {
                              setCitiesCoverage(prev => prev.filter(c => c !== city));
                            } else {
                              setCitiesCoverage(prev => [...prev, city]);
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? "bg-primary-600/20 border-primary-500/40 text-white shadow-sm shadow-primary-500/10"
                              : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {city} {isSelected && "✓"}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1">Selecciona todas las ciudades donde puedes prestar este servicio.</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STEP 4 — CONTACTO Y PUBLICAR                           */}
          {/* ═══════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white font-outfit">Contacto y Vista Previa</h2>
                <p className="text-sm text-zinc-500 mt-1">Añade tu contacto para que los clientes puedan alcanzarte. Luego revisa y publica.</p>
              </div>

              {/* Contact fields */}
              <div className="space-y-4 bg-white/[0.025] border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300">Contacto</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400">WhatsApp *</label>
                  <div className="flex gap-2">
                    {/* Country Code Select */}
                    <div className="relative w-1/3 sm:w-2/5 shrink-0">
                      <select
                        value={selectedCountryCode}
                        onChange={e => setSelectedCountryCode(e.target.value)}
                        disabled={isPending || success}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-xs sm:text-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_1rem_center] bg-no-repeat pr-8"
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code} className="bg-zinc-950 text-white text-xs">
                            {c.display} ({c.country})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Local Number Input */}
                    <div className="relative flex-1">
                      <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
                      <input
                        type="tel"
                        value={localPhone}
                        onChange={e => {
                          setLocalPhone(e.target.value.replace(/\D/g, ""));
                          if (errors.whatsapp) setErrors(p => ({ ...p, whatsapp: "" }));
                        }}
                        placeholder="3001234567"
                        disabled={isPending || success}
                        className={`w-full bg-black/40 border rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 text-sm ${
                          errors.whatsapp ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-primary-500/30"
                        }`}
                      />
                    </div>
                  </div>
                  {errors.whatsapp && <p className="text-xs text-red-400 font-bold">{errors.whatsapp}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <InstagramIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" />
                    <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} disabled={isPending || success}
                      placeholder="usuario_instagram" className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-zinc-600 focus:outline-none text-sm" />
                  </div>
                  <div className="relative">
                    <FacebookIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                    <input type="text" value={facebook} onChange={e => setFacebook(e.target.value)} disabled={isPending || success}
                      placeholder="usuario_facebook" className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-zinc-600 focus:outline-none text-sm" />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-zinc-400">Estado operativo al publicar</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { v: "active"   as const, label: "Disponible", color: "emerald" },
                      { v: "busy"     as const, label: "Ocupado",    color: "amber"   },
                      { v: "vacation" as const, label: "Vacaciones", color: "blue"    },
                      { v: "inactive" as const, label: "Inactivo",   color: "zinc"    },
                    ].map(opt => (
                      <button key={opt.v} type="button" onClick={() => setProviderStatus(opt.v)}
                        className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          providerStatus === opt.v
                            ? `bg-${opt.color}-600/20 border-${opt.color}-500/40 text-${opt.color}-300`
                            : "bg-white/3 border-white/8 text-zinc-500 hover:text-white"
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview card */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary-400" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Vista previa de tu listing</span>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#07070c] overflow-hidden shadow-xl">
                  {/* Banner */}
                  <div className="relative h-36 bg-zinc-900">
                    {coverUrl || imageUrl ? (
                      <img src={coverUrl || imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-950/50 to-indigo-950/50 flex items-center justify-center">
                        <span className="text-4xl opacity-30">{currentCategoryList.find(c => c.id === category)?.icon || "🎵"}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-primary-400 tracking-wider">
                      {subcategory || category}
                    </div>
                    <div className="absolute top-3 right-3 bg-primary-600 text-white font-black text-sm px-3 py-1 rounded-xl">
                      ${Number(price || 0).toLocaleString("es-CO")} COP
                    </div>
                  </div>

                  <div className="p-5 flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl border-2 border-zinc-900 bg-zinc-800 overflow-hidden shrink-0 -mt-8 shadow-lg">
                      {imageUrl ? (
                        <img src={imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xl">
                          {currentCategoryList.find(c => c.id === category)?.icon || "🎵"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 pt-1">
                      <h4 className="text-base font-black text-white truncate font-outfit">{title || "Título del servicio"}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary-400" />
                        {baseCity === "Otro" ? customCity || "Ciudad" : baseCity}
                      </p>
                      {description && (
                        <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">{description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {videoUrl && (
                          <span className="text-[9px] bg-purple-900/30 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <Play className="w-2.5 h-2.5" /> Video
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ─── Navigation ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-8 mt-6 border-t border-white/6">
        <div>
          {step > 1 ? (
            <button type="button" onClick={goPrev} disabled={isPending || success}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold cursor-pointer disabled:opacity-50">
              <ArrowLeft className="w-4 h-4" /> Anterior
            </button>
          ) : (
            <Link href="/dashboard/provider"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
          )}
        </div>

        <div>
          {step < 4 ? (
            <button type="button" onClick={goNext} disabled={isPending || success}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl py-3 px-7 font-black text-sm transition-all cursor-pointer shadow-lg hover:shadow-primary-500/20 disabled:opacity-50">
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={isPending || success || mediaList.some(m => m.uploading)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl py-3.5 px-8 font-black text-sm transition-all cursor-pointer shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] justify-center">
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {initialService ? "Guardando..." : "Publicando..."}</>
              ) : mediaList.some(m => m.uploading) ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo archivos...</>
              ) : (
                <>{initialService ? "Guardar Cambios" : "🚀 Publicar Servicio"}</>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
