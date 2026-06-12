"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  MapPin,
  Clock,
  Building2,
  Star,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Ticket,
  DollarSign,
  Users,
  ShoppingBag,
  Bell,
  CheckCircle,
  Eye,
  EyeOff,
  ImagePlus,
  UploadCloud,
  ArrowLeft,
  Coffee,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  Trophy,
  Zap,
  Settings,
  Layers,
  Globe,
  Phone,
  Share2,
  Compass,
  Link2,
  Shield,
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  CreditCard,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateClub, deleteClub, getClubPaymentSettings, updateClubPaymentSettings, getClubPayoutHistory } from "@/app/(dashboard)/dashboard/provider/clubs/actions";
import { ClubMenuServicesManager } from "@/app/(dashboard)/dashboard/provider/clubs/ClubMenuServicesManager";
import { CLUB_MODULES } from "@/app/(dashboard)/dashboard/provider/clubs/constants";
import { ClubDashboardCharts } from "./ClubDashboardCharts";
import { ClubMediaManager } from "./ClubMediaManager";
import { updateOrderStatus, attendAssistanceRequest } from "@/app/services/liveActions";

interface Club {
  id: string;
  name: string;
  slug: string;
  city: string;
  description: string | null;
  banner_image: string | null;
  logo: string | null;
  address: string | null;
  instagram: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  website?: string | null;
  opening_hours: string | null;
  rating: number;
  active: boolean;
  cover_price: number | null;
  capacity?: number;
  created_at: string;
  amenities?: string[] | null;
  club_type?: string;
  whatsapp?: string | null;
  price_range?: string;
  payment_methods?: string[];
  latitude?: number | null;
  longitude?: number | null;
  video_hero?: string | null;
  hero_image?: string | null;
  enabled_modules?: string[];
  modules_config?: Record<string, any>;
  status?: 'draft' | 'pending_review' | 'published' | 'paused' | 'archived';
  visibility?: 'public' | 'private' | 'unlisted';
  plan_type?: 'free' | 'pro' | 'enterprise';
  brand_id?: string | null;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
  image_url: string | null;
  category: string;
}

interface ClubDashboardStats {
  peopleInside: number;
  tablesOccupied: number;
  tablesFree: number;
  ordersActive: number;
  connectPresenceCount: number;
  activeEventTitle: string;

  // Today metrics
  revenueToday: number;
  coversToday: number;
  tableReservationsToday: number;
  bottlesSoldToday: number;
  eventRevenueToday: number;

  // Ticket Promedio
  ticketPromedioToday: number;
  ticketPromedioYesterday: number;
  ticketPromedioDiffPct: number | null;

  // Alerts
  pendingBookingsCount: number;
  delayedOrdersCount: number;
  failedQrScansCount: number;
  pendingAssistanceCount: number;

  // All-time or weekly fallbacks
  coversThisWeek: number;
  coversThisMonth: number;
  coversThisYear: number;
  coversDiffPct: number | null;
  revenueThisMonth: number;
  revenueThisYear: number;
  revDiffPct: number | null;
  totalCheckedInUsers: number;
}

interface ActiveOrder {
  id: string;
  status: string;
  created_at: string;
  tableNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
}

interface ActivityFeedItem {
  id: string;
  type: string;
  text: string;
  time: Date | string;
}

interface TopWaiter {
  name: string;
  salesGenerated: number;
  ordersAttended: number;
  ticketPromedio: number;
}

interface ClubDashboardViewProps {
  club: Club;
  stats: ClubDashboardStats;
  chartsData: any[];
  topProducts: TopProduct[];
  multimediaStats?: {
    activeStories: number;
    galleryItems: number;
    totalVideos: number;
    featuredItems: number;
  };
  activeOrders?: ActiveOrder[];
  activityFeed?: ActivityFeedItem[];
  connectPresence?: any[];
  activeEventStats?: {
    title: string;
    ticketsSold: number;
    attendance: number;
    revenue: number;
  };
  topWaiters?: TopWaiter[];
}

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateImageFile(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Solo se permiten imágenes JPG, PNG, WEBP o GIF.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "La imagen debe pesar menos de 3MB.";
  }
  return null;
}

