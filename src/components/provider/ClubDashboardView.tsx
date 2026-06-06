"use client";

import { useState } from "react";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateClub, deleteClub } from "@/app/(dashboard)/dashboard/provider/clubs/actions";
import { ClubMenuServicesManager } from "@/app/(dashboard)/dashboard/provider/clubs/ClubMenuServicesManager";
import { ClubDashboardCharts } from "./ClubDashboardCharts";

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
  opening_hours: string | null;
  rating: number;
  active: boolean;
  cover_price: number | null;
  created_at: string;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
  image_url: string | null;
  category: string;
}

interface ClubDashboardStats {
  coversToday: number;
  coversThisWeek: number;
  coversThisMonth: number;
  coversThisYear: number;
  coversDiffPct: number | null;

  revenueToday: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  revDiffPct: number | null;

  totalCheckedInUsers: number;
  checkedInDiffPct: number | null;

  totalOrdersCount: number;
  activeSessionsCount: number;

  tablesOccupied: number;
  tablesFree: number;
  openSessionsCount: number;
  ordersPending: number;
  ordersPreparing: number;
  ordersDelivered: number;
  pendingRequests: number;
  attendedRequests: number;

  pendingBookingsCount: number;
  mesasExpensiveCount: number;
}

interface ClubDashboardViewProps {
  club: Club;
  stats: ClubDashboardStats;
  chartsData: any[];
  topProducts: TopProduct[];
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

// Upload assets using Supabase Client
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

export function ClubDashboardView({ club, stats, chartsData, topProducts }: ClubDashboardViewProps) {
  const router = useRouter();

  // Modals management
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMenuManagerOpen, setIsMenuManagerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Edit club form state
  const [name, setName] = useState(club.name || "");
  const [city, setCity] = useState(club.city || "");
  const [description, setDescription] = useState(club.description || "");
  const [bannerImage, setBannerImage] = useState(club.banner_image || "");
  const [logo, setLogo] = useState(club.logo || "");
  const [address, setAddress] = useState(club.address || "");
  const [instagram, setInstagram] = useState(club.instagram || "");
  const [openingHours, setOpeningHours] = useState(club.opening_hours || "");
  const [rating, setRating] = useState(club.rating || 5.0);
  const [active, setActive] = useState(club.active ?? true);
  const [coverPrice, setCoverPrice] = useState(club.cover_price || 0.00);

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
    setOpeningHours(club.opening_hours || "");
    setRating(club.rating || 5.0);
    setActive(club.active ?? true);
    setCoverPrice(club.cover_price || 0.00);
    cleanupBlobUrl(bannerPreviewUrl);
    cleanupBlobUrl(logoPreviewUrl);
    setBannerPreviewUrl(club.banner_image || null);
    setLogoPreviewUrl(club.logo || null);
    setBannerAssetFile(null);
    setLogoAssetFile(null);
    setError(null);
    setSuccess(false);
  };

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

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError("El nombre de la discoteca es obligatorio.");
      return;
    }

    if (!city.trim()) {
      setError("La ciudad es obligatoria.");
      return;
    }

    setIsUploadingAssets(true);

    try {
      const uploadedBannerUrl = bannerAssetFile ? await uploadClubAsset(bannerAssetFile, "banners") : bannerImage || null;
      const uploadedLogoUrl = logoAssetFile ? await uploadClubAsset(logoAssetFile, "logos") : logo || null;

      const payload = {
        name: name.trim(),
        city: city.trim(),
        description: description.trim() || null,
        banner_image: uploadedBannerUrl || null,
        logo: uploadedLogoUrl || null,
        address: address.trim() || null,
        instagram: instagram.trim() || null,
        opening_hours: openingHours.trim() || null,
        rating: Number(rating) || 5.0,
        active,
        cover_price: Number(coverPrice) || 0,
      };

      const result = await updateClub(club.id, payload);

      setIsUploadingAssets(false);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setBannerAssetFile(null);
        setLogoAssetFile(null);
        router.refresh();
        setTimeout(() => {
          setIsEditModalOpen(false);
          setSuccess(false);
        }, 1500);
      }
    } catch (uploadError: any) {
      setError(uploadError?.message || "No se pudo subir una o más imágenes.");
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

  const isFormLocked = isPending || isUploadingAssets || success;

  // Alerts logic (Fase 6)
  const operationAlerts: string[] = [];
  if (stats.ordersPending > 0) {
    operationAlerts.push(`⚠️ ${stats.ordersPending} pedido${stats.ordersPending > 1 ? "s" : ""} pendiente${stats.ordersPending > 1 ? "s" : ""}`);
  }
  if (stats.pendingRequests > 0) {
    operationAlerts.push(`⚠️ ${stats.pendingRequests} llamado${stats.pendingRequests > 1 ? "s" : ""} a mesero`);
  }
  if (stats.mesasExpensiveCount > 0) {
    operationAlerts.push(`⚠️ ${stats.mesasExpensiveCount} mesa${stats.mesasExpensiveCount > 1 ? "s" : ""} supera${stats.mesasExpensiveCount > 1 ? "n" : ""} $500.000 COP`);
  }
  if (stats.pendingBookingsCount > 0) {
    operationAlerts.push(`⚠️ ${stats.pendingBookingsCount} reserva${stats.pendingBookingsCount > 1 ? "s" : ""} pendiente${stats.pendingBookingsCount > 1 ? "s" : ""}`);
  }

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col gap-4">
        {/* Back Link */}
        <Link
          href="/dashboard/provider/clubs"
          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Mis Discotecas</span>
        </Link>

        {/* Brand Details */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-zinc-950/40 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
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
              <h2 className="text-2xl font-black text-white font-outfit truncate leading-tight">
                {club.name}
              </h2>
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

          <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto">
            {club.active ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 shadow-sm">
                <Eye className="w-3.5 h-3.5" /> Activa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-zinc-800 border border-white/5 text-xs font-bold text-zinc-400 shadow-sm">
                <EyeOff className="w-3.5 h-3.5" /> Inactiva
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-extrabold text-amber-400 font-outfit shadow-sm">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
              {Number(club.rating || 0).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* ==========================================
          FASE 6 - ALERTAS EN TIEMPO REAL
          ========================================== */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-[#09090f]/70 p-5 shadow-lg">
        {operationAlerts.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
              <h4 className="text-xs font-black uppercase tracking-wider font-outfit">
                Alertas de Operación Activas ({operationAlerts.length})
              </h4>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {operationAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold px-3.5 py-2 rounded-xl"
                >
                  {alert}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-emerald-400">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider font-outfit">Operación Funcionando Correctamente</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">No hay incidencias, llamados o pedidos atrasados pendientes.</p>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          FASE 3 & FASE 4 - METRICAS EN TIEMPO REAL
          ========================================== */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">Métricas y Rendimiento</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Covers Hoy */}
          <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Covers hoy</span>
              <span className="text-2xl font-black text-white font-outfit block">{stats.coversToday}</span>
            </div>
            <span className="text-[10px] font-bold mt-3 block">
              {stats.coversDiffPct !== null ? (
                <span className={stats.coversDiffPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {stats.coversDiffPct >= 0 ? "+" : ""}{stats.coversDiffPct.toFixed(1)}% vs ayer
                </span>
              ) : (
                <span className="text-zinc-500">Sin histórico suficiente</span>
              )}
            </span>
          </div>

          {/* Covers Semana */}
          <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Covers esta semana</span>
              <span className="text-2xl font-black text-white font-outfit block">{stats.coversThisWeek}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-bold mt-3 block">Últimos 7 días</span>
          </div>

          {/* Covers Mes */}
          <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Covers este mes</span>
              <span className="text-2xl font-black text-white font-outfit block">{stats.coversThisMonth}</span>
            </div>
            <span className="text-[10px] font-bold mt-3 block">
              {stats.coversDiffPct !== null ? (
                <span className="text-zinc-500">Mensual consolidado</span>
              ) : (
                <span className="text-zinc-500">Sin histórico suficiente</span>
              )}
            </span>
          </div>

          {/* Covers Año */}
          <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Covers este año</span>
              <span className="text-2xl font-black text-white font-outfit block">{stats.coversThisYear}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-bold mt-3 block">Año fiscal en curso</span>
          </div>

          {/* Ingresos Hoy */}
          <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Ingresos hoy</span>
              <span className="text-2xl font-black text-emerald-400 font-outfit block">
                ${stats.revenueToday.toLocaleString("es-CO")}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-bold mt-3 block">Ventas brutas hoy</span>
          </div>

          {/* Ingresos Mes */}
          <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Ingresos este mes</span>
              <span className="text-2xl font-black text-emerald-400 font-outfit block">
                ${stats.revenueThisMonth.toLocaleString("es-CO")}
              </span>
            </div>
            <span className="text-[10px] font-bold mt-3 block">
              {stats.revDiffPct !== null ? (
                <span className={stats.revDiffPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {stats.revDiffPct >= 0 ? "+" : ""}{stats.revDiffPct.toFixed(1)}% vs mes ant.
                </span>
              ) : (
                <span className="text-zinc-500">Sin histórico suficiente</span>
              )}
            </span>
          </div>

          {/* Personas Ingresadas */}
          <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Personas ingresadas</span>
              <span className="text-2xl font-black text-white font-outfit block">{stats.totalCheckedInUsers}</span>
            </div>
            <span className="text-[10px] font-bold mt-3 block">
              {stats.checkedInDiffPct !== null ? (
                <span className={stats.checkedInDiffPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {stats.checkedInDiffPct >= 0 ? "+" : ""}{stats.checkedInDiffPct.toFixed(1)}% vs sem. ant
                </span>
              ) : (
                <span className="text-zinc-500">Sin histórico suficiente</span>
              )}
            </span>
          </div>

          {/* Pedidos & Mesas */}
          <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Pedidos / Mesas</span>
              <div className="flex items-baseline justify-between mt-2.5">
                <div>
                  <span className="text-2xl font-black text-primary-400 font-outfit block">{stats.totalOrdersCount}</span>
                  <span className="text-[9px] text-zinc-500 uppercase font-bold">Pedidos</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-cyan-400 font-outfit block">{stats.openSessionsCount}</span>
                  <span className="text-[9px] text-zinc-500 uppercase font-bold">Mesas Activas</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Grid: Charts & Operation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Charts and Top Products */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ==========================================
              FASE 8 - GRAFICOS (SVG INTERACTIVO)
              ========================================== */}
          <ClubDashboardCharts data={chartsData} />

          {/* ==========================================
              FASE 7 - PRODUCTOS MAS VENDIDOS
              ========================================== */}
          <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm font-outfit">Ranking de Consumo</h4>
                <p className="text-xs text-zinc-500">Productos más vendidos en vivo</p>
              </div>
              <TrendingUp className="w-5 h-5 text-zinc-700" />
            </div>

            {topProducts.length > 0 ? (
              <div className="divide-y divide-white/5">
                {topProducts.map((p, index) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-xs font-black text-zinc-500 font-outfit">
                        #{index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate font-outfit">{p.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-semibold">{p.category}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-white font-outfit">{p.quantity} uds</p>
                      <p className="text-[10px] text-emerald-400 font-bold">${p.revenue.toLocaleString("es-CO")} COP</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-white/5 rounded-xl bg-black/20">
                <Coffee className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Sin actividad registrada aún</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Operational Panel and Quick Actions */}
        <div className="space-y-8">
          
          {/* ==========================================
              FASE 5 - ESTADO OPERATIVO
              ========================================== */}
          <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-5">
            <div>
              <h4 className="font-bold text-white text-sm font-outfit">Estado Operativo</h4>
              <p className="text-xs text-zinc-500">Monitoreo físico en vivo</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Mesas Ocupadas */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Mesas Ocupadas</span>
                <span className="text-xl font-black text-primary-400 mt-1 block font-outfit">{stats.tablesOccupied}</span>
              </div>
              {/* Mesas Libres */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Mesas Libres</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block font-outfit">{stats.tablesFree}</span>
              </div>
              {/* Facturas Abiertas */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Facturas Abiertas</span>
                <span className="text-xl font-black text-white mt-1 block font-outfit">{stats.openSessionsCount}</span>
              </div>
              {/* Pedidos Pendientes */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Pendientes</span>
                <span className="text-xl font-black text-amber-400 mt-1 block font-outfit">{stats.ordersPending}</span>
              </div>
              {/* Pedidos Preparando */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Preparando</span>
                <span className="text-xl font-black text-cyan-400 mt-1 block font-outfit">{stats.ordersPreparing}</span>
              </div>
              {/* Pedidos Entregados */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Entregados</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block font-outfit">{stats.ordersDelivered}</span>
              </div>
              {/* Llamados a mesero */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Llamados Mesero</span>
                <span className="text-xl font-black text-red-400 mt-1 block font-outfit">{stats.pendingRequests}</span>
              </div>
              {/* Llamados atendidos */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Atendidos</span>
                <span className="text-xl font-black text-zinc-400 mt-1 block font-outfit">{stats.attendedRequests}</span>
              </div>
            </div>
          </div>

          {/* ==========================================
              FASE 9 - ACCIONES RAPIDAS
              ========================================== */}
          <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-4">
            <div>
              <h4 className="font-bold text-white text-sm font-outfit">Acciones Rápidas</h4>
              <p className="text-xs text-zinc-500">Accesos y tareas frecuentes</p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs font-semibold border border-white/5 transition-all text-left cursor-pointer"
              >
                <span>📝 Editar Perfil</span>
                <span className="text-zinc-600">→</span>
              </button>

              <button
                onClick={() => setIsMenuManagerOpen(true)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs font-semibold border border-white/5 transition-all text-left cursor-pointer"
              >
                <span>🍷 Editar Carta / Menú</span>
                <span className="text-zinc-600">→</span>
              </button>

              <button
                onClick={() => router.push("/dashboard/provider/tables")}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs font-semibold border border-white/5 transition-all text-left cursor-pointer"
              >
                <span>🪑 Control de Mesas</span>
                <span className="text-zinc-600">→</span>
              </button>

              <button
                onClick={() => router.push("/dashboard/provider/orders")}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs font-semibold border border-white/5 transition-all text-left cursor-pointer"
              >
                <span>🍹 Pedidos en Vivo</span>
                <span className="text-zinc-600">→</span>
              </button>

              <button
                onClick={() => router.push("/dashboard/provider/scanner")}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs font-semibold border border-white/5 transition-all text-left cursor-pointer"
              >
                <span>🎟️ Validar Accesos QR</span>
                <span className="text-zinc-600">→</span>
              </button>

              <button
                onClick={() => router.push("/dashboard/provider")}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs font-semibold border border-white/5 transition-all text-left cursor-pointer"
              >
                <span>📅 Reservas Recibidas</span>
                <span className="text-zinc-600">→</span>
              </button>

              <div className="w-full flex items-center justify-between bg-white/5 text-zinc-500 rounded-xl py-3 px-4 text-xs font-semibold border border-white/5 select-none relative">
                <span>📣 Promociones (Próximamente)</span>
                <span className="text-[9px] uppercase tracking-wider bg-zinc-800 text-zinc-400 font-bold px-1.5 py-0.5 rounded">Fase 2</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ==========================================
          REUSE EDIT MODALS
          ========================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-2xl my-8 overflow-hidden relative border-white/10 bg-zinc-950 shadow-[0_0_50px_rgba(217,70,239,0.1)]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-outfit">Editar Discoteca</h3>
                <p className="text-xs text-zinc-400">Sube imágenes reales y prevéalas antes de guardar.</p>
              </div>
              <button
                onClick={() => !isFormLocked && setIsEditModalOpen(false)}
                disabled={isFormLocked}
                className="text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-none">
              {error && (
                <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>¡Discoteca actualizada!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Nombre de la Discoteca *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    disabled={isFormLocked}
                    placeholder="Ej. Pacha Ibiza"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Ciudad *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    required
                    disabled={isFormLocked}
                    placeholder="Ej. Ibiza"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Calificación Inicial (0.0 - 5.0)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={rating}
                    onChange={e => setRating(parseFloat(e.target.value) || 5.0)}
                    disabled={isFormLocked}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Dirección Física</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    disabled={isFormLocked}
                    placeholder="Ej. Av. 8 de Agosto, Local 12"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Instagram (@usuario)</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    disabled={isFormLocked}
                    placeholder="@opium_barcelona"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Horario de Apertura</label>
                  <input
                    type="text"
                    value={openingHours}
                    onChange={e => setOpeningHours(e.target.value)}
                    disabled={isFormLocked}
                    placeholder="Ej. Jueves a Sábados 10PM - 6AM"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Precio de Cover ($ COP)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={coverPrice}
                    onChange={e => setCoverPrice(parseFloat(e.target.value) || 0)}
                    disabled={isFormLocked}
                    placeholder="Ej. 25000"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Descripción</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={isFormLocked}
                    placeholder="Describe el ambiente, la música y los servicios VIP de tu discoteca..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none min-h-[90px] resize-none"
                  />
                </div>

                <div className="space-y-3 sm:col-span-2 rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-white">Imágenes reales de tu club</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">JPG, PNG, WEBP o GIF · máx. 3MB</p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Banner upload */}
                    <div className="rounded-[20px] border border-white/10 bg-black/30 p-3 space-y-3">
                      <p className="text-xs font-semibold text-zinc-300">Banner</p>
                      <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-gradient-to-br from-primary-950/80 to-zinc-950 min-h-[120px]">
                        {bannerPreviewUrl ? (
                          <img src={bannerPreviewUrl} alt="Preview del banner" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-zinc-600">
                            <ImagePlus className="w-6 h-6" />
                            <span className="text-[10px]">Sin banner</span>
                          </div>
                        )}
                      </div>
                      <label className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-white/10 transition-colors">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Subir</span>
                        <input type="file" accept="image/*" onChange={handleBannerFileChange} disabled={isFormLocked} className="hidden" />
                      </label>
                    </div>

                    {/* Logo upload */}
                    <div className="rounded-[20px] border border-white/10 bg-black/30 p-3 space-y-3">
                      <p className="text-xs font-semibold text-zinc-300">Logo</p>
                      <div className="flex h-[120px] items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-gradient-to-br from-primary-950/80 to-zinc-950">
                        {logoPreviewUrl ? (
                          <img src={logoPreviewUrl} alt="Preview del logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 text-zinc-600">
                            <ImagePlus className="w-6 h-6" />
                            <span className="text-[10px]">Sin logo</span>
                          </div>
                        )}
                      </div>
                      <label className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-white/10 transition-colors">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Subir</span>
                        <input type="file" accept="image/*" onChange={handleLogoFileChange} disabled={isFormLocked} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2 px-1 sm:col-span-2">
                  <input
                    id="club-active"
                    type="checkbox"
                    checked={active}
                    onChange={e => setActive(e.target.checked)}
                    disabled={isFormLocked}
                    className="w-4 h-4 rounded border-white/10 bg-black/60 accent-primary-500 text-primary-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="club-active" className="text-xs font-medium text-zinc-300 cursor-pointer select-none">
                    Marcar como activa (visible en el marketplace general)
                  </label>
                </div>
              </div>

              {!success && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={isFormLocked}
                    className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl py-2.5 px-4 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Club</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isFormLocked}
                    className="flex-[2] bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary-500/10 cursor-pointer"
                  >
                    {isUploadingAssets || isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </button>
                </div>
              )}
            </form>
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
    </div>
  );
}
