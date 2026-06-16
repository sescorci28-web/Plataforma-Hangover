"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
  Sparkles, MapPin, Calendar, Clock, DollarSign, Star, 
  Sliders, MessageSquare, Check, Plus, Trash, ArrowRight, 
  Heart, Info, AlertTriangle, Loader2, CheckCircle2, 
  ChevronDown, Settings, Send, RotateCcw, HelpCircle, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { requestPlannerPackage } from "@/app/services/planner/actions";

function normalizeCategory(cat: string): string {
  const c = (cat || "").toLowerCase().trim();
  if (c === "music" || c === "dj" || c.startsWith("dj-") || c.includes("vallenato") || c.includes("mariachi") || c.includes("saxo") || c.includes("violin") || c.includes("banda") || c.includes("show")) {
    return "music";
  }
  if (c === "sound" || c === "luces" || c === "iluminacion" || c === "iluminación") {
    return "sound";
  }
  if (c === "bar" || c === "coctel" || c === "cóctel" || c === "bartender") {
    return "bar";
  }
  if (c === "media" || c === "foto" || c === "video" || c === "fotógrafo" || c === "videógrafo" || c === "drone") {
    return "media";
  }
  if (c === "staff" || c === "security" || c === "seguridad" || c === "mesero" || c === "anfitriona" || c === "hostess") {
    return "staff";
  }
  if (c === "decor" || c === "flores" || c === "globos") {
    return "decor";
  }
  if (c === "premium" || c === "vip") {
    return "premium";
  }
  if (c === "catering" || c === "logistics" || c === "transport" || c === "social" || c === "others" || c === "comida" || c === "transporte" || c === "mobiliario" || c === "bodas") {
    return "others";
  }
  return c;
}

// Types
interface ServiceProviderProfile {
  id: string;
  full_name: string | null;
  city: string | null;
}

interface PlannerService {
  id: string;
  provider_id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  price_type: "fixed" | "hourly" | "per_guest" | string;
  category: string;
  image_url: string | null;
  cover_url: string | null;
  average_rating: number | null;
  base_city: string | null;
  is_active: boolean;
  provider: ServiceProviderProfile | null;
}

interface PlannerClientProps {
  initialServices: PlannerService[];
  user: any;
}