async function uploadClubAsset(file: File, bucket: "banners" | "logos") {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("No fue posible subir la imagen. Usuario no autenticado.");
  }

  const cleanName = file.name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 60);

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${user.id}/clubs/${bucket}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${cleanName || "asset"}.${fileExt}`;

  const { error } = await supabase.storage.from("avatars").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message || `No fue posible subir la imagen a avatars/clubs/${bucket}.`);
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return data.publicUrl;
}

export function ClubDashboardView({
  club,
  stats,
  chartsData,
  topProducts,
  multimediaStats = { activeStories: 0, galleryItems: 0, totalVideos: 0, featuredItems: 0 },
  activeOrders = [],
  activityFeed = [],
  connectPresence = [],
  activeEventStats = { title: "", ticketsSold: 0, attendance: 0, revenue: 0 },
  topWaiters = [],
}: ClubDashboardViewProps) {
  const router = useRouter();
  const [isPendingTransition, startTransition] = useTransition();

  // Modals management
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMenuManagerOpen, setIsMenuManagerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);

  // Edit club form state
  const [name, setName] = useState(club.name || "");
  const [city, setCity] = useState(club.city || "");
  const [description, setDescription] = useState(club.description || "");
  const [bannerImage, setBannerImage] = useState(club.banner_image || "");
  const [logo, setLogo] = useState(club.logo || "");
  const [address, setAddress] = useState(club.address || "");
  const [instagram, setInstagram] = useState(club.instagram || "");
  const [rating, setRating] = useState(club.rating || 5.0);
  const [active, setActive] = useState(club.active ?? true);
  const [coverPrice, setCoverPrice] = useState(club.cover_price || 0.00);
  const [capacity, setCapacity] = useState(club.capacity || 500);

  // New onboarding & modules states
  const [clubType, setClubType] = useState((club as any).club_type || "Discoteca");
  const [whatsapp, setWhatsapp] = useState((club as any).whatsapp || "");
  const [facebook, setFacebook] = useState((club as any).facebook || "");
  const [tiktok, setTiktok] = useState((club as any).tiktok || "");
  const [website, setWebsite] = useState((club as any).website || "");
  const [priceRange, setPriceRange] = useState((club as any).price_range || "$$");
  const [paymentMethods, setPaymentMethods] = useState<string[]>((club as any).payment_methods || ["Efectivo", "Tarjeta"]);
  const [latitude, setLatitude] = useState<number | null>((club as any).latitude || null);
  const [longitude, setLongitude] = useState<number | null>((club as any).longitude || null);
  const [videoHero, setVideoHero] = useState((club as any).video_hero || "");
  const [heroImage, setHeroImage] = useState((club as any).hero_image || "");
  const [enabledModules, setEnabledModules] = useState<string[]>((club as any).enabled_modules || ["reservations", "covers", "events", "qr"]);
  const [modulesConfig, setModulesConfig] = useState<Record<string, any>>((club as any).modules_config || {});
  const [status, setStatus] = useState<'draft' | 'pending_review' | 'published' | 'paused' | 'archived'>((club as any).status || "draft");
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>((club as any).visibility || "public");
  const [planType, setPlanType] = useState<'free' | 'pro' | 'enterprise'>((club as any).plan_type || "free");
  const [brandId, setBrandId] = useState((club as any).brand_id || "");
  const [amenitiesText, setAmenitiesText] = useState(club.amenities ? club.amenities.join(", ") : "");

  // Split opening times
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");

  // Geocoding states
  const [gpsQuery, setGpsQuery] = useState("");
  const [isSearchingGps, setIsSearchingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showAdvancedGps, setShowAdvancedGps] = useState(false);

  // Tab state (for edit mode)
  const [activeEditTab, setActiveEditTab] = useState<'info' | 'multimedia' | 'operation' | 'modules' | 'config' | 'payments'>("info");
  const [successSection, setSuccessSection] = useState<string | null>(null);

  // Payment and billing settings states
  const [onlinePaymentsEnabled, setOnlinePaymentsEnabled] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState("wompi");
  const [verificationStatus, setVerificationStatus] = useState("unverified");
  const [platformCommission, setPlatformCommission] = useState(5.0);
  const [nextSettlementDate, setNextSettlementDate] = useState("");
  const [lastSettlementAt, setLastSettlementAt] = useState<string | null>(null);
  
  // Bank details
  const [bankHolderName, setBankHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountType, setBankAccountType] = useState("ahorros");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  // Billing details
  const [docType, setDocType] = useState("NIT");
  const [docNumber, setDocNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [commercialName, setCommercialName] = useState("");

  // Financial statistics
  const [revenueToday, setRevenueToday] = useState(0);
  const [revenueMonth, setRevenueMonth] = useState(0);
  const [revenueAccumulated, setRevenueAccumulated] = useState(0);
  const [commissionGenerated, setCommissionGenerated] = useState(0);
  const [pendingSettlement, setPendingSettlement] = useState(0);

  // Payout History list state
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false);
  const [isAccountFocused, setIsAccountFocused] = useState(false);
  const [isDocFocused, setIsDocFocused] = useState(false);

  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(club.banner_image || null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(club.logo || null);
  const [bannerAssetFile, setBannerAssetFile] = useState<File | null>(null);
  const [logoAssetFile, setLogoAssetFile] = useState<File | null>(null);

  const [isPending, setIsPending] = useState(false);
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const cleanupBlobUrl = (url: string | null) => {
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  const resetFormState = () => {
    setName(club.name || "");
    setCity(club.city || "");
    setDescription(club.description || "");
    setBannerImage(club.banner_image || "");
    setLogo(club.logo || "");
    setAddress(club.address || "");
    setInstagram(club.instagram || "");
    setRating(club.rating || 5.0);
    setActive(club.active ?? true);
    setCoverPrice(club.cover_price || 0.00);
    setCapacity(club.capacity || 500);

    setClubType((club as any).club_type || "Discoteca");
    setWhatsapp((club as any).whatsapp || "");
    setFacebook((club as any).facebook || "");
    setTiktok((club as any).tiktok || "");
    setWebsite((club as any).website || "");
    setPriceRange((club as any).price_range || "$$");
    setPaymentMethods((club as any).payment_methods || ["Efectivo", "Tarjeta"]);
    setLatitude((club as any).latitude || null);
    setLongitude((club as any).longitude || null);
    setVideoHero((club as any).video_hero || "");
    setHeroImage((club as any).hero_image || "");
    setEnabledModules((club as any).enabled_modules || ["reservations", "covers", "events", "qr"]);
    setModulesConfig((club as any).modules_config || {});
    setStatus((club as any).status || "draft");
    setVisibility((club as any).visibility || "public");
    setPlanType((club as any).plan_type || "free");
    setBrandId((club as any).brand_id || "");
    setAmenitiesText(club.amenities ? club.amenities.join(", ") : "");

    // Split hours
    let openVal = "";
    let closeVal = "";
    if (club.opening_hours && club.opening_hours.includes(" - ")) {
      const parts = club.opening_hours.split(" - ");
      openVal = parts[0] || "";
      closeVal = parts[1] || "";
    } else {
      openVal = club.opening_hours || "";
    }
    setOpenTime(openVal);
    setCloseTime(closeVal);

    cleanupBlobUrl(bannerPreviewUrl);
    cleanupBlobUrl(logoPreviewUrl);
    setBannerPreviewUrl(club.banner_image || null);
    setLogoPreviewUrl(club.logo || null);
    setBannerAssetFile(null);
    setLogoAssetFile(null);
    setError(null);
    setSuccess(false);

    // Reset payment settings
    setOnlinePaymentsEnabled(false);
    setPaymentGateway("wompi");
    setVerificationStatus("unverified");
    setPlatformCommission(5.0);
    setNextSettlementDate("");
    setLastSettlementAt(null);
    setBankHolderName("");
    setBankName("");
    setBankAccountType("ahorros");
    setBankAccountNumber("");
    setDocType("NIT");
    setDocNumber("");
    setBusinessName("");
    setCommercialName("");
    setRevenueToday(0);
    setRevenueMonth(0);
    setRevenueAccumulated(0);
    setCommissionGenerated(0);
    setPendingSettlement(0);
    setPayoutHistory([]);
  };

  useEffect(() => {
    resetFormState();
    if (isEditModalOpen) {
      setLoadingPaymentSettings(true);
      getClubPaymentSettings(club.id)
        .then(res => {
          if (res.settings) {
            setOnlinePaymentsEnabled(res.settings.online_payments_enabled);
            setPaymentGateway(res.settings.payment_gateway || "wompi");
            setVerificationStatus(res.settings.verification_status || "unverified");
            setPlatformCommission(Number(res.settings.platform_commission) || 5.0);
            setNextSettlementDate(res.settings.next_settlement_date || "");
            setLastSettlementAt(res.settings.last_settlement_at || null);
            setBankHolderName(res.settings.bank_holder_name || "");
            setBankName(res.settings.bank_name || "");
            setBankAccountType(res.settings.bank_account_type || "ahorros");
            setBankAccountNumber(res.settings.bank_account_number || "");
            setDocType(res.settings.doc_type || "NIT");
            setDocNumber(res.settings.doc_number || "");
            setBusinessName(res.settings.business_name || "");
            setCommercialName(res.settings.commercial_name || "");
            setRevenueToday(Number(res.settings.revenue_today) || 0);
            setRevenueMonth(Number(res.settings.revenue_month) || 0);
            setRevenueAccumulated(Number(res.settings.revenue_accumulated) || 0);
            setCommissionGenerated(Number(res.settings.commission_generated) || 0);
            setPendingSettlement(Number(res.settings.pending_settlement) || 0);
          }
        })
        .catch(err => console.error("Error fetching payment settings:", err))
        .finally(() => setLoadingPaymentSettings(false));

      getClubPayoutHistory(club.id)
        .then(res => {
          if (res.history) {
            setPayoutHistory(res.history);
          }
        })
        .catch(err => console.error("Error fetching payout history:", err));
    }
  }, [club, isEditModalOpen]);

  const handleBannerFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setError(null);
    cleanupBlobUrl(bannerPreviewUrl);
    setBannerAssetFile(file);
    setBannerPreviewUrl(URL.createObjectURL(file));
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setError(null);
    cleanupBlobUrl(logoPreviewUrl);
    setLogoAssetFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const clearBannerImage = () => {
    cleanupBlobUrl(bannerPreviewUrl);
    setBannerAssetFile(null);
    setBannerImage("");
    setBannerPreviewUrl(null);
  };

  const clearLogoImage = () => {
    cleanupBlobUrl(logoPreviewUrl);
    setLogoAssetFile(null);
    setLogo("");
    setLogoPreviewUrl(null);
  };

  const handleTypeSelect = (type: string) => {
    setClubType(type);
    
    // Autoconfigure recommended modules based on selection
    let suggested: string[] = ['reservations'];
    if (type === 'Discoteca') {
      suggested = ['reservations', 'covers', 'events', 'qr'];
    } else if (type === 'Bar') {
      suggested = ['reservations', 'orders'];
    } else if (type === 'Rooftop') {
      suggested = ['reservations', 'events'];
    } else if (type === 'Lounge') {
      suggested = ['reservations'];
    } else if (type === 'Beach Club') {
      suggested = ['reservations', 'events', 'orders'];
    }
    setEnabledModules(suggested);
  };

  const getProfileCompletion = () => {
    let score = 0;
    const missing: { label: string; action: string }[] = [];

    if (name.trim()) score += 10; else missing.push({ label: "Nombre Comercial", action: "Configura el nombre de tu marca." });
    if (logoPreviewUrl || logo) score += 10; else missing.push({ label: "Logo del local", action: "Sube un logotipo cuadrado de alta definición." });
    if (bannerPreviewUrl || bannerImage) score += 15; else missing.push({ label: "Banner del local", action: "Agrega una foto panorámica para el catálogo." });
    if (address.trim()) score += 15; else missing.push({ label: "Dirección física", action: "Escribe la calle y local exacto para tus clientes." });
    if (openTime.trim() || closeTime.trim()) score += 10; else missing.push({ label: "Horarios de operación", action: "Define la hora de apertura y cierre de las puertas." });
    if (description.trim()) score += 10; else missing.push({ label: "Descripción del ambiente", action: "Explica a tus clientes qué tipo de música y vibra ofreces." });
    if (instagram.trim() || whatsapp.trim() || facebook.trim() || tiktok.trim() || website.trim()) score += 10; else missing.push({ label: "Redes sociales", action: "Sube al menos un enlace para que te contacten." });
    if (heroImage.trim() || videoHero.trim() || bannerPreviewUrl) score += 20; else missing.push({ label: "Media Hero de fondo", action: "Sube un video de fondo u otra imagen de portada (+20%)." });

    return { score, missing };
  };

  const handleSearchAddress = async () => {
    if (!gpsQuery.trim()) return;
    setIsSearchingGps(true);
    setGpsError(null);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(gpsQuery)}&limit=1`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Plataforma-Hangover'
        }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setLatitude(lat);
        setLongitude(lon);
        setSuccessSection("gps");
        setTimeout(() => setSuccessSection(null), 2000);
      } else {
        setGpsError("No se encontraron coordenadas para esta dirección. Intenta manualmente en la sección avanzada.");
      }
    } catch (err) {
      console.error(err);
      setGpsError("Error al consultar el servicio de geolocalización. Intenta manualmente.");
    } finally {
      setIsSearchingGps(false);
    }
  };

  const handleSaveSection = async (section: 'info' | 'multimedia' | 'operation' | 'modules' | 'config' | 'payments') => {
    setError(null);
    setSuccessSection(null);
    setIsUploadingAssets(true);

    try {
      let payload: any = {};
      
      if (section === 'info') {
        if (!name.trim()) throw new Error("El nombre comercial es obligatorio.");
        if (!city.trim()) throw new Error("La ciudad es obligatoria.");
        payload = {
          name: name.trim(),
          club_type: clubType,
          city: city.trim(),
          address: address.trim() || null,
          whatsapp: whatsapp.trim() || null,
          instagram: instagram.trim() || null,
          facebook: facebook.trim() || null,
          tiktok: tiktok.trim() || null,
          website: website.trim() || null,
          description: description.trim() || null,
          banner_image: bannerImage || null,
          logo: logo || null,
          opening_hours: openTime && closeTime ? `${openTime} - ${closeTime}` : openTime || closeTime || null,
          rating,
          active,
          cover_price: coverPrice,
          capacity,
          amenities: amenitiesText ? amenitiesText.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          video_hero: videoHero || null,
          hero_image: heroImage || null,
          enabled_modules: enabledModules,
          modules_config: modulesConfig,
          status,
          visibility,
          plan_type: planType,
          brand_id: brandId || null
        };
      } else if (section === 'multimedia') {
        const uploadedBannerUrl = bannerAssetFile ? await uploadClubAsset(bannerAssetFile, "banners") : bannerImage || null;
        const uploadedLogoUrl = logoAssetFile ? await uploadClubAsset(logoAssetFile, "logos") : logo || null;
        payload = {
          name,
          club_type: clubType,
          city,
          address: address || null,
          whatsapp: whatsapp || null,
          instagram: instagram || null,
          facebook: facebook || null,
          tiktok: tiktok || null,
          website: website || null,
          description: description || null,
          banner_image: uploadedBannerUrl || null,
          logo: uploadedLogoUrl || null,
          opening_hours: openTime && closeTime ? `${openTime} - ${closeTime}` : openTime || closeTime || null,
          rating,
          active,
          cover_price: coverPrice,
          capacity,
          amenities: amenitiesText ? amenitiesText.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          video_hero: videoHero || null,
          hero_image: heroImage || null,
          enabled_modules: enabledModules,
          modules_config: modulesConfig,
          status,
          visibility,
          plan_type: planType,
          brand_id: brandId || null
        };
      } else if (section === 'operation') {
        payload = {
          name,
          club_type: clubType,
          city,
          address: address || null,
          whatsapp: whatsapp || null,
          instagram: instagram || null,
          facebook: facebook || null,
          tiktok: tiktok || null,
          website: website || null,
          description: description || null,
          banner_image: bannerImage || null,
          logo: logo || null,
          opening_hours: openTime && closeTime ? `${openTime} - ${closeTime}` : openTime || closeTime || null,
          rating,
          active,
          cover_price: Number(coverPrice) || 0,
          capacity: Number(capacity) || 500,
          price_range: priceRange,
          payment_methods: paymentMethods,
          latitude: latitude !== null ? Number(latitude) : null,
          longitude: longitude !== null ? Number(longitude) : null,
          amenities: amenitiesText ? amenitiesText.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          video_hero: videoHero || null,
          hero_image: heroImage || null,
          enabled_modules: enabledModules,
          modules_config: modulesConfig,
          status,
          visibility,
          plan_type: planType,
          brand_id: brandId || null
        };
      } else if (section === 'modules') {
        payload = {
          name,
          club_type: clubType,
          city,
          address: address || null,
          whatsapp: whatsapp || null,
          instagram: instagram || null,
          facebook: facebook || null,
          tiktok: tiktok || null,
          website: website || null,
          description: description || null,
          banner_image: bannerImage || null,
          logo: logo || null,
          opening_hours: openTime && closeTime ? `${openTime} - ${closeTime}` : openTime || closeTime || null,
          rating,
          active,
          cover_price: coverPrice,
          capacity,
          amenities: amenitiesText ? amenitiesText.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          video_hero: videoHero || null,
          hero_image: heroImage || null,
          enabled_modules: enabledModules,
          modules_config: modulesConfig,
          status,
          visibility,
          plan_type: planType,
          brand_id: brandId || null
        };
      } else if (section === 'config') {
        payload = {
          name,
          club_type: clubType,
          city,
          address: address || null,
          whatsapp: whatsapp || null,
          instagram: instagram || null,
          facebook: facebook || null,
          tiktok: tiktok || null,
          website: website || null,
          description: description || null,
          banner_image: bannerImage || null,
          logo: logo || null,
          opening_hours: openTime && closeTime ? `${openTime} - ${closeTime}` : openTime || closeTime || null,
          rating: Number(rating) || 5.0,
          active: status === 'published' || status === 'paused',
          cover_price: coverPrice,
          capacity,
          amenities: amenitiesText ? amenitiesText.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          video_hero: videoHero || null,
          hero_image: heroImage || null,
          enabled_modules: enabledModules,
          modules_config: modulesConfig,
          status,
          visibility,
          plan_type: planType,
          brand_id: brandId || null
        };
      } else if (section === 'payments') {
        if (onlinePaymentsEnabled && verificationStatus !== 'verified') {
          throw new Error("No puedes activar pagos online si tu cuenta no está en estado verificado.");
        }

        const result = await updateClubPaymentSettings(club.id, {
          online_payments_enabled: onlinePaymentsEnabled,
          payment_gateway: paymentGateway,
          bank_holder_name: bankHolderName || null,
          bank_name: bankName || null,
          bank_account_type: bankAccountType || "ahorros",
          bank_account_number: bankAccountNumber || null,
          doc_type: docType || null,
          doc_number: docNumber || null,
          business_name: businessName || null,
          commercial_name: commercialName || null,
        });

        setIsUploadingAssets(false);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccessSection(section);
          router.refresh();
          setTimeout(() => setSuccessSection(null), 2500);
        }
        return;
      }

      const result = await updateClub(club.id, payload);
      setIsUploadingAssets(false);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccessSection(section);
        startTransition(() => {
          router.refresh();
        });
        setTimeout(() => setSuccessSection(null), 2500);
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al guardar esta sección.");
      setIsUploadingAssets(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setError(null);
    setIsPending(true);

    const result = await deleteClub(club.id);
    if (result.error) {
      setError(result.error);
      alert(result.error);
    } else {
      router.push("/dashboard/provider/clubs");
      router.refresh();
    }
    setIsDeleteConfirmOpen(false);
    setIsPending(false);
  };

  // Real-time Supabase subscription
  useEffect(() => {
    const supabase = createClient();
    const realtimeChannel = supabase
      .channel(`club-realtime-view-${club.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "club_tables", filter: `club_id=eq.${club.id}` },
        () => startTransition(() => router.refresh())
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_sessions", filter: `club_id=eq.${club.id}` },
        () => startTransition(() => router.refresh())
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_orders" },
        () => startTransition(() => router.refresh())
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assistance_requests", filter: `club_id=eq.${club.id}` },
        () => startTransition(() => router.refresh())
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connect_presence", filter: `club_id=eq.${club.id}` },
        () => startTransition(() => router.refresh())
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `club_id=eq.${club.id}` },
        () => startTransition(() => router.refresh())
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admission_logs" },
        () => startTransition(() => router.refresh())
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [club.id, router]);

  // Order status transition handler
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await updateOrderStatus(orderId, nextStatus);
      if (res.error) {
        alert(res.error);
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Assistance resolving handler
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  const handleAttendRequest = async (requestId: string) => {
    setResolvingRequestId(requestId);
    try {
      const res = await attendAssistanceRequest(requestId);
      if (res.error) {
        alert(res.error);
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingRequestId(null);
    }
  };

  // Relative time helper
  const formatRelativeTime = (date: string | Date): string => {
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - parsedDate.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    
    if (diffMins === 0) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return parsedDate.toLocaleDateString("es-CO", { hour: "numeric", minute: "numeric" });
  };

  const getOccupancyState = (pct: number) => {
    if (pct < 35) return { label: "Baja Ocupación", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (pct < 70) return { label: "Media Ocupación", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" };
    if (pct < 95) return { label: "Alta Ocupación", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    return { label: "Local Completo", color: "text-red-400 bg-red-500/10 border-red-500/20 animate-pulse" };
  };

  const isFormLocked = isPending || isUploadingAssets || success;
  const capacityLimit = club.capacity || 500;
  const occupancyPct = Math.min(100, Math.round((stats.peopleInside / capacityLimit) * 100));
  const occupancyState = getOccupancyState(occupancyPct);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/provider/clubs"
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Mis Discotecas</span>
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-zinc-950/40 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center gap-4 min-w-0">
            {club.logo ? (
              <img
                src={club.logo}
                alt={club.name}
                className="w-16 h-16 rounded-2xl object-cover border border-white/10 p-0.5 bg-black"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-600 shrink-0">
                <Building2 className="w-8 h-8" />
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-black text-white font-outfit truncate leading-tight">
                  {club.name}
                </h2>
                {isPendingTransition && <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary-400" /> {club.city}
                </span>
                {club.address && (
                  <>
                    <span>•</span>
                    <span className="truncate">{club.address}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
            {club.active ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 shadow-sm">
                <Eye className="w-3.5 h-3.5" /> Activa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-zinc-800 border border-white/5 text-xs font-bold text-zinc-400 shadow-sm">
                <EyeOff className="w-3.5 h-3.5" /> Inactiva
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-extrabold text-amber-400 font-outfit shadow-sm">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
              {Number(club.rating || 0).toFixed(1)}
            </span>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer md:ml-2"
            >
              <Edit2 className="w-3.5 h-3.5" /> Editar Local
            </button>
          </div>
        </div>
      </div>

      {/* 2. OPERACIÓN EN VIVO (AHORA) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pl-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Operación en Vivo (AHORA)</h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase">Datos en Tiempo Real</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-card p-5 border-white/5 bg-[#09090f]/60 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Personas Dentro</span>
            <div className="mt-2.5">
              <span className="text-3xl font-black text-white font-outfit block">{stats.peopleInside}</span>
              <span className="text-[9px] text-zinc-500 mt-1 block">Capacidad: {capacityLimit}</span>
            </div>
          </div>

          <div className="glass-card p-5 border-white/5 bg-[#09090f]/60 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Mesas Ocupadas</span>
            <div className="mt-2.5">
              <span className="text-3xl font-black text-primary-400 font-outfit block">{stats.tablesOccupied}</span>
              <span className="text-[9px] text-zinc-500 mt-1 block">En atención</span>
            </div>
          </div>

          <div className="glass-card p-5 border-white/5 bg-[#09090f]/60 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Mesas Disponibles</span>
            <div className="mt-2.5">
              <span className="text-3xl font-black text-emerald-400 font-outfit block">{stats.tablesFree}</span>
              <span className="text-[9px] text-zinc-500 mt-1 block">Libres</span>
            </div>
          </div>

          <div className="glass-card p-5 border-white/5 bg-[#09090f]/60 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Pedidos Activos</span>
            <div className="mt-2.5">
              <span className="text-3xl font-black text-amber-400 font-outfit block">{stats.ordersActive}</span>
              <span className="text-[9px] text-zinc-500 mt-1 block">En cocina / barra</span>
            </div>
          </div>

          <div className="glass-card p-5 border-white/5 bg-[#09090f]/60 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Connect Connect</span>
            <div className="mt-2.5">
              <span className="text-3xl font-black text-cyan-400 font-outfit block">{stats.connectPresenceCount}</span>
              <span className="text-[9px] text-zinc-500 mt-1 block">Usuarios visibles</span>
            </div>
          </div>

          <div className="glass-card p-5 border-white/5 bg-[#09090f]/60 flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Evento Activo</span>
            <div className="mt-2.5">
              <span className="text-xs font-bold text-purple-400 font-outfit truncate block" title={stats.activeEventTitle || "Ninguno"}>
                {stats.activeEventTitle || "Ninguno hoy"}
              </span>
              <span className="text-[9px] text-zinc-500 mt-1.5 block">Programación nocturna</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VENTAS DE HOY (HOY) */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">Ventas y Covers de Hoy (HOY)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-card p-5 border-white/5 bg-[#09090f]/60 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Recaudación Total</span>
            <div className="mt-2.5">
              <span className="text-xl font-black text-emerald-400 font-outfit block">
                ${stats.revenueToday.toLocaleString("es-CO")}
              </span>
              <span className="text-[9px] text-zinc-500 mt-1 block">Pedidos + Covers</span>
            </div>
          </div>

          <div className="glass-card p-5 border-white/5 bg-[#09090f]/60 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Covers Vendidos</span>
            <div className="mt-2.5">
              <span className="text-xl font-black text-white font-outfit block">{stats.coversToday}</span>
              <span className="text-[9px] text-zinc-500 mt-1 block">Hoy</span>
            </div>
          </div>

          <div className="glass-card p-5 border-white/5 bg-[#09090f]/60 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Reservas de Mesa</span>
            <div className="mt-2.5">
              <span className="text-xl font-black text-white font-outfit block">{stats.tableReservationsToday}</span>
              <span className="text-[9px] text-zinc-500 mt-1 block">Reservas VIP hoy</span>
            </div>
          </div>

          <div className="glass-card p-5 border-white/5 bg-[#09090f]/60 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Botellas Vendidas</span>
            <div className="mt-2.5">
              <span className="text-xl font-black text-purple-400 font-outfit block">{stats.bottlesSoldToday}</span>
              <span className="text-[9px] text-zinc-500 mt-1 block">Licores destilados</span>
            </div>
          </div>

          <div className="glass-card p-5 border-white/5 bg-[#09090f]/60 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Ingresos por Eventos</span>
            <div className="mt-2.5">
              <span className="text-xl font-black text-emerald-400 font-outfit block">
                ${stats.eventRevenueToday.toLocaleString("es-CO")}
              </span>
              <span className="text-[9px] text-zinc-500 mt-1 block">Entradas / Covers de eventos</span>
            </div>
          </div>

          {/* Ticket Promedio */}
          <div className="glass-card p-5 border-white/5 bg-[#09090f]/60 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Ticket Promedio</span>
              <span className="text-xl font-black text-cyan-400 font-outfit block">
                ${stats.ticketPromedioToday.toLocaleString("es-CO")}
              </span>
            </div>
            <span className="text-[9px] font-bold mt-2.5 block">
              {stats.ticketPromedioDiffPct !== null ? (
                <span className={stats.ticketPromedioDiffPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {stats.ticketPromedioDiffPct >= 0 ? "▲ +" : "▼ "}{stats.ticketPromedioDiffPct.toFixed(1)}% vs ayer
                </span>
              ) : (
                <span className="text-zinc-500">Sin historial</span>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* 4. OCUPACIÓN DEL LOCAL */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">Ocupación del Local</h3>
        <div className="glass-card p-6 bg-[#09090f]/60 border-white/5 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-zinc-300">Ocupación en tiempo real</span>
              <span className="text-zinc-500 ml-1.5">({stats.peopleInside} personas adentro)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${occupancyState.color}`}>
                {occupancyState.label}
              </span>
              <span className="font-black text-white font-outfit text-sm">{occupancyPct}%</span>
            </div>
          </div>
          
          <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                occupancyPct < 35
                  ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : occupancyPct < 70
                  ? "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  : occupancyPct < 95
                  ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse"
              }`}
              style={{ width: `${occupancyPct}%` }}
            />
          </div>

          {/* Decoupled Future Projections Block */}
          <div className="pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">📈 Ocupación Estimada</span>
              <span className="text-xs font-bold text-zinc-400">Fase 2 IA: --%</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">📈 Ventas Estimadas</span>
              <span className="text-xs font-bold text-zinc-400">Fase 2 IA: $--</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">📈 Covers Esperados</span>
              <span className="text-xs font-bold text-zinc-400">Fase 2 IA: --</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">📈 Reservas Proyectadas</span>
              <span className="text-xs font-bold text-zinc-400">Fase 2 IA: --</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EVENTO ACTIVO */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">Evento Activo de Hoy</h3>
        {activeEventStats.title ? (
          <div className="glass-card p-6 bg-[#09090f]/60 border border-purple-500/10 hover:border-purple-500/20 transition-all rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-outfit">
                  Evento en Progreso
                </span>
                <h4 className="text-lg font-bold text-white font-outfit mt-1">{activeEventStats.title}</h4>
              </div>

              <div className="grid grid-cols-3 gap-6 shrink-0 w-full md:w-auto">
                <div className="text-left">
                  <span className="text-[10px] text-zinc-500 uppercase font-black block">Ventas</span>
                  <span className="text-sm font-bold text-white">{activeEventStats.ticketsSold} covers</span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-zinc-500 uppercase font-black block">Asistencia</span>
                  <span className="text-sm font-bold text-white">{activeEventStats.attendance} personas</span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-zinc-500 uppercase font-black block">Ingresos</span>
                  <span className="text-sm font-bold text-emerald-400">${activeEventStats.revenue.toLocaleString("es-CO")}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center border border-dashed border-white/5 rounded-xl bg-black/20">
            <Ticket className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-medium">No existen eventos programados para hoy.</p>
          </div>
        )}
      </section>

      {/* 6. PEDIDOS EN VIVO */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">Pedidos en Vivo (Comandas)</h3>
        {activeOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map((order) => (
              <div key={order.id} className="glass-card p-5 bg-[#09090f]/60 border-white/5 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div>
                    <span className="text-xs font-bold text-white font-outfit">Mesa {order.tableNumber}</span>
                    <span className="text-[10px] text-zinc-500 block">{formatRelativeTime(order.created_at)}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    order.status === "pending"
                      ? "bg-red-500/10 border border-red-500/20 text-red-400"
                      : order.status === "preparing"
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  }`}>
                    {order.status === "pending" ? "Pendiente" : order.status === "preparing" ? "Preparando" : "Entregado"}
                  </span>
                </div>

                <div className="space-y-1.5 flex-grow">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 font-medium">{item.name}</span>
                      <span className="text-zinc-500 font-bold">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Total Pedido</span>
                    <span className="text-xs font-bold text-emerald-400">${order.total.toLocaleString("es-CO")}</span>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, "preparing")}
                        disabled={updatingOrderId !== null}
                        className="bg-primary-600 hover:bg-primary-500 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Preparar
                      </button>
                    )}
                    {order.status === "preparing" && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, "delivered_by_staff")}
                        disabled={updatingOrderId !== null}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Entregar
                      </button>
                    )}
                    {order.status === "delivered_by_staff" && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, "confirmed")}
                        disabled={updatingOrderId !== null}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Confirmar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center border border-dashed border-white/5 rounded-xl bg-black/20">
            <ShoppingBag className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-medium">No hay pedidos activos actualmente.</p>
          </div>
        )}
      </section>

      {/* 7. ACTIVIDAD RECIENTE */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">⚡ Actividad Reciente</h3>
        {activityFeed.length > 0 ? (
          <div className="glass-card p-6 bg-[#09090f]/60 border-white/5 space-y-4 max-h-[350px] overflow-y-auto scrollbar-none">
            <div className="relative pl-4 border-l border-white/5 space-y-6">
              {activityFeed.map((item) => (
                <div key={item.id} className="relative space-y-1">
                  {/* Bullet Indicator */}
                  <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#09090f] ${
                    item.type === "order"
                      ? "bg-red-500"
                      : item.type === "delivery"
                      ? "bg-emerald-500"
                      : item.type === "admission_approved"
                      ? "bg-cyan-500"
                      : item.type === "admission_rejected"
                      ? "bg-red-600"
                      : item.type === "assistance"
                      ? "bg-amber-500"
                      : "bg-purple-500"
                  }`} />
                  <div className="flex justify-between items-start text-xs">
                    <p className="text-zinc-300 font-medium leading-relaxed">{item.text}</p>
                    <span className="text-[10px] text-zinc-500 font-semibold shrink-0 ml-4">
                      {formatRelativeTime(item.time)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center border border-dashed border-white/5 rounded-xl bg-black/20">
            <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-medium">Aún no hay actividad registrada.</p>
          </div>
        )}
      </section>

      {/* 8. TOP MESEROS */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">🏆 Top Meseros</h3>
        <div className="glass-card p-6 bg-[#09090f]/60 border-white/5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topWaiters.map((waiter, index) => (
              <div key={waiter.name} className="bg-black/30 p-4 rounded-xl border border-white/5 relative overflow-hidden flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  {index === 0 ? <Trophy className="w-5 h-5 fill-amber-500" /> : <span className="font-bold font-outfit text-sm">#{index + 1}</span>}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h4 className="text-xs font-black text-white">{waiter.name}</h4>
                  <p className="text-xs font-bold text-emerald-400">${waiter.salesGenerated.toLocaleString("es-CO")}</p>
                  <div className="flex gap-2 text-[10px] text-zinc-500 font-medium">
                    <span>{waiter.ordersAttended} ped.</span>
                    <span>•</span>
                    <span>Avg: ${waiter.ticketPromedio.toLocaleString("es-CO")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. ACTIVIDAD HANGOVER CONNECT */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">Actividad Hangover Connect</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6 bg-[#09090f]/60 border-white/5 space-y-4">
            <div>
              <h4 className="font-bold text-white text-sm font-outfit">Presencia en Vivo</h4>
              <p className="text-xs text-zinc-500">Usuarios online visibles en el marketplace</p>
            </div>
            
            {connectPresence.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {connectPresence.map((cp) => (
                  <div key={cp.id} className="flex items-center gap-2 bg-black/40 border border-white/5 px-3 py-2 rounded-2xl">
                    {cp.profiles?.avatar_url ? (
                      <img src={cp.profiles.avatar_url} alt={cp.profiles.full_name || ""} className="w-6 h-6 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        {cp.profiles?.full_name ? cp.profiles.full_name[0].toUpperCase() : "U"}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-white">{cp.profiles?.full_name || "Usuario"}</p>
                      <p className="text-[9px] text-emerald-400 uppercase font-semibold">{cp.status === 'available' ? 'Disponible' : cp.status === 'do_not_disturb' ? 'No molestar' : 'Observando'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-white/5 rounded-xl bg-black/20">
                <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-medium">Aún no hay conexiones sociales activas.</p>
              </div>
            )}
          </div>

          <div className="glass-card p-6 bg-[#09090f]/60 border-white/5 space-y-5">
            <div>
              <h4 className="font-bold text-white text-sm font-outfit">Multimedia de Local</h4>
              <p className="text-xs text-zinc-500">Historias y Galería pública</p>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-black block">Historias Activas</span>
                <span className="text-lg font-black text-primary-400 mt-1 block font-outfit">{multimediaStats.activeStories}</span>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-black block">Galería</span>
                <span className="text-lg font-black text-cyan-400 mt-1 block font-outfit">{multimediaStats.galleryItems}</span>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-black block">Videos</span>
                <span className="text-lg font-black text-purple-400 mt-1 block font-outfit">{multimediaStats.totalVideos}</span>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-black block">Destacados ★</span>
                <span className="text-lg font-black text-emerald-400 mt-1 block font-outfit">{multimediaStats.featuredItems}</span>
              </div>
            </div>
            <button
              onClick={() => setIsMediaManagerOpen(true)}
              className="w-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl py-2 px-4 text-xs font-bold border border-white/5 transition-all text-center cursor-pointer min-h-[38px] font-outfit"
            >
              Administrar Multimedia
            </button>
          </div>
        </div>
      </section>

      {/* 10. ALERTAS OPERATIVAS */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">Alertas Operativas</h3>
        <div className="glass-card p-6 bg-[#09090f]/60 border-white/5 space-y-4">
          {stats.pendingBookingsCount > 0 || stats.delayedOrdersCount > 0 || stats.failedQrScansCount > 0 || stats.pendingAssistanceCount > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.pendingBookingsCount > 0 && (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-300">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase font-outfit">Reservas Pendientes</h4>
                    <p className="text-[11px] mt-0.5 font-medium">Hay {stats.pendingBookingsCount} reservas VIP esperando confirmación de mesa.</p>
                  </div>
                </div>
              )}
              {stats.delayedOrdersCount > 0 && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-300">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase font-outfit">Pedidos Retrasados</h4>
                    <p className="text-[11px] mt-0.5 font-medium">Hay {stats.delayedOrdersCount} comandas en preparación por más de 15 minutos.</p>
                  </div>
                </div>
              )}
              {stats.failedQrScansCount > 0 && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-300">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase font-outfit">Validaciones QR Fallidas</h4>
                    <p className="text-[11px] mt-0.5 font-medium">{stats.failedQrScansCount} intentos de accesos QR rechazados en puerta hoy.</p>
                  </div>
                </div>
              )}
              {stats.pendingAssistanceCount > 0 && (
                <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-300">
                  <Bell className="w-5 h-5 text-blue-400 shrink-0 animate-bounce" />
                  <div>
                    <h4 className="text-xs font-black uppercase font-outfit">Llamados a Mesero</h4>
                    <p className="text-[11px] mt-0.5 font-medium">{stats.pendingAssistanceCount} mesas solicitando asistencia o la cuenta en sala.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider font-outfit">Operación Normal</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">No hay alertas activas, retrasos en pedidos, o llamados de mesero pendientes.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 11. MIS DISCOTECAS & QUICK ACTIONS */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">Accesos Rápidos</h3>
        <div className="glass-card p-6 bg-[#09090f]/60 border-white/5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs font-bold border border-white/5 transition-all text-center cursor-pointer font-outfit"
            >
              📝 Editar Perfil
            </button>
            <button
              onClick={() => setIsMediaManagerOpen(true)}
              className="bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs font-bold border border-white/5 transition-all text-center cursor-pointer font-outfit"
            >
              📸 Multimedia
            </button>
            <button
              onClick={() => setIsMenuManagerOpen(true)}
              className="bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs font-bold border border-white/5 transition-all text-center cursor-pointer font-outfit"
            >
              🍷 Editar Carta
            </button>
            <button
              onClick={() => router.push("/dashboard/provider/tables")}
              className="bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs font-bold border border-white/5 transition-all text-center cursor-pointer font-outfit"
            >
              🪑 Control Mesas
            </button>
            <button
              onClick={() => router.push("/dashboard/provider/orders")}
              className="bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs font-bold border border-white/5 transition-all text-center cursor-pointer font-outfit"
            >
              🍹 Pedidos en Vivo
            </button>
            <button
              onClick={() => router.push("/dashboard/provider/scanner")}
              className="bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs font-bold border border-white/5 transition-all text-center cursor-pointer font-outfit col-span-2 lg:col-span-1"
            >
              🎟️ Validar QR
            </button>
          </div>
        </div>
      </section>

      {/* ==========================================
          REUSE EDIT MODALS
          ========================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="glass-card w-full max-w-6xl my-8 overflow-hidden relative border-white/10 bg-zinc-950 shadow-[0_0_80px_rgba(217,70,239,0.15)] flex flex-col md:flex-row h-full max-h-[90vh] rounded-[28px]">
            
            {/* WIZARD OR EDIT HEADER & CONTENT WRAPPER */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              
              {/* MODAL HEADER */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/40">
                <div>
                  <h3 className="text-xl font-black text-white font-outfit tracking-tight flex items-center gap-2">
                    Editar {name || 'Establecimiento'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Modifica secciones independientes rápidamente sin perder datos.
                  </p>
                </div>
                
                <button
                  onClick={() => !isFormLocked && setIsEditModalOpen(false)}
                  disabled={isFormLocked}
                  className="w-10 h-10 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* TABS SELECTOR */}
              <div className="px-6 border-b border-white/5 bg-zinc-950 flex items-center shrink-0 overflow-x-auto scrollbar-none gap-2 py-2">
                {[
                  { id: 'info', label: 'Información', icon: Building2 },
                  { id: 'multimedia', label: 'Multimedia', icon: ImagePlus },
                  { id: 'operation', label: 'Operación', icon: Clock },
                  { id: 'modules', label: 'Módulos', icon: Layers },
                  { id: 'payments', label: 'Pagos y Cobros', icon: CreditCard },
                  { id: 'config', label: 'Configuración', icon: Settings },
                ].map((tab) => {
                  const isActive = activeEditTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveEditTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-primary-600/10 border border-primary-500/20 text-primary-400 shadow-sm'
                          : 'border border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <tab.icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* CORE FORM WRAPPER */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-none min-h-0">
                {error && (
                  <div className="flex items-center gap-2.5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                    <span className="font-semibold">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                    <span className="font-bold">¡El local se ha configurado exitosamente!</span>
                  </div>
                )}

                {/* MODULAR TABBED EDITOR */}
                <div>
                  {activeEditTab === 'info' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-zinc-300 ml-1">Nombre Comercial *</label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                          className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-base text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-zinc-300 ml-1">Tipo de Local *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {['Discoteca', 'Bar', 'Rooftop', 'Lounge', 'Beach Club'].map((type) => {
                            const isSelected = clubType === type
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => handleTypeSelect(type)}
                                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer touch-target ${
                                  isSelected 
                                    ? 'bg-primary-600/10 border-primary-500 text-primary-400'
                                    : 'bg-black/40 border-white/5 text-zinc-400 hover:text-white'
                                }`}
                              >
                                <Building2 className="w-4 h-4 shrink-0" />
                                <span className="text-[10px] font-bold">{type}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">Ciudad *</label>
                          <input
                            type="text"
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            required
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">Dirección Física *</label>
                          <input
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            required
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">WhatsApp de Reservas</label>
                          <input
                            type="text"
                            value={whatsapp}
                            onChange={e => setWhatsapp(e.target.value)}
                            placeholder="Ej. +57312..."
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">Instagram (@usuario)</label>
                          <input
                            type="text"
                            value={instagram}
                            onChange={e => setInstagram(e.target.value)}
                            placeholder="Ej. @pacha"
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">Sitio Web</label>
                          <input
                            type="text"
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                            placeholder="Ej. https://..."
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-zinc-300 ml-1">Facebook</label>
                        <input
                          type="text"
                          value={facebook}
                          onChange={e => setFacebook(e.target.value)}
                          placeholder="Ej. https://facebook.com/..."
                          className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-zinc-300 ml-1">TikTok</label>
                        <input
                          type="text"
                          value={tiktok}
                          onChange={e => setTiktok(e.target.value)}
                          placeholder="Ej. https://tiktok.com/@..."
                          className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-zinc-300 ml-1">Descripción del Ambiente</label>
                        <textarea
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none min-h-[90px] resize-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveSection('info')}
                        disabled={isUploadingAssets}
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider transition-all mt-4 cursor-pointer touch-target flex items-center justify-center gap-1.5"
                      >
                        {isUploadingAssets ? <Loader2 className="w-4 h-4 animate-spin" /> : successSection === 'info' ? <Check className="w-4 h-4 text-emerald-300 animate-bounce" /> : null}
                        <span>{successSection === 'info' ? "¡Información Guardada!" : "Guardar Información"}</span>
                      </button>
                    </div>
                  )}

                  {activeEditTab === 'multimedia' && (
                    <div className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-3">
                          <p className="text-xs font-black uppercase text-zinc-300">Banner Principal</p>
                          <div className="relative overflow-hidden rounded-xl border border-white/5 bg-zinc-950 h-32">
                            {bannerPreviewUrl ? (
                              <img src={bannerPreviewUrl} alt="Banner" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-zinc-650"><ImagePlus className="w-7 h-7" /></div>
                            )}
                          </div>
                          <label className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white cursor-pointer hover:bg-white/10 transition-colors touch-target">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Subir</span>
                            <input type="file" accept="image/*" onChange={handleBannerFileChange} className="hidden" />
                          </label>
                        </div>

                        <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-3">
                          <p className="text-xs font-black uppercase text-zinc-300">Logotipo</p>
                          <div className="flex h-32 items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-zinc-950">
                            {logoPreviewUrl ? (
                              <img src={logoPreviewUrl} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-zinc-650"><ImagePlus className="w-7 h-7" /></div>
                            )}
                          </div>
                          <label className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white cursor-pointer hover:bg-white/10 transition-colors touch-target">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Subir</span>
                            <input type="file" accept="image/*" onChange={handleLogoFileChange} className="hidden" />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-4">
                        <p className="text-xs font-black uppercase text-zinc-300">Visual Ports (Hero Media)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400">Imagen Portada Hero (URL)</label>
                            <input
                              type="text"
                              value={heroImage}
                              onChange={e => setHeroImage(e.target.value)}
                              className="w-full bg-black/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400">Video Portada Hero (URL)</label>
                            <input
                              type="text"
                              value={videoHero}
                              onChange={e => setVideoHero(e.target.value)}
                              className="w-full bg-black/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveSection('multimedia')}
                        disabled={isUploadingAssets}
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider transition-all mt-4 cursor-pointer touch-target flex items-center justify-center gap-1.5"
                      >
                        {isUploadingAssets ? <Loader2 className="w-4 h-4 animate-spin" /> : successSection === 'multimedia' ? <Check className="w-4 h-4 text-emerald-300 animate-bounce" /> : null}
                        <span>{successSection === 'multimedia' ? "¡Multimedia Guardada!" : "Guardar Multimedia"}</span>
                      </button>
                    </div>
                  )}

                  {activeEditTab === 'operation' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">Aforo Máximo</label>
                          <input
                            type="number"
                            value={capacity}
                            onChange={e => setCapacity(parseInt(e.target.value, 10) || 500)}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">Cover Base ($ COP)</label>
                          <input
                            type="number"
                            value={coverPrice}
                            onChange={e => setCoverPrice(parseFloat(e.target.value) || 0)}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">Precios</label>
                          <select
                            value={priceRange}
                            onChange={e => setPriceRange(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none h-12"
                          >
                            <option value="$">Económico ($)</option>
                            <option value="$$">Moderado ($$)</option>
                            <option value="$$$">Exclusivo ($$$)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">Horarios (Apertura / Cierre)</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={openTime}
                              onChange={e => setOpenTime(e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                            />
                            <input
                              type="text"
                              value={closeTime}
                              onChange={e => setCloseTime(e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">Métodos de Pago Aceptados</label>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {['Efectivo', 'Tarjeta Débito', 'Tarjeta Crédito', 'Nequi', 'Daviplata', 'Transferencia', 'Apple Pay', 'Google Pay'].map((method) => {
                              const isSelected = paymentMethods.includes(method)
                              return (
                                <button
                                  key={method}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setPaymentMethods(paymentMethods.filter(m => m !== method))
                                    } else {
                                      setPaymentMethods([...paymentMethods, method])
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-full border text-[11px] font-bold transition-all cursor-pointer touch-target ${
                                    isSelected
                                      ? 'bg-purple-600/10 border-purple-500 text-purple-400'
                                      : 'bg-black/40 border-white/5 text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  {method}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* GPS search */}
                      <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-3">
                        <p className="text-xs font-bold text-white font-outfit">Localización GPS Inteligente</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={gpsQuery}
                            onChange={e => setGpsQuery(e.target.value)}
                            placeholder="Busca calle y ciudad"
                            className="flex-grow bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSearchAddress}
                            className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer touch-target"
                          >
                            Buscar
                          </button>
                        </div>
                        {gpsError && <p className="text-[10px] text-red-400 font-semibold">{gpsError}</p>}
                        
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-zinc-500 uppercase font-black">Latitud</span>
                            <input
                              type="number"
                              step="0.000001"
                              value={latitude === null ? "" : latitude}
                              onChange={e => setLatitude(parseFloat(e.target.value) || null)}
                              className="w-full bg-black/60 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-zinc-500 uppercase font-black">Longitud</span>
                            <input
                              type="number"
                              step="0.000001"
                              value={longitude === null ? "" : longitude}
                              onChange={e => setLongitude(parseFloat(e.target.value) || null)}
                              className="w-full bg-black/60 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveSection('operation')}
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider transition-all mt-4 cursor-pointer touch-target flex items-center justify-center gap-1.5"
                      >
                        {successSection === 'operation' ? <Check className="w-4 h-4 text-emerald-300 animate-bounce" /> : null}
                        <span>{successSection === 'operation' ? "¡Operación Guardada!" : "Guardar Operación"}</span>
                      </button>
                    </div>
                  )}

                  {activeEditTab === 'modules' && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase text-zinc-400 border-b border-white/5 pb-1">Módulos Recomendados</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {CLUB_MODULES.filter(m => m.category === 'recommended').map((mod) => {
                            const isChecked = enabledModules.includes(mod.id)
                            return (
                              <button
                                key={mod.id}
                                type="button"
                                onClick={() => {
                                  if (isChecked) {
                                    setEnabledModules(enabledModules.filter(id => id !== mod.id))
                                  } else {
                                    setEnabledModules([...enabledModules, mod.id])
                                  }
                                }}
                                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer touch-target ${
                                  isChecked 
                                    ? 'bg-primary-600/10 border-primary-500 text-white'
                                    : 'bg-black/30 border-white/5 text-zinc-400 hover:border-white/10'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border mt-0.5 ${
                                  isChecked ? 'bg-primary-600 border-primary-400 text-white' : 'border-white/20 bg-black/40'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3" />}
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-white leading-tight">{mod.label}</p>
                                  <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">{mod.description}</p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase text-zinc-400 border-b border-white/5 pb-1">Módulos Avanzados</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {CLUB_MODULES.filter(m => m.category === 'advanced').map((mod) => {
                            const isChecked = enabledModules.includes(mod.id)
                            return (
                              <button
                                key={mod.id}
                                type="button"
                                onClick={() => {
                                  if (isChecked) {
                                    setEnabledModules(enabledModules.filter(id => id !== mod.id))
                                  } else {
                                    setEnabledModules([...enabledModules, mod.id])
                                  }
                                }}
                                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer touch-target ${
                                  isChecked 
                                    ? 'bg-primary-600/10 border-primary-500 text-white'
                                    : 'bg-black/30 border-white/5 text-zinc-400 hover:border-white/10'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border mt-0.5 ${
                                  isChecked ? 'bg-primary-600 border-primary-400 text-white' : 'border-white/20 bg-black/40'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3" />}
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-white leading-tight">{mod.label}</p>
                                  <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">{mod.description}</p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveSection('modules')}
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider transition-all mt-4 cursor-pointer touch-target flex items-center justify-center gap-1.5"
                      >
                        {successSection === 'modules' ? <Check className="w-4 h-4 text-emerald-300 animate-bounce" /> : null}
                        <span>{successSection === 'modules' ? "¡Módulos Guardados!" : "Guardar Módulos"}</span>
                      </button>
                    </div>
                  )}

                  {activeEditTab === 'payments' && (
                    <div className="space-y-6">
                      {/* 1. ESTADO DE VERIFICACIÓN BANNER */}
                      {verificationStatus !== "verified" ? (
                        <div className="p-4 rounded-2xl border bg-yellow-500/10 border-yellow-500/20 text-yellow-400 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-wider">Cuenta en Proceso de Verificación</h4>
                            <p className="text-xs text-yellow-400/80 leading-relaxed">
                              Tu establecimiento se encuentra actualmente en estado <strong className="underline uppercase">{verificationStatus === 'unverified' ? 'Sin Verificar' : verificationStatus === 'pending' ? 'Pendiente' : 'Rechazado'}</strong>. 
                              Debes completar tu información bancaria y de facturación para que soporte técnico valide tu cuenta. No podrás activar cobros online hasta que tu estado sea verificado.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-wider">Cuenta Verificada</h4>
                            <p className="text-xs text-emerald-400/80 leading-relaxed">
                              ¡Felicidades! Tu cuenta ha sido verificada con éxito. Ya puedes habilitar pagos online para procesar reservas, covers y eventos directamente en Hangover.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* GRID: CONFIGURACION DE COBROS & FACTURACION */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* CONFIGURACIÓN DE COBROS */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <CreditCard className="w-4 h-4 text-purple-400" />
                            <h3 className="text-xs font-black uppercase text-zinc-200">Configuración de Cobros</h3>
                          </div>

                          {/* Toggle Pagos Online */}
                          <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-white block">Pagos Online Activados</span>
                              <span className="text-[10px] text-zinc-400 block">Procesa reservas y covers a través de Hangover</span>
                            </div>
                            {verificationStatus !== "verified" ? (
                              <div className="flex items-center gap-1.5 text-[10px] bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg border border-white/5 font-semibold">
                                <Lock className="w-3 h-3" /> Bloqueado
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setOnlinePaymentsEnabled(!onlinePaymentsEnabled)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  onlinePaymentsEnabled ? 'bg-primary-600' : 'bg-zinc-700'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    onlinePaymentsEnabled ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Selector de Pasarela */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Pasarela de Pago Online</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'wompi', label: 'Wompi (Co)', isDefault: true },
                                { id: 'mercado_pago', label: 'Mercado Pago', isDefault: false },
                                { id: 'stripe', label: 'Stripe', isDefault: false },
                                { id: 'payu', label: 'PayU', isDefault: false },
                              ].map((gate) => {
                                const isSelected = paymentGateway === gate.id
                                return (
                                  <button
                                    key={gate.id}
                                    type="button"
                                    onClick={() => setPaymentGateway(gate.id)}
                                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                      isSelected 
                                        ? 'bg-primary-600/10 border-primary-500 text-white shadow-md' 
                                        : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                                  >
                                    <span className="text-xs font-black">{gate.label}</span>
                                    {gate.isDefault && (
                                      <span className="text-[8px] font-black uppercase bg-primary-600 text-white px-1.5 py-0.5 rounded mt-1.5 self-start">
                                        Recomendado
                                      </span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* DATOS DE FACTURACIÓN */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <Building2 className="w-4 h-4 text-purple-400" />
                            <h3 className="text-xs font-black uppercase text-zinc-200">Datos de Facturación (Legal)</h3>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Tipo Doc</label>
                              <select
                                value={docType}
                                onChange={e => setDocType(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none h-10 animate-none"
                              >
                                <option value="NIT">NIT</option>
                                <option value="RUT">RUT</option>
                                <option value="CC">Cédula</option>
                              </select>
                            </div>
                            <div className="col-span-2 space-y-1">
                              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Número de Documento</label>
                              <input
                                type="text"
                                placeholder="Ej: 901.234.567-8"
                                value={isDocFocused ? docNumber : (docNumber ? docNumber.slice(0, 3) + '*'.repeat(Math.max(0, docNumber.length - 6)) + docNumber.slice(-3) : '')}
                                onFocus={() => setIsDocFocused(true)}
                                onBlur={() => setIsDocFocused(false)}
                                onChange={e => setDocNumber(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none h-10"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Razón Social</label>
                            <input
                              type="text"
                              placeholder="Ej: Discotecas Asociadas S.A.S."
                              value={businessName}
                              onChange={e => setBusinessName(e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none h-10"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Nombre Comercial de Facturación</label>
                            <input
                              type="text"
                              placeholder="Ej: Hangover Club Barranquilla"
                              value={commercialName}
                              onChange={e => setCommercialName(e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none h-10"
                            />
                          </div>
                        </div>
                      </div>

                      {/* DETALLES BANCARIOS & CONFIGURACION PLATAFORMA */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* INFORMACIÓN BANCARIA */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <Building2 className="w-4 h-4 text-purple-400" />
                            <h3 className="text-xs font-black uppercase text-zinc-200">Información Bancaria de Retiro</h3>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Titular de la Cuenta</label>
                            <input
                              type="text"
                              placeholder="Nombre completo o Representante"
                              value={bankHolderName}
                              onChange={e => setBankHolderName(e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none h-10"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Banco</label>
                              <input
                                type="text"
                                placeholder="Ej: Bancolombia, Davivienda"
                                value={bankName}
                                onChange={e => setBankName(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none h-10"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Tipo de Cuenta</label>
                              <select
                                value={bankAccountType}
                                onChange={e => setBankAccountType(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none h-10"
                              >
                                <option value="ahorros">Ahorros</option>
                                <option value="corriente">Corriente</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Número de Cuenta</label>
                            <input
                              type="text"
                              placeholder="Escribe el número completo"
                              value={isAccountFocused ? bankAccountNumber : (bankAccountNumber ? '•'.repeat(Math.max(6, bankAccountNumber.length - 4)) + bankAccountNumber.slice(-4) : '')}
                              onFocus={() => setIsAccountFocused(true)}
                              onBlur={() => setIsAccountFocused(false)}
                              onChange={e => setBankAccountNumber(e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none h-10"
                            />
                          </div>
                        </div>

                        {/* CONFIGURACIÓN DE PLATAFORMA (SOLO LECTURA) */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <Settings className="w-4 h-4 text-purple-400" />
                            <h3 className="text-xs font-black uppercase text-zinc-200">Configuración Financiera de Plataforma</h3>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 p-3 rounded-xl bg-black/30 border border-white/5">
                              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Comisión de Plataforma</span>
                              <span className="text-lg font-black text-white">{platformCommission}%</span>
                              <span className="text-[9px] text-zinc-500 block">Tasa aplicada a ventas online</span>
                            </div>

                            <div className="space-y-1 p-3 rounded-xl bg-black/30 border border-white/5">
                              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Frecuencia de Retiro</span>
                              <span className="text-xs font-black text-white">Semanal (7 días)</span>
                              <span className="text-[9px] text-zinc-500 block">Traspaso automático a cuenta</span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-400 font-medium">Próxima Fecha de Liquidación:</span>
                              <span className="font-bold text-white">
                                {nextSettlementDate ? new Date(nextSettlementDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pendiente programar'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-400 font-medium">Último Traspaso Exitoso:</span>
                              <span className="font-bold text-zinc-300">
                                {lastSettlementAt ? new Date(lastSettlementAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Ninguno registrado'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* DASHBOARD FINANCIERO (MÉTRICAS) */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                          <Layers className="w-4 h-4 text-purple-400" />
                          <h3 className="text-xs font-black uppercase text-zinc-200">Dashboard Financiero de Ventas</h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                          {[
                            { label: 'Ingresos Hoy', value: revenueToday, sub: 'Corte actual' },
                            { label: 'Ingresos Mes', value: revenueMonth, sub: 'Mes en curso' },
                            { label: 'Acumulado', value: revenueAccumulated, sub: 'Total histórico' },
                            { label: 'Comisión Hng', value: commissionGenerated, sub: 'Comisión total' },
                            { label: 'Pendiente Liquidar', value: pendingSettlement, sub: 'Saldo a favor', highlighted: true },
                            { label: 'Última Liquidación', value: lastSettlementAt ? '$ 0.00' : '$ 0.00', sub: 'Traspaso realizado', isRawText: true }
                          ].map((stat, i) => (
                            <div key={i} className={`p-3 rounded-xl bg-black/40 border border-white/5 text-center flex flex-col justify-between ${stat.highlighted ? 'border-primary-500/20 bg-primary-600/5' : ''}`}>
                              <span className="text-[9px] font-black uppercase text-zinc-400 block truncate leading-none">{stat.label}</span>
                              <span className={`text-sm font-black block my-1.5 ${stat.highlighted ? 'text-primary-400' : 'text-white'}`}>
                                {stat.isRawText ? stat.value : `$ ${Number(stat.value).toLocaleString('es-CO')}`}
                              </span>
                              <span className="text-[8px] text-zinc-500 block truncate leading-none">{stat.sub}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* HISTORIAL DE LIQUIDACIONES */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <h3 className="text-xs font-black uppercase text-zinc-200">Historial de Liquidaciones</h3>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
                                <th className="py-2.5 px-3">Fecha</th>
                                <th className="py-2.5 px-3">Monto Retirado</th>
                                <th className="py-2.5 px-3">Estado</th>
                                <th className="py-2.5 px-3">Método / Destino</th>
                              </tr>
                            </thead>
                            <tbody>
                              {payoutHistory.length > 0 ? (
                                payoutHistory.map((payout, i) => (
                                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3 px-3 text-zinc-300 font-semibold">
                                      {new Date(payout.settled_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="py-3 px-3 text-white font-bold">
                                      $ {Number(payout.amount).toLocaleString('es-CO')}
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        payout.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                        payout.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                                        'bg-red-500/10 text-red-400 border border-red-500/20'
                                      }`}>
                                        {payout.status === 'completed' ? 'Completado' : payout.status === 'pending' ? 'Pendiente' : 'Fallido'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-zinc-400 font-medium">
                                      {payout.payout_method}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <>
                                  {/* MOCK DE ARQUITECTURA FINANCIERA (Para previsualización antes de generar liquidaciones reales) */}
                                  <tr className="border-b border-white/5 hover:bg-white/5 opacity-40">
                                    <td className="py-3 px-3 text-zinc-300">Vista Previa (Simulación)</td>
                                    <td className="py-3 px-3 text-white font-bold">$ 1.250.000</td>
                                    <td className="py-3 px-3">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completado</span>
                                    </td>
                                    <td className="py-3 px-3 text-zinc-400">Transferencia Bancaria Bancolombia</td>
                                  </tr>
                                  <tr className="border-b border-white/5 hover:bg-white/5 opacity-40">
                                    <td className="py-3 px-3 text-zinc-300">Vista Previa (Simulación)</td>
                                    <td className="py-3 px-3 text-white font-bold">$ 850.000</td>
                                    <td className="py-3 px-3">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completado</span>
                                    </td>
                                    <td className="py-3 px-3 text-zinc-400">Transferencia Bancaria Bancolombia</td>
                                  </tr>
                                  <tr>
                                    <td colSpan={4} className="py-4 text-center text-zinc-500 italic text-[10px]">
                                      Historial simulado. No hay transacciones de retiro reales procesadas.
                                    </td>
                                  </tr>
                                </>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* AUDITORÍA Y TRAZABILIDAD */}
                      <div className="flex justify-between items-center text-[9px] text-zinc-500 pt-2">
                        <span>Comisiones sujetas a términos de contratación de Hangover S.A.S.</span>
                        <span>Trazabilidad: RLS Activo • Conexión encriptada SSL</span>
                      </div>

                      {/* BOTÓN DE GUARDADO */}
                      <div className="border-t border-white/5 pt-4">
                        <button
                          type="button"
                          onClick={() => handleSaveSection('payments')}
                          className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer touch-target flex items-center justify-center gap-1.5"
                        >
                          {successSection === 'payments' ? <Check className="w-4 h-4 text-emerald-300 animate-bounce" /> : null}
                          <span>{successSection === 'payments' ? "¡Configuración Guardada!" : "Guardar Configuración de Cobros"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activeEditTab === 'config' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">Calificación Inicial</label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={rating}
                            onChange={e => setRating(parseFloat(e.target.value) || 5.0)}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">Visibilidad Pública</label>
                          <select
                            value={visibility}
                            onChange={e => setVisibility(e.target.value as any)}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none h-12"
                          >
                            <option value="public">Público (Catálogo)</option>
                            <option value="private">Privado (Solo Admin)</option>
                            <option value="unlisted">Oculto (Acceso directo)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-zinc-300 ml-1">Plan de Suscripción</label>
                          <select
                            value={planType}
                            onChange={e => setPlanType(e.target.value as any)}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none h-12"
                          >
                            <option value="free">Plan Free</option>
                            <option value="pro">Plan Pro Premium</option>
                            <option value="enterprise">Plan Enterprise</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-zinc-300 ml-1">Estado de Publicación</label>
                        <select
                          value={status}
                          onChange={e => setStatus(e.target.value as any)}
                          className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none h-12"
                        >
                          <option value="draft">Borrador (Oculto)</option>
                          <option value="pending_review">Pendiente de Revisión</option>
                          <option value="published">Publicado (Activo)</option>
                          <option value="paused">Pausado (Solo Lectura)</option>
                          <option value="archived">Archivado (Eliminado)</option>
                        </select>
                      </div>

                      <div className="border-t border-white/5 pt-4 flex gap-4">
                        <button
                          type="button"
                          onClick={() => handleSaveSection('config')}
                          className="flex-[2] bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer touch-target flex items-center justify-center gap-1.5"
                        >
                          {successSection === 'config' ? <Check className="w-4 h-4 text-emerald-300 animate-bounce" /> : null}
                          <span>{successSection === 'config' ? "¡Configuración Guardada!" : "Guardar Configuración"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("¿Seguro que deseas eliminar esta discoteca? Se archivará de forma segura.")) {
                              setStatus("archived")
                              setTimeout(() => handleSaveSection('config'), 100)
                            }
                          }}
                          className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer touch-target"
                        >
                          Eliminar Club
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW AND COMPLETENESS SIDEBAR */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 bg-zinc-950/60 p-6 flex flex-col justify-between shrink-0 overflow-y-auto scrollbar-none max-h-[40vh] md:max-h-none hidden md:flex">
              <div className="space-y-5">
                {/* Score completion circle/text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-400 font-outfit uppercase tracking-wider">Completitud del Perfil</span>
                    <span className="font-black text-primary-400">{getProfileCompletion().score}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-600 to-purple-500 transition-all duration-500"
                      style={{ width: `${getProfileCompletion().score}%` }}
                    />
                  </div>
                </div>

                {/* High fidelity real visual preview mock of client page */}
                <div className="rounded-2xl border border-white/10 bg-[#06060c] overflow-hidden shadow-2xl relative">
                  {/* Banner/Hero area */}
                  <div className="relative h-36 bg-zinc-900 overflow-hidden">
                    {videoHero.trim() ? (
                      <video src={videoHero} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : heroImage.trim() ? (
                      <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
                    ) : bannerPreviewUrl ? (
                      <img src={bannerPreviewUrl} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-950/20 to-zinc-900">
                        <Building2 className="w-8 h-8 text-white/10" />
                      </div>
                    )}
                    
                    {/* Logo overlay */}
                    <div className="absolute bottom-2 left-3 w-10 h-10 rounded-xl bg-black border border-white/10 overflow-hidden p-0.5">
                      {logoPreviewUrl ? (
                        <img src={logoPreviewUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-650 font-bold">Logo</div>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-400">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{Number(rating).toFixed(1)}</span>
                    </div>

                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 border border-white/5 text-[9px] font-bold text-zinc-300 rounded-full font-outfit uppercase">
                      {clubType}
                    </span>
                  </div>

                  {/* Info contents */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-white font-outfit line-clamp-1">{name || "Nombre comercial"}</h4>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-primary-400 shrink-0" />
                        <span>{city || "Ciudad"}, Colombia</span>
                      </p>
                    </div>

                    {/* Simulation Action CTA Buttons */}
                    <div className="flex gap-1.5">
                      <button type="button" className="flex-1 bg-primary-600 text-[10px] font-bold text-white rounded-lg py-1.5 shadow-sm text-center disabled:opacity-50" disabled>
                        {enabledModules.includes('reservations') ? "Reservar Mesa" : "Comprar Cover"}
                      </button>
                      <button type="button" className="px-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white text-[10px] font-bold transition-all" disabled>
                        Seguir
                      </button>
                    </div>

                    <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed min-h-[30px]">
                      {description || "Escribe una descripción comercial para que los usuarios lean los detalles."}
                    </p>

                    {/* Social networks icons preview */}
                    <div className="flex items-center gap-3 pt-2.5 border-t border-white/5">
                      {whatsapp && <Phone className="w-3.5 h-3.5 text-zinc-500" />}
                      {instagram && <Globe className="w-3.5 h-3.5 text-zinc-500" />}
                      {facebook && <Share2 className="w-3.5 h-3.5 text-zinc-500" />}
                      {tiktok && <Compass className="w-3.5 h-3.5 text-zinc-500" />}
                      {website && <Link2 className="w-3.5 h-3.5 text-zinc-500" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status details */}
              <div className="pt-4 border-t border-white/5 space-y-2 text-[10px] text-zinc-500 leading-snug">
                <p className="font-bold uppercase tracking-wider text-zinc-400 font-outfit">Soporte Multiusuario & Franquicia</p>
                <p>Establecimiento gestionado en propiedad única de tu cuenta de proveedor.</p>
                <div className="flex items-center gap-1.5 mt-1 bg-white/5 p-2 rounded-xl border border-white/5 text-[9px]">
                  <Shield className="w-3 h-3 text-primary-400" />
                  <span>Configuración de franquicias compatible (`brand_id` activo).</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="glass-card max-w-sm w-full p-6 text-center border-red-500/20 bg-zinc-950 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-outfit">¿Eliminar discoteca?</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Esta acción no se puede deshacer. Se eliminarán permanentemente todos los datos de la discoteca de la plataforma.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isPending}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2.5 rounded-xl border border-white/10 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu & Services Manager */}
      {isMenuManagerOpen && (
        <ClubMenuServicesManager
          club={club}
          isOpen={isMenuManagerOpen}
          onClose={() => setIsMenuManagerOpen(false)}
        />
      )}

      {/* Media Manager (Stories & Gallery) */}
      {isMediaManagerOpen && (
        <ClubMediaManager
          club={club}
          isOpen={isMediaManagerOpen}
          onClose={() => setIsMediaManagerOpen(false)}
        />
      )}
    </div>
  );
}
