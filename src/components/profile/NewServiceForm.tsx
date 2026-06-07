"use client";

import { useState, useTransition, useEffect } from "react";
import { createService, updateService } from "@/app/services/actions";
import { 
  Sparkles, DollarSign, Tag, AlignLeft, FileText, Loader2, 
  CheckCircle2, AlertTriangle, ArrowLeft, Globe, MapPin, 
  Video, Eye, Compass, UserCheck, MessageCircle 
} from "lucide-react";

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Service } from "@/types/database.types";

const STATIC_CATEGORIES = [
  { id: "music", name: "Música y Entretenimiento", icon: "🎵" },
  { id: "sound", name: "Sonido e Iluminación", icon: "🔊" },
  { id: "bar", name: "Bar y Bebidas", icon: "🍸" },
  { id: "catering", name: "Catering y Comida", icon: "🍽️" },
  { id: "decor", name: "Decoración y Ambientación", icon: "🎈" },
  { id: "logistics", name: "Mobiliario y Logística", icon: "🪑" },
  { id: "staff", name: "Personal de Servicio", icon: "👨‍🍳" },
  { id: "security", name: "Seguridad", icon: "🛡️" },
  { id: "media", name: "Foto y Video", icon: "📸" },
  { id: "transport", name: "Transporte", icon: "🚗" },
  { id: "social", name: "Bodas y Eventos Sociales", icon: "💍" },
  { id: "premium", name: "Experiencias Premium", icon: "⭐" }
];

const STATIC_SUBCATEGORIES_MAP: Record<string, string[]> = {
  music: [
    "DJ", "DJ Premium", "DJ Internacional", "Banda en vivo", "Grupo vallenato",
    "Grupo tropical", "Mariachis", "Saxofonista", "Violinista", "Cantante",
    "Animador", "Maestro de ceremonia", "Hora loca", "Bailarinas", "Show de baile",
    "Humoristas", "Magos", "Personajes temáticos"
  ],
  sound: [
    "Alquiler de sonido", "Sonido profesional", "Tarimas", "Luces inteligentes",
    "Cabezas móviles", "Pantallas LED", "Proyección audiovisual", "Micrófonos",
    "Producción técnica", "Máquina de humo", "Máquina de CO2", "Pirotecnia fría",
    "Show láser"
  ],
  bar: [
    "Bartender", "Bartender Premium", "Mixólogo", "Bar móvil", "Barra temática",
    "Estación de shots", "Estación de cócteles", "Servicio de bebidas"
  ],
  catering: [
    "Catering para fiestas", "Catering premium", "Chef privado", "Parrillero",
    "Pasabocas", "Comida rápida", "Food Truck", "Mesa de postres", "Repostería",
    "Tortas personalizadas"
  ],
  decor: [
    "Decoración temática", "Decoración de bodas", "Decoración de 15 Años",
    "Decoración de Cumpleaños", "Globos", "Flores", "Arreglos florales",
    "Backings", "Photocalls", "Centros de mesa", "Ambientación premium"
  ],
  logistics: [
    "Alquiler de mesas", "Alquiler de sillas", "Alquiler de carpas", "Salas lounge",
    "Mobiliario premium", "Cristalería", "Vajilla", "Mantelería", "Menaje"
  ],
  staff: [
    "Meseros", "Meseros VIP", "Capitanes de mesa", "Hostess", "Recepcionistas",
    "Impulsadoras", "Protocolo", "Personal de limpieza", "Auxiliares logísticos"
  ],
  security: [
    "Seguridad privada", "Control de acceso", "Logística de eventos",
    "Seguridad VIP", "Escoltas"
  ],
  media: [
    "Fotógrafo", "Fotografía profesional", "Fotografía aérea", "Videógrafo",
    "Drone", "Streaming", "Cabina fotográfica", "Video resumen"
  ],
  transport: [
    "Vans", "Buses", "Transporte VIP", "Chofer privado", "Limusinas"
  ],
  social: [
    "Wedding Planner", "Quinceaños Planner", "Cumpleaños Planner",
    "Coordinador de eventos sociales", "Maestro de ceremonia social",
    "Producción de eventos sociales"
  ],
  premium: [
    "Artistas famosos", "Influencers", "Celebridades", "DJs internacionales",
    "Producción integral", "Eventos de lujo"
  ]
};

