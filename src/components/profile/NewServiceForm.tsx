"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createService, updateService } from "@/app/services/actions";
import { 
  Sparkles, DollarSign, Tag, AlignLeft, FileText, Loader2, 
  CheckCircle2, AlertTriangle, ArrowLeft, Globe, MapPin, 
  Video, Eye, Compass, UserCheck, MessageCircle, UploadCloud, X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

interface MediaUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept: string;
  bucket?: string;
  userId: string | null;
  helperText?: string;
  mediaType: "image" | "video";
}

function MediaUploadField({
  label,
  value,
  onChange,
  accept,
  bucket = "service-gallery",
  userId,
  helperText,
  mediaType,
}: MediaUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadDirectFile = async (file: File) => {
    // Validate size (max 10MB for video, 3MB for image)
    const maxSize = mediaType === "video" ? 10 * 1024 * 1024 : 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`El archivo debe pesar menos de ${mediaType === "video" ? "10MB" : "3MB"}.`);
      return;
    }

    setIsUploading(true);
    setError(null);

    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const folder = userId || "anonymous";
    const fileName = `${mediaType}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onChange(data.publicUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadDirectFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (mediaType === "image" && !file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen.");
      return;
    }
    if (mediaType === "video" && !file.type.startsWith("video/")) {
      setError("Solo se permiten archivos de video.");
      return;
    }

    await uploadDirectFile(file);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setError(null);
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-zinc-400">{label}</label>
        {value && (
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
            ✓ Cargado
          </span>
        )}
      </div>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-full min-h-[140px] rounded-2xl border border-dashed border-white/10 hover:border-primary-500/40 bg-black/40 overflow-hidden flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${
          isUploading ? "pointer-events-none" : ""
        }`}
      >
        {value ? (
          <div className="relative w-full h-full flex items-center justify-center min-h-[120px]">
            {mediaType === "video" ? (
              <video src={value} className="max-h-[140px] rounded-xl object-contain" controls onClick={(e) => e.stopPropagation()} />
            ) : (
              <img src={value} className="max-h-[140px] rounded-xl object-contain" alt={label} />
            )}
            <button
              type="button"
              onClick={clearFile}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center transition-colors shadow-md z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                <p className="text-xs text-zinc-300 font-medium">Subiendo archivo...</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-zinc-500" />
                <div>
                  <p className="text-xs font-bold text-white">Arrastra o haz clic para subir</p>
                  <p className="text-[10px] text-zinc-500 mt-1">{helperText || "Formatos permitidos"}</p>
                </div>
              </>
            )}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
          disabled={isUploading}
        />
      </div>
      {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
    </div>
  );
}