// Categories list matching standard platform
const CATEGORIES = [
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

const CITIES = ["Barranquilla", "Cartagena", "Medellín", "Bogotá", "Cali", "Santa Marta"];

const EVENT_TYPES = [
  { id: "birthday", name: "Cumpleaños", icon: "🎂" },
  { id: "private", name: "Fiesta Privada", icon: "🎧" },
  { id: "wedding", name: "Boda / Matrimonio", icon: "💍" },
  { id: "corporate", name: "Evento Corporativo", icon: "🏢" },
  { id: "graduation", name: "Graduación", icon: "🎓" },
  { id: "concert", name: "Concierto", icon: "🎤" },
  { id: "other", name: "Otro", icon: "✨" }
];

export function PlannerClient({ initialServices, user }: PlannerClientProps) {
  const [isPending, startTransition] = useTransition();

  // Settings states
  const [eventType, setEventType] = useState("private");
  const [inputText, setInputText] = useState("");
  const [budget, setBudget] = useState<number>(3000000);
  const [guests, setGuests] = useState<number>(80);
  const [selectedCity, setSelectedCity] = useState("Barranquilla");

  // Categories priority configuration
  // priority: 1 (Alta), 2 (Media), 3 (Baja)
  const [categoryConfigs, setCategoryConfigs] = useState<Record<string, { enabled: boolean; priority: number }>>(() => {
    const initial: Record<string, { enabled: boolean; priority: number }> = {};
    CATEGORIES.forEach((cat) => {
      // Default configurations
      if (cat.id === "music" || cat.id === "sound") {
        initial[cat.id] = { enabled: true, priority: 1 };
      } else if (cat.id === "bar" || cat.id === "catering" || cat.id === "logistics") {
        initial[cat.id] = { enabled: true, priority: 2 };
      } else {
        initial[cat.id] = { enabled: false, priority: 3 };
      }
    });
    return initial;
  });

  // Hot selection state overrides for customizing proposal packages
  // Map of proposalType -> CategoryId -> ServiceId
  const [customSelections, setCustomSelections] = useState<Record<string, Record<string, string>>>({
    economica: {},
    recomendada: {},
    premium: {}
  });

  // State for proposal validation errors/notifications
  const [parserFeedback, setParserFeedback] = useState<string | null>(null);

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedProposalType, setSelectedProposalType] = useState<"economica" | "recomendada" | "premium" | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Saved proposals state (stored in localStorage)
  const [savedProposals, setSavedProposals] = useState<any[]>([]);

  // Load saved proposals from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("hangover_planner_proposals");
    if (saved) {
      try {
        setSavedProposals(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Synonyms and input interpreting logic
  const handleInterpretInput = () => {
    if (!inputText.trim()) return;

    // 1. Extract Budget
    let parsedBudget: number | null = null;
    const millionMatch = inputText.match(/([\d\.,]+)\s*(?:millon|millones|m|million|millions)\b/i);
    if (millionMatch) {
      const num = parseFloat(millionMatch[1].replace(",", ".").replace(/\s/g, ""));
      if (!isNaN(num)) {
        parsedBudget = num * 1000000;
      }
    } else {
      const numberMatch = inputText.match(/(?:(?:[\d]{1,3}(?:\.[\d]{3})+)|(?:[\d]{5,}))/);
      if (numberMatch) {
        const num = parseInt(numberMatch[0].replace(/\./g, ""), 10);
        if (!isNaN(num)) {
          parsedBudget = num;
        }
      }
    }

    // 2. Extract Guests
    let parsedGuests: number | null = null;
    const guestsMatch = inputText.match(/(\d+)\s*(?:personas|invitados|asistentes|invitadas|gent|pax)/i);
    if (guestsMatch) {
      const num = parseInt(guestsMatch[1], 10);
      if (!isNaN(num)) {
        parsedGuests = num;
      }
    }

    // 3. Extract City
    let parsedCity: string | null = null;
    const normalizedText = inputText.toLowerCase();
    for (const city of CITIES) {
      const regex = new RegExp(`\\b${city.toLowerCase()}\\b`, "i");
      if (regex.test(normalizedText)) {
        parsedCity = city;
        break;
      }
    }

    // 4. Extract Category Keywords & Enable them
    const categoryKeywords: Record<string, string[]> = {
      music: ["dj", "banda", "música", "musica", "cantante", "grupo", "mariachi", "saxo", "violín", "violin", "show", "animador", "hora loca", "orquesta", "artista"],
      sound: ["sonido", "bafle", "parlante", "luces", "iluminación", "iluminacion", "tarima", "pantalla", "humo", "pirotecnia", "láser", "laser"],
      bar: ["bar", "bebida", "tragos", "coctel", "cóctel", "bartender", "mixólogo", "shots", "barra"],
      catering: ["comida", "catering", "cena", "buffet", "pasabocas", "chef", "parrillero", "food truck", "postre", "torta"],
      logistics: ["mesa", "silla", "carpa", "sala lounge", "mueble", "mobiliario", "vajilla", "mantelería", "cristalería"],
      decor: ["decoración", "decoracion", "flor", "globo", "backing", "centro de mesa", "ambientación", "ambientacion"],
      staff: ["mesero", "limpieza", "hostess", "recepcionista", "protocolo"],
      security: ["seguridad", "escolta", "vigilancia", "acceso"],
      media: ["foto", "video", "fotógrafo", "videógrafo", "drone", "cámara", "camara", "cabina"],
      transport: ["transporte", "van", "bus", "limusina", "chofer"],
      social: ["planner", "organizador", "wedding", "coordinador"],
      premium: ["celebridad", "famoso", "lujo", "vip"]
    };

    const newConfigs = { ...categoryConfigs };
    let categoryFound = false;

    // Reset categories enabled status for matched keywords
    Object.keys(newConfigs).forEach((catId) => {
      newConfigs[catId].enabled = false;
    });

    Object.entries(categoryKeywords).forEach(([catId, keywords]) => {
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}`, "i");
        if (regex.test(normalizedText)) {
          newConfigs[catId].enabled = true;
          categoryFound = true;
          break;
        }
      }
    });

    // Fallback if no category found
    if (!categoryFound) {
      newConfigs["music"].enabled = true;
      newConfigs["sound"].enabled = true;
    }

    // Apply parsed values
    let feedback = "¡Texto analizado con éxito! ";
    if (parsedBudget) {
      setBudget(parsedBudget);
      feedback += `Presupuesto: ${formatCurrency(parsedBudget)}. `;
    }
    if (parsedGuests) {
      setGuests(parsedGuests);
      feedback += `Asistentes: ${parsedGuests}. `;
    }
    if (parsedCity) {
      setSelectedCity(parsedCity);
      feedback += `Ciudad: ${parsedCity}. `;
    }
    setCategoryConfigs(newConfigs);

    // Reset custom selections since we have a new search/interpret input
    setCustomSelections({ economica: {}, recomendada: {}, premium: {} });

    setParserFeedback(feedback);
    setTimeout(() => setParserFeedback(null), 5000);
  };

  // Handle Event Type Changes (Preselects configs)
  const handleEventTypeChange = (typeId: string) => {
    setEventType(typeId);
    const newConfigs = { ...categoryConfigs };
    
    // Reset configs
    CATEGORIES.forEach((cat) => {
      newConfigs[cat.id] = { enabled: false, priority: 3 };
    });

    if (typeId === "birthday") {
      newConfigs["music"] = { enabled: true, priority: 1 };
      newConfigs["sound"] = { enabled: true, priority: 1 };
      newConfigs["bar"] = { enabled: true, priority: 2 };
      newConfigs["decor"] = { enabled: true, priority: 2 };
    } else if (typeId === "wedding") {
      newConfigs["music"] = { enabled: true, priority: 1 };
      newConfigs["sound"] = { enabled: true, priority: 1 };
      newConfigs["catering"] = { enabled: true, priority: 1 };
      newConfigs["decor"] = { enabled: true, priority: 2 };
      newConfigs["logistics"] = { enabled: true, priority: 2 };
      newConfigs["media"] = { enabled: true, priority: 2 };
    } else if (typeId === "corporate") {
      newConfigs["music"] = { enabled: true, priority: 2 };
      newConfigs["sound"] = { enabled: true, priority: 1 };
      newConfigs["catering"] = { enabled: true, priority: 1 };
      newConfigs["logistics"] = { enabled: true, priority: 2 };
      newConfigs["staff"] = { enabled: true, priority: 2 };
    } else {
      // Private / Graduations / Concert / Others
      newConfigs["music"] = { enabled: true, priority: 1 };
      newConfigs["sound"] = { enabled: true, priority: 1 };
      newConfigs["bar"] = { enabled: true, priority: 2 };
      newConfigs["logistics"] = { enabled: true, priority: 2 };
    }

    setCategoryConfigs(newConfigs);
    setCustomSelections({ economica: {}, recomendada: {}, premium: {} });
  };

  // Toggle Category
  const toggleCategory = (catId: string) => {
    setCategoryConfigs((prev) => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        enabled: !prev[catId].enabled
      }
    }));
  };

  // Change Category Priority
  const changeCategoryPriority = (catId: string, priority: number) => {
    setCategoryConfigs((prev) => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        priority
      }
    }));
  };

  // Filter and compute services selection
  // Returns all services belonging to selected city
  const cityServices = initialServices.filter((s) => {
    const serviceCity = (s.base_city || s.provider?.city || "").toLowerCase();
    return serviceCity.includes(selectedCity.toLowerCase());
  });

  const getServiceCost = (service: PlannerService) => {
    const basePrice = service.price || 0;
    if (service.price_type === "hourly") {
      return basePrice * 5; // Standard 5 hour event
    }
    if (service.price_type === "per_guest") {
      return basePrice * guests;
    }
    return basePrice;
  };

  // Generation of packages
  const buildProposal = (strategy: "economica" | "recomendada" | "premium") => {
    const enabledCategories = CATEGORIES.filter((c) => categoryConfigs[c.id]?.enabled);
    
    // Sort categories: Priority 1 first, then 2, then 3
    const sortedCategories = [...enabledCategories].sort((a, b) => {
      const pA = categoryConfigs[a.id]?.priority || 3;
      const pB = categoryConfigs[b.id]?.priority || 3;
      return pA - pB;
    });

    const chosenServices: PlannerService[] = [];
    const excludedServices: Array<{ service: PlannerService; reason: string }> = [];
    let remainingBudget = budget;

    // Use services in the selected city, fall back to initialServices if none exist to prevent blank state
    const pool = cityServices.length > 0 ? cityServices : initialServices;

    sortedCategories.forEach((cat) => {
      // Find all services in this category
      const catServices = pool.filter((s) => normalizeCategory(s.category) === cat.id);
      if (catServices.length === 0) return;

      let selectedService: PlannerService | null = null;

      // Check if user has overridden selection for this proposal type & category
      const customId = customSelections[strategy]?.[cat.id];
      if (customId) {
        selectedService = catServices.find((s) => s.id === customId) || null;
      }

      if (!selectedService) {
        // Run standard strategies
        if (strategy === "economica") {
          // Sort by price ascending
          const sorted = [...catServices].sort((a, b) => getServiceCost(a) - getServiceCost(b));
          selectedService = sorted[0];
        } 
        else if (strategy === "recomendada") {
          // Filter rating >= 4.0
          const highlyRated = catServices.filter((s) => (s.average_rating || 5) >= 4.0);
          const poolToSelect = highlyRated.length > 0 ? highlyRated : catServices;
          // Select value (rating / price ratio) or closest to average
          const sorted = [...poolToSelect].sort((a, b) => {
            const ratingA = a.average_rating || 5;
            const ratingB = b.average_rating || 5;
            const costA = getServiceCost(a) || 1;
            const costB = getServiceCost(b) || 1;
            return (ratingB / costB) - (ratingA / costA); // Descending value ratio
          });
          selectedService = sorted[0];
        } 
        else {
          // Premium: highest rating, then highest price
          const sorted = [...catServices].sort((a, b) => {
            const ratingA = a.average_rating || 0;
            const ratingB = b.average_rating || 0;
            if (ratingB !== ratingA) return ratingB - ratingA;
            return getServiceCost(b) - getServiceCost(a);
          });
          selectedService = sorted[0];
        }
      }

      if (selectedService) {
        const cost = getServiceCost(selectedService);
        const priority = categoryConfigs[cat.id]?.priority || 3;

        // If the service fits in budget, or if it's high priority (1) we keep it even if it exceeds the budget
        if (cost <= remainingBudget || priority === 1) {
          chosenServices.push(selectedService);
          remainingBudget -= cost;
        } else {
          // Low priority/exceeded
          excludedServices.push({
            service: selectedService,
            reason: `Excede presupuesto por ${formatCurrency(cost - remainingBudget)}`
          });
        }
      }
    });

    const totalCost = chosenServices.reduce((acc, s) => acc + getServiceCost(s), 0);
    const usagePercentage = Math.round((totalCost / budget) * 100);

    // Custom explanation text
    let explanation = "";
    const cityText = cityServices.length > 0 ? selectedCity : "otras locaciones (cobertura nacional)";
    
    if (strategy === "economica") {
      explanation = `Esta opción prioriza el ahorro en ${cityText}. Financia tus categorías principales al menor costo posible, utilizando el ${usagePercentage}% de tu presupuesto y dejándote un saldo de ${formatCurrency(Math.max(0, budget - totalCost))}.`;
    } else if (strategy === "recomendada") {
      explanation = `La propuesta recomendada balancea reputación (proveedores con calificación ≥ 4.0) y costo en ${cityText}. Optimiza el aprovechamiento del presupuesto para darte la mayor calidad por tu inversión.`;
    } else {
      explanation = `La propuesta Premium agrupa los proveedores mejor calificados y de mayor prestigio en ${cityText}. Ideal para quienes buscan una experiencia impecable de primer nivel sin comprometer detalles.`;
    }

    return {
      type: strategy,
      services: chosenServices,
      excluded: excludedServices,
      totalCost,
      usagePercentage,
      remainingBudget: budget - totalCost,
      explanation
    };
  };

  const economicaProposal = buildProposal("economica");
  const recomendadaProposal = buildProposal("recomendada");
  const premiumProposal = buildProposal("premium");

  // Handle Hot Swap for a category in a proposal type
  const handleServiceSwap = (strategy: "economica" | "recomendada" | "premium", categoryId: string, serviceId: string) => {
    setCustomSelections((prev) => ({
      ...prev,
      [strategy]: {
        ...prev[strategy],
        [categoryId]: serviceId
      }
    }));
  };

  // Get other available services in the same category & city
  const getAlternativeServices = (categoryId: string, currentServiceId: string) => {
    const pool = cityServices.length > 0 ? cityServices : initialServices;
    return pool.filter((s) => normalizeCategory(s.category) === categoryId && s.id !== currentServiceId);
  };

  // Save Proposal
  const handleSaveProposal = (proposal: any) => {
    const payload = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      eventType,
      budget,
      guests,
      selectedCity,
      totalCost: proposal.totalCost,
      type: proposal.type,
      services: proposal.services.map((s: PlannerService) => ({
        id: s.id,
        title: s.title,
        price: s.price,
        price_type: s.price_type,
        category: s.category,
        provider_id: s.provider_id,
        providerName: s.provider?.full_name || "Proveedor Hangover"
      }))
    };

    const updated = [payload, ...savedProposals];
    setSavedProposals(updated);
    localStorage.setItem("hangover_planner_proposals", JSON.stringify(updated));
    alert("❤️ ¡Propuesta guardada localmente! Puedes revisarla en la parte inferior.");
  };

  // Delete Saved Proposal
  const handleDeleteSaved = (id: string) => {
    const updated = savedProposals.filter((p) => p.id !== id);
    setSavedProposals(updated);
    localStorage.setItem("hangover_planner_proposals", JSON.stringify(updated));
  };

  // Load Saved Proposal settings back
  const handleLoadSaved = (saved: any) => {
    setEventType(saved.eventType || "private");
    setBudget(saved.budget);
    setGuests(saved.guests || 80);
    setSelectedCity(saved.selectedCity || "Barranquilla");
    
    // Enable and set priority based on saved categories
    const newConfigs = { ...categoryConfigs };
    CATEGORIES.forEach((cat) => {
      newConfigs[cat.id] = { enabled: false, priority: 3 };
    });

    const overrides: Record<string, string> = {};
    saved.services.forEach((s: any) => {
      newConfigs[s.category] = { enabled: true, priority: 2 };
      overrides[s.category] = s.id;
    });

    setCategoryConfigs(newConfigs);
    setCustomSelections({
      [saved.type]: overrides,
      economica: {},
      recomendada: {},
      premium: {}
    });
  };

  // Request Package (Opens Modal)
  const openRequestModal = (type: "economica" | "recomendada" | "premium") => {
    if (!user) {
      window.location.href = `/login?redirect=/services/planner`;
      return;
    }
    setSelectedProposalType(type);
    setBookingDate("");
    setBookingTime("");
    setBookingNotes("");
    setBookingSuccess(false);
    setBookingError(null);
    setIsBookingModalOpen(true);
  };

  const handleConfirmRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposalType) return;

    const proposal = 
      selectedProposalType === "economica" ? economicaProposal :
      selectedProposalType === "recomendada" ? recomendadaProposal : premiumProposal;

    if (proposal.services.length === 0) {
      setBookingError("No hay servicios seleccionados en este paquete.");
      return;
    }

    if (!bookingDate) {
      setBookingError("La fecha del evento es obligatoria.");
      return;
    }

    const servicesPayload = proposal.services.map((s) => ({
      serviceId: s.id,
      providerId: s.provider_id,
      subtotal: getServiceCost(s)
    }));

    const eventTypeName = EVENT_TYPES.find((t) => t.id === eventType)?.name || eventType;

    startTransition(async () => {
      const response = await requestPlannerPackage(
        servicesPayload,
        bookingDate,
        bookingTime,
        guests,
        bookingNotes,
        eventTypeName
      );

      if (response.error) {
        setBookingError(response.error);
      } else {
        setBookingSuccess(true);
        setTimeout(() => {
          setIsBookingModalOpen(false);
          window.location.href = "/dashboard/user";
        }, 2500);
      }
    });
  };

  // Visual classes for progress bars
  const getProgressBarColor = (percentage: number) => {
    if (percentage > 100) return "bg-red-500 shadow-md shadow-red-500/20";
    if (percentage >= 90) return "bg-emerald-500 shadow-md shadow-emerald-500/20";
    if (percentage >= 70) return "bg-indigo-500 shadow-md shadow-indigo-500/20";
    return "bg-amber-500 shadow-md shadow-amber-500/20";
  };

  const getProgressBarTextColor = (percentage: number) => {
    if (percentage > 100) return "text-red-400";
    if (percentage >= 90) return "text-emerald-400";
    if (percentage >= 70) return "text-indigo-400";
    return "text-amber-400";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* LEFT COLUMN: Input form and variables adjusters */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Step 1: Type of Event Selection */}
        <div className="glass-card p-6 bg-[#07070d]/90 border-white/5 space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-primary-400" />
            1. Tipo de Evento
          </h3>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleEventTypeChange(type.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  eventType === type.id
                    ? "bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-500/10"
                    : "bg-black/35 border-white/5 text-zinc-450 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Intelligent Prompt Reader */}
        <div className="glass-card p-6 bg-[#07070d]/90 border-white/5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 blur-3xl pointer-events-none rounded-full" />
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            2. Entrada de Texto Inteligente
          </h3>
          <p className="text-[11px] text-zinc-500">
            Escribe libremente tu idea en español. Nuestro motor extraerá el presupuesto, invitados, ciudad y categorías.
          </p>
          <div className="space-y-3">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ej: Tengo 4 millones para una boda de 90 invitados en Barranquilla con sonido, luces y catering, el dj es lo más importante..."
              className="w-full min-h-[90px] bg-black/45 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 resize-none font-sans"
            />
            <button
              onClick={handleInterpretInput}
              disabled={!inputText.trim()}
              className="w-full bg-primary-600 hover:bg-primary-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-primary-500/10"
            >
              <Send className="w-3.5 h-3.5" />
              Interpretar Texto
            </button>
          </div>

          <AnimatePresence>
            {parserFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{parserFeedback}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 3: Precise Slider and Priorities Settings */}
        <div className="glass-card p-6 bg-[#07070d]/90 border-white/5 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-primary-400" />
              3. Ajustes de Variables
            </h3>
            <button
              onClick={() => {
                setBudget(3000000);
                setGuests(80);
                setSelectedCity("Barranquilla");
              }}
              className="text-[10px] uppercase font-bold text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="space-y-4">
            {/* Budget Box and Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-zinc-400">Presupuesto</span>
                <span className="text-emerald-400 font-extrabold font-outfit text-sm">
                  {formatCurrency(budget)}
                </span>
              </div>
              <input
                type="range"
                min={1000000}
                max={20000000}
                step={500000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-primary-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-medium">
                <span>$1 Millón</span>
                <span>$20 Millones</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* City Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block">Ciudad</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setCustomSelections({ economica: {}, recomendada: {}, premium: {} });
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 cursor-pointer"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c} className="bg-zinc-950 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Number of guests */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block">Invitados</label>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Categories Toggles and Priority level setting */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block">
                Categorías Incluidas y Prioridades
              </label>
              
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {CATEGORIES.map((cat) => {
                  const config = categoryConfigs[cat.id] || { enabled: false, priority: 3 };
                  return (
                    <div 
                      key={cat.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        config.enabled 
                          ? "bg-[#0c0c17] border-primary-500/25" 
                          : "bg-black/20 border-white/5 opacity-60 hover:opacity-85"
                      }`}
                    >
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className="flex items-center gap-2 text-left cursor-pointer flex-grow"
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          config.enabled ? "bg-primary-600 border-primary-500 text-white" : "border-white/20"
                        }`}>
                          {config.enabled && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-semibold text-white">
                          {cat.icon} {cat.name}
                        </span>
                      </button>

                      {config.enabled && (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase mr-1">Prioridad</span>
                          {[1, 2, 3].map((level) => {
                            const label = level === 1 ? "A" : level === 2 ? "M" : "B";
                            const titleText = level === 1 ? "Alta" : level === 2 ? "Media" : "Baja";
                            return (
                              <button
                                key={level}
                                title={titleText}
                                onClick={() => changeCategoryPriority(cat.id, level)}
                                className={`w-6 h-6 rounded-md text-[9px] font-black flex items-center justify-center transition-all cursor-pointer border ${
                                  config.priority === level
                                    ? "bg-primary-500 border-primary-400 text-white shadow-sm"
                                    : "bg-black/40 border-white/5 text-zinc-550 hover:bg-white/5"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Comparative proposals cards */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Proposal Selector/Tabs Header */}
        <div className="border-b border-white/5 pb-3">
          <h2 className="text-lg font-bold text-white font-outfit flex items-center gap-2">
            <span>🎉 Propuestas de Eventos en Tiempo Real</span>
            <span className="bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
              {selectedCity}
            </span>
          </h2>
        </div>

        {/* The 3 Proposal cards in layout stack */}
        <div className="space-y-6">
          {[economicaProposal, recomendadaProposal, premiumProposal].map((prop) => {
            const isEconomic = prop.type === "economica";
            const isRecommended = prop.type === "recomendada";
            const badgeLabel = isEconomic ? "Económica" : isRecommended ? "Recomendada ⭐" : "Premium VIP";
            const badgeColor = isEconomic ? "bg-amber-500/10 border-amber-500/25 text-amber-400" :
                              isRecommended ? "bg-primary-500/15 border-primary-500/25 text-primary-400" :
                              "bg-indigo-500/10 border-indigo-500/25 text-indigo-400";

            return (
              <div 
                key={prop.type}
                className={`glass-card p-6 bg-[#07070c]/90 relative overflow-hidden transition-all duration-300 border ${
                  isRecommended ? "border-primary-500/40 glow" : "border-white/5 hover:border-white/10"
                }`}
              >
                {/* Background aura for recommended proposal */}
                {isRecommended && (
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 blur-3xl pointer-events-none rounded-full" />
                )}

                {/* Card Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeColor}`}>
                      {badgeLabel}
                    </span>
                    <h3 className="text-lg font-bold text-white font-outfit">
                      {isEconomic ? "Propuesta de Costo Mínimo" : isRecommended ? "Mejor Relación Calidad/Precio" : "Paquete de Alta Gama"}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Costo Total Estimado</p>
                    <p className="text-2xl font-black text-emerald-400 font-outfit">
                      {formatCurrency(prop.totalCost)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar Aprovechamiento */}
                <div className="py-4 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-zinc-400">Aprovechamiento del Presupuesto</span>
                    <span className={getProgressBarTextColor(prop.usagePercentage)}>
                      {prop.usagePercentage}% {prop.usagePercentage > 100 ? "(Excedido)" : ""}
                    </span>
                  </div>
                  
                  <div className="w-full bg-zinc-950 rounded-full h-3.5 border border-white/5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(prop.usagePercentage)}`} 
                      style={{ width: `${Math.min(100, prop.usagePercentage)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Restante: {formatCurrency(Math.max(0, prop.remainingBudget))}</span>
                    {prop.remainingBudget < 0 && (
                      <span className="text-red-400 font-bold">Excedido por: {formatCurrency(Math.abs(prop.remainingBudget))}</span>
                    )}
                  </div>
                </div>

                {/* Explanation text */}
                <p className="text-xs text-zinc-400 bg-white/3 border border-white/5 p-3 rounded-xl leading-relaxed mb-4">
                  {prop.explanation}
                </p>

                {/* Selected Services Listing */}
                <div className="space-y-3">
                  <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest block">
                    Proveedores Seleccionados ({prop.services.length})
                  </span>

                  {prop.services.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-xs border border-dashed border-white/10 rounded-xl">
                      Ningún servicio seleccionado o disponible para esta configuración.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {prop.services.map((service) => {
                        const cost = getServiceCost(service);
                        const normCat = normalizeCategory(service.category);
                        const categoryObj = CATEGORIES.find((c) => c.id === normCat);
                        const alts = getAlternativeServices(normCat, service.id);

                        return (
                          <div 
                            key={service.id}
                            className="p-3 bg-black/40 border border-white/5 hover:border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex-shrink-0 flex items-center justify-center text-md">
                                {categoryObj?.icon || "🎉"}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white truncate max-w-[200px]">
                                  {service.title}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                                  <span className="truncate max-w-[120px] font-semibold">
                                    Por {service.provider?.full_name || "Proveedor"}
                                  </span>
                                  <span className="flex items-center gap-0.5 bg-white/5 px-1.5 py-0.5 rounded text-amber-400">
                                    <Star className="w-2.5 h-2.5" />
                                    {(service.average_rating || 5.0).toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Cost display & Hot Swap dropdown */}
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="text-left sm:text-right">
                                <span className="text-xs font-bold text-emerald-400 block font-outfit">
                                  {formatCurrency(cost)}
                                </span>
                                <span className="text-[9px] text-zinc-550 block">
                                  {service.price_type === "hourly" ? "$/hora (x5 hrs)" :
                                   service.price_type === "per_guest" ? `$/invitado (x${guests})` : "Precio fijo"}
                                </span>
                              </div>

                              {/* Alternatives Dropdown for Hot Swap */}
                              {alts.length > 0 ? (
                                <div className="relative shrink-0">
                                  <select
                                    value={service.id}
                                    onChange={(e) => handleServiceSwap(prop.type, service.category, e.target.value)}
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-1 px-2.5 text-[10px] text-zinc-300 font-bold focus:outline-none cursor-pointer max-w-[120px]"
                                  >
                                    <option value={service.id}>Cambiar proveedor...</option>
                                    {alts.map((alt) => (
                                      <option key={alt.id} value={alt.id} className="bg-zinc-950 text-white text-[10px]">
                                        {alt.title.substring(0, 15)}... ({formatCurrency(getServiceCost(alt))})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <span className="text-[9px] text-zinc-600 italic shrink-0">Único proveedor</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Excluded low priority services detail list */}
                  {prop.excluded.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-widest block">
                        Excluidos por límite de presupuesto ({prop.excluded.length})
                      </span>
                      {prop.excluded.map(({ service, reason }) => {
                        const categoryObj = CATEGORIES.find((c) => c.id === service.category);
                        return (
                          <div 
                            key={service.id}
                            className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl flex items-center justify-between gap-3 text-xs opacity-75"
                          >
                            <span className="text-zinc-500 font-medium truncate max-w-[200px]">
                              {categoryObj?.icon} {service.title}
                            </span>
                            <span className="text-red-400 font-bold text-[10px]">
                              {reason}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Interactive Card Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-4 border-t border-white/5">
                  <button
                    onClick={() => handleSaveProposal(prop)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    Guardar Propuesta
                  </button>

                  <button
                    onClick={() => openRequestModal(prop.type)}
                    disabled={prop.services.length === 0}
                    className="w-full bg-primary-600 hover:bg-primary-500 active:scale-95 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-grow shadow-lg"
                  >
                    Solicitar Todo ({prop.services.length} Servicios)
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Local Persisted Proposals Section */}
        {savedProposals.length > 0 && (
          <div className="glass-card p-6 bg-[#07070d]/90 border-white/5 space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
              Tus Propuestas Guardadas ({savedProposals.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedProposals.map((saved) => {
                const dateText = new Date(saved.createdAt).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                });
                const eventTypeName = EVENT_TYPES.find((t) => t.id === saved.eventType)?.name || saved.eventType;

                return (
                  <div 
                    key={saved.id}
                    className="p-4 bg-black/45 border border-white/5 rounded-2xl space-y-3 flex flex-col justify-between hover:border-white/10 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-zinc-500">
                        <span>{dateText}</span>
                        <span className="capitalize text-primary-400 font-bold bg-primary-500/5 px-2 py-0.5 rounded-full border border-primary-500/10">
                          {saved.type}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white font-outfit line-clamp-1">
                        Evento: {eventTypeName} en {saved.selectedCity}
                      </h4>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">Total:</span>
                        <span className="text-emerald-400 font-black font-outfit">
                          {formatCurrency(saved.totalCost)}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate">
                        {saved.services.length} proveedores para {saved.guests || 80} personas
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleLoadSaved(saved)}
                        className="flex-grow bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white py-2 px-3 rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Cargar Parámetros
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(saved.id)}
                        className="p-2 bg-red-950/20 hover:bg-red-500/20 text-rose-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar propuesta"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* BOOKING MODAL FOR SENDING REQUESTS */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg overflow-hidden relative border-white/10 bg-[#07070c] shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white font-outfit">✨ Solicitar Todo el Paquete</h3>
                  <p className="text-xs text-zinc-400">Envío de reservas en estado pendiente a los proveedores</p>
                </div>
                <button
                  onClick={() => setIsBookingModalOpen(false)}
                  disabled={isPending}
                  className="text-zinc-400 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleConfirmRequest} className="p-6 space-y-4">
                
                {bookingError && (
                  <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {bookingSuccess && (
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>¡Solicitudes creadas con éxito! Redirigiendo a tu panel...</span>
                  </div>
                )}

                {/* Event summary details */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                  <span className="text-[10px] text-primary-400 font-extrabold uppercase tracking-wider block">
                    Resumen del Paquete Seleccionado
                  </span>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Tipo de Evento</span>
                      <span className="text-white font-bold font-outfit capitalize">
                        {EVENT_TYPES.find((t) => t.id === eventType)?.name || eventType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Ubicación</span>
                      <span className="text-white font-bold">{selectedCity}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Invitados</span>
                      <span className="text-white font-bold">{guests} asistentes</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2 mt-2">
                      <span className="text-zinc-400 font-bold">Importe Total</span>
                      <span className="text-md font-extrabold text-emerald-400 font-outfit">
                        {formatCurrency(
                          selectedProposalType === "economica" ? economicaProposal.totalCost :
                          selectedProposalType === "recomendada" ? recomendadaProposal.totalCost : premiumProposal.totalCost
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 ml-1">Fecha del Evento</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-zinc-500" />
                      </div>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        required
                        disabled={isPending || bookingSuccess}
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                      />
                    </div>
                  </div>

                  {/* Time Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 ml-1">Hora de Inicio</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 text-zinc-500" />
                      </div>
                      <input
                        type="time"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        required
                        disabled={isPending || bookingSuccess}
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Instrucciones Especiales / Requerimientos</label>
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Escribe notas especiales sobre la tarima, el lugar, indicaciones de llegada para los proveedores, etc."
                    disabled={isPending || bookingSuccess}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/50 min-h-[90px] resize-none"
                  />
                </div>

                <div className="bg-primary-500/5 border border-primary-500/10 p-3.5 rounded-xl text-[10px] text-zinc-400 flex items-start gap-2 leading-relaxed">
                  <Info className="w-4 h-4 shrink-0 text-primary-400 mt-0.5" />
                  <span>
                    <strong>Importante:</strong> Los proveedores serán notificados inmediatamente. Las solicitudes se registrarán como <strong>pendientes</strong> para que cada proveedor valide individualmente su disponibilidad antes de confirmar.
                  </span>
                </div>

                {/* Action Button */}
                {!bookingSuccess && (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3.5 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando Solicitudes...
                      </>
                    ) : (
                      "Confirmar y Solicitar Paquete"
                    )}
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