const CODES_COLOMBIA_CITIES = [
  "Barranquilla", "Cartagena", "Medellín", "Bogotá", "Cali", "Santa Marta", "Otro"
];

interface NewServiceFormProps {
  initialService?: Service;
  categories?: Array<{ id: string; slug: string; name: string; icon: string | null }>;
  subcategories?: Array<{ id: string; category_id: string; slug: string; name: string }>;
}

export function NewServiceForm({ initialService, categories = [], subcategories = [] }: NewServiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Basic info states
  const [title, setTitle] = useState(initialService?.title || "");
  const [description, setDescription] = useState(initialService?.description || "");
  const [price, setPrice] = useState(initialService?.price?.toString() || "");
  const [imageUrl, setImageUrl] = useState(initialService?.image_url || "");
  const [coverUrl, setCoverUrl] = useState(initialService?.cover_url || "");
  const [videoUrl, setVideoUrl] = useState(initialService?.video_url || "");

  // Taxonomy states
  const [category, setCategory] = useState(initialService?.category || "music");
  const [categoryId, setCategoryId] = useState(initialService?.category_id || "");
  const [subcategory, setSubcategory] = useState(initialService?.subcategory || "");
  const [subcategoryId, setSubcategoryId] = useState(initialService?.subcategory_id || "");
  
  // Profile, status & locations
  const [baseCity, setBaseCity] = useState(initialService?.base_city || "Barranquilla");
  const [customCity, setCustomCity] = useState("");
  const [citiesCoverage, setCitiesCoverage] = useState(initialService?.cities_coverage?.join(", ") || "");
  const [experience, setExperience] = useState(initialService?.experience || "");
  const [whatsappNumber, setWhatsappNumber] = useState(initialService?.whatsapp_number || "");
  const [instagram, setInstagram] = useState((initialService?.social_media as any)?.instagram || "");
  const [facebook, setFacebook] = useState((initialService?.social_media as any)?.facebook || "");
  
  // Tags & geolocation
  const [tags, setTags] = useState(initialService?.tags?.join(", ") || "");
  const [specialties, setSpecialties] = useState(initialService?.specialties?.join(", ") || "");
  const [latitude, setLatitude] = useState(initialService?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(initialService?.longitude?.toString() || "");
  const [providerStatus, setProviderStatus] = useState<string>(initialService?.provider_status || "active");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isDynamicTaxonomy = categories.length > 0;

  // Initialize UUID categories if dynamic categories are loaded
  useEffect(() => {
    if (isDynamicTaxonomy) {
      // Find category matching current slug or default to first
      const matchedCat = categories.find(c => c.slug === category) || categories[0];
      if (matchedCat) {
        setCategoryId(matchedCat.id);
        if (!initialService) {
          setCategory(matchedCat.slug);
        }
      }
    }
  }, [categories, isDynamicTaxonomy]);

  // Handle category change
  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (isDynamicTaxonomy) {
      const selected = categories.find(c => c.slug === val);
      if (selected) {
        setCategoryId(selected.id);
        // Reset subcategory to first matching subcategory
        const matchingSubs = subcategories.filter(s => s.category_id === selected.id);
        if (matchingSubs.length > 0) {
          setSubcategoryId(matchingSubs[0].id);
          setSubcategory(matchingSubs[0].name);
        } else {
          setSubcategoryId("");
          setSubcategory("");
        }
      }
    } else {
      // Static fallback
      const matchingSubs = STATIC_SUBCATEGORIES_MAP[val];
      if (matchingSubs && matchingSubs.length > 0) {
        setSubcategory(matchingSubs[0]);
      } else {
        setSubcategory("");
      }
    }
  };

  // Get current subcategories options
  const currentSubcategoriesOptions = isDynamicTaxonomy
    ? subcategories.filter(s => s.category_id === categoryId)
    : STATIC_SUBCATEGORIES_MAP[category] || [];

  // Initialize subcategory if empty
  useEffect(() => {
    if (currentSubcategoriesOptions.length > 0 && !subcategory) {
      if (isDynamicTaxonomy) {
        const firstSub = currentSubcategoriesOptions[0] as any;
        setSubcategoryId(firstSub.id);
        setSubcategory(firstSub.name);
      } else {
        setSubcategory(currentSubcategoriesOptions[0] as string);
      }
    }
  }, [currentSubcategoriesOptions, subcategory, isDynamicTaxonomy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError("El título del servicio es requerido.");
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("El precio debe ser un número mayor a cero.");
      return;
    }

    // Geolocation parsing
    const latNum = latitude ? Number(latitude) : null;
    const lngNum = longitude ? Number(longitude) : null;
    if (latitude && isNaN(latNum || NaN)) {
      setError("La latitud debe ser un valor numérico.");
      return;
    }
    if (longitude && isNaN(lngNum || NaN)) {
      setError("La longitud debe ser un valor numérico.");
      return;
    }

    const finalBaseCity = baseCity === "Otro" ? customCity : baseCity;

    const payload = {
      title,
      description,
      price: priceNum,
      category, // Keep slug for dual-writing
      category_id: isDynamicTaxonomy ? categoryId : null,
      subcategory_id: isDynamicTaxonomy ? subcategoryId : null,
      subcategory: subcategory,
      base_city: finalBaseCity || "Barranquilla",
      image_url: imageUrl || null,
      cover_url: coverUrl || null,
      video_url: videoUrl || null,
      experience: experience || null,
      cities_coverage: citiesCoverage.split(",").map(c => c.trim()).filter(Boolean),
      social_media: { instagram: instagram.trim(), facebook: facebook.trim() },
      whatsapp_number: whatsappNumber.trim() || null,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      specialties: specialties.split(",").map(s => s.trim()).filter(Boolean),
      latitude: latNum,
      longitude: lngNum,
      provider_status: providerStatus as any
    };

    startTransition(async () => {
      const result = initialService
        ? await updateService(initialService.id, payload)
        : await createService(payload);

      if (result.error) {
        setError(result.error);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          router.push("/dashboard/provider");
          router.refresh();
        }, 2000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-zinc-200">
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm shadow-md"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>{error}</div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm shadow-md"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>{initialService ? "¡Servicio actualizado con éxito! Redirigiendo..." : "¡Servicio publicado con éxito! Redirigiendo..."}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
      <section className="space-y-4">
        <h3 className="text-md font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2 font-outfit border-b border-white/5 pb-2">
          <Sparkles className="w-4 h-4" />
          Información Básica del Servicio
        </h3>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Título del Servicio</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
              placeholder="Ej. Show de DJ Premium con luces y sonido inmersivo"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Categoría */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Categoría Principal</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Tag className="h-4 w-4" />
                </div>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  disabled={isPending || success}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm cursor-pointer capitalize"
                >
                  {isDynamicTaxonomy 
                    ? categories.map(cat => (
                        <option key={cat.id} value={cat.slug} className="bg-zinc-950 text-white">
                          {cat.icon} {cat.name}
                        </option>
                      ))
                    : STATIC_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-zinc-950 text-white">
                          {cat.icon} {cat.name}
                        </option>
                      ))
                  }
                </select>
              </div>
            </div>

            {/* Subcategoría */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Subcategoría Especializada</label>
              <select
                value={isDynamicTaxonomy ? subcategoryId : subcategory}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isDynamicTaxonomy) {
                    setSubcategoryId(val);
                    const subObj = subcategories.find(s => s.id === val);
                    if (subObj) setSubcategory(subObj.name);
                  } else {
                    setSubcategory(val);
                  }
                }}
                disabled={isPending || success}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm cursor-pointer"
              >
                {isDynamicTaxonomy
                  ? currentSubcategoriesOptions.map((sub: any) => (
                      <option key={sub.id} value={sub.id} className="bg-zinc-950 text-white">
                        {sub.name}
                      </option>
                    ))
                  : (currentSubcategoriesOptions as string[]).map((subStr) => (
                      <option key={subStr} value={subStr} className="bg-zinc-950 text-white">
                        {subStr}
                      </option>
                    ))
                }
              </select>
            </div>

            {/* Precio */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Precio Base ($)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <DollarSign className="h-4 w-4" />
                </div>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isPending || success}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
                  placeholder="350000"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: MEDIOS Y PERFIL */}
      <section className="space-y-4">
        <h3 className="text-md font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2 font-outfit border-b border-white/5 pb-2">
          <Eye className="w-4 h-4" />
          Contenido del Perfil Profesional
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">URL Foto Principal</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
              placeholder="https://images.unsplash.com/photo-..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">URL Portada de Banner</label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
              placeholder="https://images.unsplash.com/photo-..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">URL Video Principal (YouTube/Vimeo)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Video className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={isPending || success}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Estado Operativo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <UserCheck className="w-4 h-4" />
              </div>
              <select
                value={providerStatus}
                onChange={(e) => setProviderStatus(e.target.value)}
                disabled={isPending || success}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm cursor-pointer"
              >
                <option value="active" className="bg-zinc-950 text-white">Disponible (Activo)</option>
                <option value="busy" className="bg-zinc-950 text-white">Ocupado (En Evento)</option>
                <option value="vacation" className="bg-zinc-950 text-white">En Vacaciones</option>
                <option value="inactive" className="bg-zinc-950 text-white">Fuera de Servicio (Inactivo)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 font-outfit">Descripción del Servicio</label>
          <div className="relative">
            <div className="absolute top-3 left-3 text-zinc-500">
              <AlignLeft className="w-4 h-4" />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm min-h-[100px] resize-y"
              placeholder="Detalla las características de tu show o servicio técnico..."
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400">Experiencia del Proveedor</label>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            disabled={isPending || success}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm min-h-[80px]"
            placeholder="Ej. Más de 8 años tocando en las mejores discotecas de Barranquilla y Bogotá."
          />
        </div>
      </section>

      {/* SECCIÓN 3: UBICACIÓN Y COBERTURA */}
      <section className="space-y-4">
        <h3 className="text-md font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2 font-outfit border-b border-white/5 pb-2">
          <Globe className="w-4 h-4" />
          Ubicación y Cobertura Geográfica
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ciudad Base */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Ciudad Base</label>
            <select
              value={baseCity}
              onChange={(e) => setBaseCity(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm cursor-pointer"
            >
              {CODES_COLOMBIA_CITIES.map(c => (
                <option key={c} value={c} className="bg-zinc-950 text-white">{c}</option>
              ))}
            </select>
          </div>

          {/* Latitud */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Latitud (Opcional)</label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
              placeholder="10.9878"
            />
          </div>

          {/* Longitud */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Longitud (Opcional)</label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
              placeholder="-74.7889"
            />
          </div>
        </div>

        {baseCity === "Otro" && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Escribe tu Ciudad Base</label>
            <input
              type="text"
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm"
              placeholder="Escribe el nombre de la ciudad"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400">Ciudades de Cobertura (Separadas por coma)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={citiesCoverage}
              onChange={(e) => setCitiesCoverage(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
              placeholder="Ej. Barranquilla, Cartagena, Santa Marta, Puerto Colombia"
            />
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: CONTACTO Y REDES */}
      <section className="space-y-4">
        <h3 className="text-md font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2 font-outfit border-b border-white/5 pb-2">
          <MessageCircle className="w-4 h-4" />
          Contacto Rápido y Redes Sociales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">WhatsApp (Número Completo)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                disabled={isPending || success}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
                placeholder="573001234567"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Usuario Instagram (Opcional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <InstagramIcon className="w-4 h-4 text-pink-400" />
              </div>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={isPending || success}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
                placeholder="usuario_insta"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Usuario Facebook (Opcional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <FacebookIcon className="w-4 h-4 text-blue-400" />
              </div>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                disabled={isPending || success}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
                placeholder="usuario_fb"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 5: CLASIFICACIÓN ADICIONAL */}
      <section className="space-y-4">
        <h3 className="text-md font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2 font-outfit border-b border-white/5 pb-2">
          <Compass className="w-4 h-4" />
          Clasificación y Especialidades (SEO)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Etiquetas / Tags (Separadas por comas)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
              placeholder="crossover, electronica, techno"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Especialidades (Separadas por comas)</label>
            <input
              type="text"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
              placeholder="Fiestas corporativas, bodas, pool parties"
            />
          </div>
        </div>
      </section>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-between items-center border-t border-white/5">
        <Link 
          href="/dashboard/provider"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Panel
        </Link>

        <button
          type="submit"
          disabled={isPending || success}
          className="w-full sm:w-auto min-w-[220px] bg-primary-600 hover:bg-primary-500 text-white rounded-2xl py-3.5 px-6 font-bold text-sm transition-all glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-primary-500/15"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {initialService ? "Guardando..." : "Publicando..."}
            </>
          ) : (
            initialService ? "Guardar Cambios" : "Publicar Servicio"
          )}
        </button>
      </div>
    </form>
  );
}