export function NewServiceForm({ initialService, categories = [], subcategories = [] }: NewServiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Wizard and user details states
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

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
  
  // Tags
  const [tags, setTags] = useState(initialService?.tags?.join(", ") || "");
  const [specialties, setSpecialties] = useState(initialService?.specialties?.join(", ") || "");
  const [providerStatus, setProviderStatus] = useState<string>(initialService?.provider_status || "active");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isDynamicTaxonomy = categories.length > 0;

  // Initialize UUID categories if dynamic categories are loaded
  useEffect(() => {
    if (isDynamicTaxonomy) {
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
      const matchingSubs = STATIC_SUBCATEGORIES_MAP[val];
      if (matchingSubs && matchingSubs.length > 0) {
        setSubcategory(matchingSubs[0]);
      } else {
        setSubcategory("");
      }
    }
  };

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

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!title.trim()) {
        newErrors.title = "El título es obligatorio";
      }
      const priceNum = Number(price);
      if (!price) {
        newErrors.price = "El precio base es obligatorio";
      } else if (isNaN(priceNum) || priceNum <= 0) {
        newErrors.price = "El precio debe ser un número mayor a cero";
      }
      if (!description.trim()) {
        newErrors.description = "La descripción del servicio es obligatoria";
      }
    }

    if (currentStep === 2) {
      if (!imageUrl) {
        newErrors.imageUrl = "Agrega al menos una foto principal";
      }
      if (!coverUrl) {
        newErrors.coverUrl = "La foto de portada/banner es obligatoria";
      }
    }

    if (currentStep === 3) {
      const finalBaseCity = baseCity === "Otro" ? customCity : baseCity;
      if (!finalBaseCity || !finalBaseCity.trim()) {
        newErrors.baseCity = "La ciudad base es obligatoria";
      }
      if (!whatsappNumber.trim()) {
        newErrors.whatsappNumber = "El WhatsApp es obligatorio";
      } else {
        const cleanWhatsApp = whatsappNumber.replace(/\D/g, "");
        if (!/^\d{11,15}$/.test(cleanWhatsApp)) {
          newErrors.whatsappNumber = "El WhatsApp debe incluir el código de país (ej: 57 para Colombia)";
        }
      }
    }

    setInlineErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const isStep1Valid = validateStep(1);
    const isStep2Valid = validateStep(2);
    const isStep3Valid = validateStep(3);

    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      setError("Por favor, completa correctamente todos los campos obligatorios en los pasos anteriores.");
      if (!isStep1Valid) setStep(1);
      else if (!isStep2Valid) setStep(2);
      else if (!isStep3Valid) setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const priceNum = Number(price);
    const finalBaseCity = baseCity === "Otro" ? customCity : baseCity;

    const payload = {
      title,
      description,
      price: priceNum,
      category,
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
      latitude: null,
      longitude: null,
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

  const stepsData = [
    { step: 1, name: "Básicos" },
    { step: 2, name: "Multimedia" },
    { step: 3, name: "Contacto" },
    { step: 4, name: "Detalles" },
  ];

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

      {/* Barra de progreso */}
      <div className="mb-10 bg-[#07070c]/60 border border-white/5 p-6 rounded-3xl">
        <div className="flex items-center justify-between relative max-w-xl mx-auto">
          <div className="absolute left-6 right-6 top-4.5 h-0.5 bg-white/5 z-0" />
          <motion.div 
            className="absolute left-6 top-4.5 h-0.5 bg-gradient-to-r from-primary-600 to-indigo-650 z-0"
            initial={false}
            animate={{ 
              width: step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "100%" 
            }}
            transition={{ duration: 0.3 }}
          />

          {stepsData.map((s) => {
            const isCompleted = step > s.step;
            const isActive = step === s.step;
            return (
              <div key={s.step} className="flex flex-col items-center relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    if (s.step < step) {
                      setStep(s.step);
                    } else if (s.step > step) {
                      let valid = true;
                      for (let i = step; i < s.step; i++) {
                        if (!validateStep(i)) {
                          setStep(i);
                          valid = false;
                          break;
                        }
                      }
                      if (valid) setStep(s.step);
                    }
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                    isCompleted
                      ? "bg-primary-600 border-primary-500 text-white font-black"
                      : isActive
                      ? "bg-zinc-950 border-primary-500 text-primary-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] font-black scale-110"
                      : "bg-zinc-900 border-white/5 text-zinc-550 cursor-pointer hover:border-white/10"
                  }`}
                >
                  {isCompleted ? "✓" : s.step}
                </button>
                <span className={`text-[9px] uppercase font-black tracking-wider mt-2.5 transition-colors duration-300 ${
                  isActive ? "text-primary-400" : "text-zinc-500"
                }`}>
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-md font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2 font-outfit border-b border-white/5 pb-2">
                <Sparkles className="w-4 h-4" />
                Paso 1 — Información Básica del Servicio
              </h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Título del Servicio</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (inlineErrors.title) {
                        setInlineErrors(prev => ({ ...prev, title: "" }));
                      }
                    }}
                    disabled={isPending || success}
                    className={`w-full bg-black/40 border rounded-xl py-3 px-4 text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 text-sm ${
                      inlineErrors.title ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10 focus:ring-primary-500/50"
                    }`}
                    placeholder="Ej. Show de DJ Premium con luces y sonido inmersivo"
                  />
                  {inlineErrors.title && (
                    <p className="text-xs text-red-400 font-semibold mt-1">{inlineErrors.title}</p>
                  )}
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
                        onChange={(e) => {
                          setPrice(e.target.value);
                          if (inlineErrors.price) {
                            setInlineErrors(prev => ({ ...prev, price: "" }));
                          }
                        }}
                        disabled={isPending || success}
                        className={`w-full bg-black/40 border rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 text-sm ${
                          inlineErrors.price ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10 focus:ring-primary-500/50"
                        }`}
                        placeholder="350000"
                      />
                    </div>
                    {inlineErrors.price && (
                      <p className="text-xs text-red-400 font-semibold mt-1">{inlineErrors.price}</p>
                    )}
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
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (inlineErrors.description) {
                          setInlineErrors(prev => ({ ...prev, description: "" }));
                        }
                      }}
                      disabled={isPending || success}
                      className={`w-full bg-black/40 border rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 text-sm min-h-[100px] resize-y ${
                        inlineErrors.description ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10 focus:ring-primary-500/50"
                      }`}
                      placeholder="Detalla las características de tu show o servicio técnico..."
                    />
                  </div>
                  {inlineErrors.description && (
                    <p className="text-xs text-red-400 font-semibold mt-1">{inlineErrors.description}</p>
                  )}
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
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-md font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2 font-outfit border-b border-white/5 pb-2">
                <Eye className="w-4 h-4" />
                Paso 2 — Fotos y Videos del Servicio
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MediaUploadField
                  label="Foto Principal (Obligatoria)"
                  value={imageUrl}
                  onChange={(url) => {
                    setImageUrl(url);
                    if (inlineErrors.imageUrl) {
                      setInlineErrors(prev => ({ ...prev, imageUrl: "" }));
                    }
                  }}
                  accept="image/*"
                  bucket="service-gallery"
                  userId={userId}
                  mediaType="image"
                  helperText="Formatos JPG, PNG. Recomendado: 1:1 o 4:3. Máx. 3MB"
                />

                <MediaUploadField
                  label="Foto de Portada / Banner (Obligatoria)"
                  value={coverUrl}
                  onChange={(url) => {
                    setCoverUrl(url);
                    if (inlineErrors.coverUrl) {
                      setInlineErrors(prev => ({ ...prev, coverUrl: "" }));
                    }
                  }}
                  accept="image/*"
                  bucket="service-gallery"
                  userId={userId}
                  mediaType="image"
                  helperText="Formatos JPG, PNG. Recomendado: 16:9 o Banner. Máx. 3MB"
                />
              </div>

              <div className="space-y-4">
                <MediaUploadField
                  label="Video Principal (Opcional)"
                  value={videoUrl}
                  onChange={(url) => setVideoUrl(url)}
                  accept="video/*"
                  bucket="service-gallery"
                  userId={userId}
                  mediaType="video"
                  helperText="Formato MP4. Cortos de portafolio o shows en vivo. Máx. 10MB"
                />

                {(inlineErrors.imageUrl || inlineErrors.coverUrl) && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
                    {inlineErrors.imageUrl && <p>• {inlineErrors.imageUrl}</p>}
                    {inlineErrors.coverUrl && <p>• {inlineErrors.coverUrl}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-md font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2 font-outfit border-b border-white/5 pb-2">
                <Globe className="w-4 h-4" />
                Paso 3 — Ubicación y Contacto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ciudad Base */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Ciudad Base</label>
                  <select
                    value={baseCity}
                    onChange={(e) => {
                      setBaseCity(e.target.value);
                      if (inlineErrors.baseCity) {
                        setInlineErrors(prev => ({ ...prev, baseCity: "" }));
                      }
                    }}
                    disabled={isPending || success}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm cursor-pointer"
                  >
                    {CODES_COLOMBIA_CITIES.map(c => (
                      <option key={c} value={c} className="bg-zinc-950 text-white">{c}</option>
                    ))}
                  </select>
                  {inlineErrors.baseCity && (
                    <p className="text-xs text-red-400 font-semibold mt-1">{inlineErrors.baseCity}</p>
                  )}
                </div>

                {/* Ciudades de Cobertura */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Ciudades de Cobertura (Separadas por comas)</label>
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
                      placeholder="Ej. Barranquilla, Cartagena, Santa Marta"
                    />
                  </div>
                </div>
              </div>

              {baseCity === "Otro" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Escribe tu Ciudad Base</label>
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => {
                      setCustomCity(e.target.value);
                      if (inlineErrors.baseCity) {
                        setInlineErrors(prev => ({ ...prev, baseCity: "" }));
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                    placeholder="Escribe el nombre de la ciudad"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">WhatsApp (Número Completo)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => {
                        setWhatsappNumber(e.target.value);
                        if (inlineErrors.whatsappNumber) {
                          setInlineErrors(prev => ({ ...prev, whatsappNumber: "" }));
                        }
                      }}
                      disabled={isPending || success}
                      className={`w-full bg-black/40 border rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 text-sm ${
                        inlineErrors.whatsappNumber ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10 focus:ring-primary-500/50"
                      }`}
                      placeholder="573001234567"
                    />
                  </div>
                  {inlineErrors.whatsappNumber && (
                    <p className="text-xs text-red-400 font-semibold mt-1">{inlineErrors.whatsappNumber}</p>
                  )}
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
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-md font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2 font-outfit border-b border-white/5 pb-2">
                <Compass className="w-4 h-4" />
                Paso 4 — Detalles Finales y Vista Previa
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Etiquetas / Tags (Separadas por comas)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    disabled={isPending || success}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
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
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
                    placeholder="Fiestas corporativas, bodas, pool parties"
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

              {/* Vista Previa del Perfil */}
              <div className="border border-white/5 bg-zinc-950/40 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary-400" />
                  <span className="text-xs text-primary-400 font-bold uppercase tracking-wider font-outfit">Vista Previa de tu Perfil</span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#07070c] shadow-xl">
                  {/* Banner */}
                  <div className="h-32 w-full relative bg-zinc-900">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-primary-950/45 to-indigo-900/40 flex items-center justify-center text-zinc-500 text-xs font-semibold">
                        Sin Banner cargado
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-primary-400 tracking-wider">
                      {subcategory || category}
                    </div>
                    <div className="absolute top-3 right-3 bg-emerald-500/90 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg">
                      ${price || "0"}
                    </div>
                  </div>

                  {/* Profile Details overlap */}
                  <div className="px-6 pb-6 relative flex flex-col sm:flex-row sm:items-end gap-4 -mt-8">
                    <div className="w-20 h-20 rounded-full border-2 border-zinc-900 bg-zinc-800 overflow-hidden shrink-0 shadow-lg">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Foto Principal Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-850 flex items-center justify-center text-zinc-550 font-bold text-lg font-outfit">
                          ?
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-lg font-bold text-white truncate font-outfit">
                        {title || "Título del Servicio"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                          {baseCity === "Otro" ? customCity : baseCity}
                        </span>
                        {whatsappNumber && (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            WhatsApp listo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="space-y-2">
                    <h5 className="text-[10px] uppercase font-bold text-zinc-500">Descripción del Servicio</h5>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                      {description || "Escribe una descripción del servicio para verla aquí..."}
                    </p>
                  </div>

                  {experience && (
                    <div className="space-y-2 pt-3 border-t border-white/5">
                      <h5 className="text-[10px] uppercase font-bold text-zinc-500">Experiencia del Proveedor</h5>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {experience}
                      </p>
                    </div>
                  )}

                  {(tags || specialties) && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                      {tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                        <span key={tag} className="bg-zinc-900 text-zinc-400 border border-white/5 px-2 py-0.5 rounded-md text-[9px] font-semibold">
                          #{tag}
                        </span>
                      ))}
                      {specialties.split(",").map(s => s.trim()).filter(Boolean).map(spec => (
                        <span key={spec} className="bg-primary-950/20 text-primary-400 border border-primary-500/10 px-2 py-0.5 rounded-md text-[9px] font-semibold">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Botones de navegación del formulario */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-between items-center border-t border-white/5">
        <div>
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isPending || success}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>
          ) : (
            <Link 
              href="/dashboard/provider"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Panel
            </Link>
          )}
        </div>

        <div>
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isPending || success}
              className="w-full sm:w-auto min-w-[160px] bg-primary-600 hover:bg-primary-550 text-white rounded-2xl py-3 px-6 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-primary-500/10"
            >
              Siguiente
            </button>
          ) : (
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
          )}
        </div>
      </div>
    </form>
  );
}
