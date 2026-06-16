"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  Star,
  Clock,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  UploadCloud,
  Search,
  Sparkles,
  Check,
  Lock,
  Settings,
  Link2,
  Phone,
  Compass,
  Heart,
  Share2,
  Globe,
  ChevronRight,
  ChevronLeft,
  Shield,
  Layers,
  CreditCard,
  Map,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createClub, updateClub, deleteClub, getClubPaymentSettings, updateClubPaymentSettings, getClubPayoutHistory } from "./actions"
import { ClubMenuServicesManager } from "./ClubMenuServicesManager"
import { CLUB_MODULES, WIZARD_STEPS } from "./constants"

function Instagram({ className }: { className?: string }) {
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
      <path d="M17.5 6.5h.01" />
    </svg>
  )
}

interface Club {
  id: string
  name: string
  slug: string
  city: string
  description: string | null
  banner_image: string | null
  logo: string | null
  address: string | null
  instagram: string | null
  facebook?: string | null
  tiktok?: string | null
  website?: string | null
  opening_hours: string | null
  rating: number
  active: boolean
  cover_price: number | null
  created_at: string
  amenities?: string[] | null
  club_type?: string
  whatsapp?: string | null
  price_range?: string
  payment_methods?: string[]
  latitude?: number | null
  longitude?: number | null
  video_hero?: string | null
  hero_image?: string | null
  enabled_modules?: string[]
  modules_config?: Record<string, any>
  status?: 'draft' | 'pending_review' | 'published' | 'paused' | 'archived'
  visibility?: 'public' | 'private' | 'unlisted'
  plan_type?: 'free' | 'pro' | 'enterprise'
  brand_id?: string | null
}

interface ClubsManagerProps {
  clubs: Club[]
}

const MAX_IMAGE_SIZE = 3 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

function validateImageFile(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Solo se permiten imágenes JPG, PNG, WEBP o GIF."
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "La imagen debe pesar menos de 3MB."
  }

  return null
}

async function uploadClubAsset(file: File, bucket: "banners" | "logos") {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("No fue posible subir la imagen. Usuario no autenticado.")
  }

  const cleanName = file.name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 60)

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const filePath = `${user.id}/clubs/${bucket}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${cleanName || "asset"}.${fileExt}`

  const { error } = await supabase.storage.from("avatars").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  })

  if (error) {
    throw new Error(error.message || `No fue posible subir la imagen a avatars/clubs/${bucket}.`)
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
  return data.publicUrl
}

export function ClubsManager({ clubs }: ClubsManagerProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [selectedMenuClub, setSelectedMenuClub] = useState<Club | null>(null)
  const [isMenuManagerOpen, setIsMenuManagerOpen] = useState(false)

  const openManageMenuServicesModal = (club: Club) => {
    setSelectedMenuClub(club)
    setIsMenuManagerOpen(true)
  }

  // Form states
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [description, setDescription] = useState("")
  const [bannerImage, setBannerImage] = useState("")
  const [logo, setLogo] = useState("")
  const [address, setAddress] = useState("")
  const [instagram, setInstagram] = useState("")
  const [facebook, setFacebook] = useState("")
  const [tiktok, setTiktok] = useState("")
  const [website, setWebsite] = useState("")
  const [rating, setRating] = useState(5.0)
  const [active, setActive] = useState(true)
  const [coverPrice, setCoverPrice] = useState(0.00)
  const [capacity, setCapacity] = useState(500)
  const [amenitiesText, setAmenitiesText] = useState("")

  // Dynamic step/module custom configurations
  const [clubType, setClubType] = useState("Discoteca")
  const [whatsapp, setWhatsapp] = useState("")
  const [priceRange, setPriceRange] = useState("$$")
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["Efectivo", "Tarjeta"])
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [videoHero, setVideoHero] = useState("")
  const [heroImage, setHeroImage] = useState("")
  const [enabledModules, setEnabledModules] = useState<string[]>(["reservations", "covers", "events", "qr"])
  const [modulesConfig, setModulesConfig] = useState<Record<string, any>>({})
  const [status, setStatus] = useState<'draft' | 'pending_review' | 'published' | 'paused' | 'archived'>("draft")
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>("public")
  const [planType, setPlanType] = useState<'free' | 'pro' | 'enterprise'>("free")
  const [brandId, setBrandId] = useState("")

  // Split opening time inputs
  const [openTime, setOpenTime] = useState("")
  const [closeTime, setCloseTime] = useState("")

  // Geocoding query states
  const [gpsQuery, setGpsQuery] = useState("")
  const [isSearchingGps, setIsSearchingGps] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [showAdvancedGps, setShowAdvancedGps] = useState(false)

  // Wizard state (for creating new)
  const [currentWizardStep, setCurrentWizardStep] = useState<string>("general")

  // Tabs state (for editing)
  const [activeEditTab, setActiveEditTab] = useState<'info' | 'multimedia' | 'operation' | 'modules' | 'config' | 'payments'>("info")

  // Payment and billing settings states
  const [onlinePaymentsEnabled, setOnlinePaymentsEnabled] = useState(false)
  const [paymentGateway, setPaymentGateway] = useState("wompi")
  const [verificationStatus, setVerificationStatus] = useState("unverified")
  const [platformCommission, setPlatformCommission] = useState(5.0)
  const [nextSettlementDate, setNextSettlementDate] = useState("")
  const [lastSettlementAt, setLastSettlementAt] = useState<string | null>(null)
  
  // Bank details
  const [bankHolderName, setBankHolderName] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankAccountType, setBankAccountType] = useState("ahorros")
  const [bankAccountNumber, setBankAccountNumber] = useState("")

  // Billing details
  const [docType, setDocType] = useState("NIT")
  const [docNumber, setDocNumber] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [commercialName, setCommercialName] = useState("")

  // Financial statistics
  const [revenueToday, setRevenueToday] = useState(0)
  const [revenueMonth, setRevenueMonth] = useState(0)
  const [revenueAccumulated, setRevenueAccumulated] = useState(0)
  const [commissionGenerated, setCommissionGenerated] = useState(0)
  const [pendingSettlement, setPendingSettlement] = useState(0)

  // Payout History list state
  const [payoutHistory, setPayoutHistory] = useState<any[]>([])
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false)
  const [isAccountFocused, setIsAccountFocused] = useState(false)
  const [isDocFocused, setIsDocFocused] = useState(false)

  // Preview resources state
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [bannerAssetFile, setBannerAssetFile] = useState<File | null>(null)
  const [logoAssetFile, setLogoAssetFile] = useState<File | null>(null)

  const [isPending, setIsPending] = useState(false)
  const [isUploadingAssets, setIsUploadingAssets] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successSection, setSuccessSection] = useState<string | null>(null)
  const [deletingClubId, setDeletingClubId] = useState<string | null>(null)

  const cleanupBlobUrl = (url: string | null) => {
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url)
    }
  }

  const resetFormState = () => {
    setName("")
    setCity("")
    setDescription("")
    setBannerImage("")
    setLogo("")
    setAddress("")
    setInstagram("")
    setFacebook("")
    setTiktok("")
    setWebsite("")
    setRating(5.0)
    setActive(true)
    setCoverPrice(0.00)
    setCapacity(500)
    setAmenitiesText("")
    
    // Reset new fields
    setClubType("Discoteca")
    setWhatsapp("")
    setPriceRange("$$")
    setPaymentMethods(["Efectivo", "Tarjeta"])
    setLatitude(null)
    setLongitude(null)
    setVideoHero("")
    setHeroImage("")
    setEnabledModules(["reservations", "covers", "events", "qr"])
    setModulesConfig({})
    setStatus("draft")
    setVisibility("public")
    setPlanType("free")
    setBrandId("")
    setOpenTime("")
    setCloseTime("")
    setGpsQuery("")
    setGpsError(null)
    setShowAdvancedGps(false)
    setCurrentWizardStep("general")
    setActiveEditTab("info")

    // Reset payment settings
    setOnlinePaymentsEnabled(false)
    setPaymentGateway("wompi")
    setVerificationStatus("unverified")
    setPlatformCommission(5.0)
    setNextSettlementDate("")
    setLastSettlementAt(null)
    setBankHolderName("")
    setBankName("")
    setBankAccountType("ahorros")
    setBankAccountNumber("")
    setDocType("NIT")
    setDocNumber("")
    setBusinessName("")
    setCommercialName("")
    setRevenueToday(0)
    setRevenueMonth(0)
    setRevenueAccumulated(0)
    setCommissionGenerated(0)
    setPendingSettlement(0)
    setPayoutHistory([])

    setEditingClub(null)
    cleanupBlobUrl(bannerPreviewUrl)
    cleanupBlobUrl(logoPreviewUrl)
    setBannerPreviewUrl(null)
    setLogoPreviewUrl(null)
    setBannerAssetFile(null)
    setLogoAssetFile(null)
    setError(null)
    setSuccess(false)
    setSuccessSection(null)
  }

  const openCreateModal = () => {
    resetFormState()
    setIsModalOpen(true)
  }

  const openEditModal = (club: Club) => {
    resetFormState()
    setEditingClub(club)
    setName(club.name || "")
    setCity(club.city || "")
    setDescription(club.description || "")
    setBannerImage(club.banner_image || "")
    setLogo(club.logo || "")
    setAddress(club.address || "")
    setInstagram(club.instagram || "")
    
    // Split opening hours
    let openVal = ""
    let closeVal = ""
    if (club.opening_hours && club.opening_hours.includes(" - ")) {
      const parts = club.opening_hours.split(" - ")
      openVal = parts[0] || ""
      closeVal = parts[1] || ""
    } else {
      openVal = club.opening_hours || ""
    }
    setOpenTime(openVal)
    setCloseTime(closeVal)

    setRating(club.rating || 5.0)
    setActive(club.active ?? true)
    setCoverPrice(club.cover_price || 0.00)
    setCapacity((club as any).capacity || 500)
    setAmenitiesText(club.amenities ? club.amenities.join(", ") : "")
    setBannerPreviewUrl(club.banner_image || null)
    setLogoPreviewUrl(club.logo || null)

    // New columns mapping
    setClubType((club as any).club_type || "Discoteca")
    setWhatsapp((club as any).whatsapp || "")
    setFacebook((club as any).facebook || "")
    setTiktok((club as any).tiktok || "")
    setWebsite((club as any).website || "")
    setPriceRange((club as any).price_range || "$$")
    setPaymentMethods((club as any).payment_methods || ["Efectivo", "Tarjeta"])
    setLatitude((club as any).latitude || null)
    setLongitude((club as any).longitude || null)
    setVideoHero((club as any).video_hero || "")
    setHeroImage((club as any).hero_image || "")
    setEnabledModules((club as any).enabled_modules || ["reservations", "covers", "events", "qr"])
    setModulesConfig((club as any).modules_config || {})
    setStatus((club as any).status || "draft")
    setVisibility((club as any).visibility || "public")
    setPlanType((club as any).plan_type || "free")
    setBrandId((club as any).brand_id || "")

    // Load payment settings and payouts asynchronously
    setLoadingPaymentSettings(true)
    getClubPaymentSettings(club.id)
      .then(res => {
        if (res.settings) {
          setOnlinePaymentsEnabled(res.settings.online_payments_enabled)
          setPaymentGateway(res.settings.payment_gateway || "wompi")
          setVerificationStatus(res.settings.verification_status || "unverified")
          setPlatformCommission(Number(res.settings.platform_commission) || 5.0)
          setNextSettlementDate(res.settings.next_settlement_date || "")
          setLastSettlementAt(res.settings.last_settlement_at || null)
          setBankHolderName(res.settings.bank_holder_name || "")
          setBankName(res.settings.bank_name || "")
          setBankAccountType(res.settings.bank_account_type || "ahorros")
          setBankAccountNumber(res.settings.bank_account_number || "")
          setDocType(res.settings.doc_type || "NIT")
          setDocNumber(res.settings.doc_number || "")
          setBusinessName(res.settings.business_name || "")
          setCommercialName(res.settings.commercial_name || "")
          setRevenueToday(Number(res.settings.revenue_today) || 0)
          setRevenueMonth(Number(res.settings.revenue_month) || 0)
          setRevenueAccumulated(Number(res.settings.revenue_accumulated) || 0)
          setCommissionGenerated(Number(res.settings.commission_generated) || 0)
          setPendingSettlement(Number(res.settings.pending_settlement) || 0)
        }
      })
      .catch(err => console.error("Error fetching payment settings:", err))
      .finally(() => setLoadingPaymentSettings(false))

    getClubPayoutHistory(club.id)
      .then(res => {
        if (res.history) {
          setPayoutHistory(res.history)
        }
      })
      .catch(err => console.error("Error fetching payout history:", err))

    setIsModalOpen(true)
  }

  const handleBannerFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      event.target.value = ""
      return
    }

    setError(null)
    cleanupBlobUrl(bannerPreviewUrl)
    setBannerAssetFile(file)
    setBannerPreviewUrl(URL.createObjectURL(file))
  }

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      event.target.value = ""
      return
    }

    setError(null)
    cleanupBlobUrl(logoPreviewUrl)
    setLogoAssetFile(file)
    setLogoPreviewUrl(URL.createObjectURL(file))
  }

  const clearBannerImage = () => {
    cleanupBlobUrl(bannerPreviewUrl)
    setBannerAssetFile(null)
    setBannerImage("")
    setBannerPreviewUrl(null)
  }

  const clearLogoImage = () => {
    cleanupBlobUrl(logoPreviewUrl)
    setLogoAssetFile(null)
    setLogo("")
    setLogoPreviewUrl(null)
  }

  const handleTypeSelect = (type: string) => {
    setClubType(type)
    
    // Autoconfigure recommended modules based on selection
    let suggested: string[] = ['reservations']
    if (type === 'Discoteca') {
      suggested = ['reservations', 'covers', 'events', 'qr']
    } else if (type === 'Bar') {
      suggested = ['reservations', 'orders']
    } else if (type === 'Rooftop') {
      suggested = ['reservations', 'events']
    } else if (type === 'Lounge') {
      suggested = ['reservations']
    } else if (type === 'Beach Club') {
      suggested = ['reservations', 'events', 'orders']
    }
    setEnabledModules(suggested)
  }

  const getProfileCompletion = () => {
    let score = 0
    const missing: { label: string; action: string }[] = []

    if (name.trim()) score += 10; else missing.push({ label: "Nombre Comercial", action: "Configura el nombre de tu marca." })
    if (logoPreviewUrl || logo) score += 10; else missing.push({ label: "Logo del local", action: "Sube un logotipo cuadrado de alta definición." })
    if (bannerPreviewUrl || bannerImage) score += 15; else missing.push({ label: "Banner del local", action: "Agrega una foto panorámica para el catálogo." })
    if (address.trim()) score += 15; else missing.push({ label: "Dirección física", action: "Escribe la calle y local exacto para tus clientes." })
    if (openTime.trim() || closeTime.trim()) score += 10; else missing.push({ label: "Horarios de operación", action: "Define la hora de apertura y cierre de las puertas." })
    if (description.trim()) score += 10; else missing.push({ label: "Descripción del ambiente", action: "Explica a tus clientes qué tipo de música y vibra ofreces." })
    if (instagram.trim() || whatsapp.trim() || facebook.trim() || tiktok.trim() || website.trim()) score += 10; else missing.push({ label: "Redes sociales", action: "Sube al menos un enlace para que te contacten." })
    if (heroImage.trim() || videoHero.trim() || bannerPreviewUrl) score += 20; else missing.push({ label: "Media Hero de fondo", action: "Sube un video de fondo u otra imagen de portada (+20%)." })

    return { score, missing }
  }

  const getPublishValidationErrors = () => {
    const errors: string[] = []
    if (!name.trim()) errors.push("Nombre Comercial (Paso 1)")
    if (!logoPreviewUrl && !logo) errors.push("Logo de la marca (Paso 2)")
    if (!bannerPreviewUrl && !bannerImage) errors.push("Banner del local (Paso 2)")
    if (!address.trim()) errors.push("Dirección física (Paso 1)")
    if (!openTime.trim() && !closeTime.trim()) errors.push("Horarios de atención (Paso 3)")
    return errors
  }

  const handleSearchAddress = async () => {
    if (!gpsQuery.trim()) return
    setIsSearchingGps(true)
    setGpsError(null)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(gpsQuery)}&limit=1`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Plataforma-Hangover'
        }
      })
      const data = await response.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        setLatitude(lat)
        setLongitude(lon)
        setSuccessSection("gps")
        setTimeout(() => setSuccessSection(null), 2000)
      } else {
        setGpsError("No se encontraron coordenadas para esta dirección. Intenta manualmente en la sección avanzada.")
      }
    } catch (err) {
      console.error(err)
      setGpsError("Error al consultar el servicio de geolocalización. Intenta manualmente.")
    } finally {
      setIsSearchingGps(false)
    }
  }

  const handleWizardSubmit = async (publishImmediate = false) => {
    setError(null)
    setSuccess(false)
    
    // Check constraints if publishing
    if (publishImmediate) {
      const validationErrors = getPublishValidationErrors()
      if (validationErrors.length > 0) {
        setError(`Para publicar debes completar: ${validationErrors.join(", ")}`)
        return
      }
    }

    setIsUploadingAssets(true)

    try {
      const uploadedBannerUrl = bannerAssetFile ? await uploadClubAsset(bannerAssetFile, "banners") : bannerImage || null
      const uploadedLogoUrl = logoAssetFile ? await uploadClubAsset(logoAssetFile, "logos") : logo || null

      const finalStatus = (publishImmediate ? 'pending_review' : 'draft') as 'draft' | 'pending_review'

      const payload = {
        name: name.trim(),
        club_type: clubType,
        city: city.trim(),
        description: description.trim() || null,
        banner_image: uploadedBannerUrl || null,
        logo: uploadedLogoUrl || null,
        address: address.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        tiktok: tiktok.trim() || null,
        website: website.trim() || null,
        opening_hours: openTime && closeTime ? `${openTime} - ${closeTime}` : openTime || closeTime || null,
        rating: Number(rating) || 5.0,
        active: (finalStatus as string) === 'published' || (finalStatus as string) === 'paused',
        cover_price: Number(coverPrice) || 0,
        capacity: Number(capacity) || 500,
        price_range: priceRange,
        payment_methods: paymentMethods,
        latitude: latitude !== null ? Number(latitude) : null,
        longitude: longitude !== null ? Number(longitude) : null,
        video_hero: videoHero.trim() || null,
        hero_image: heroImage.trim() || null,
        enabled_modules: enabledModules,
        modules_config: modulesConfig,
        status: finalStatus,
        visibility,
        plan_type: planType,
        brand_id: brandId.trim() || null,
        amenities: amenitiesText ? amenitiesText.split(",").map(s => s.trim()).filter(Boolean) : []
      }

      const result = await createClub(payload)
      setIsUploadingAssets(false)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setBannerAssetFile(null)
        setLogoAssetFile(null)
        router.refresh()
        setTimeout(() => {
          setIsModalOpen(false)
          resetFormState()
          setSuccess(false)
        }, 1500)
      }
    } catch (uploadError: any) {
      setError(uploadError?.message || "No se pudo registrar la discoteca.")
      setIsUploadingAssets(false)
    }
  }

  const handleSaveSection = async (section: 'info' | 'multimedia' | 'operation' | 'modules' | 'config' | 'payments') => {
    if (!editingClub) return
    setError(null)
    setSuccessSection(null)
    setIsUploadingAssets(true)

    try {
      let payload: any = {}
      
      if (section === 'info') {
        if (!name.trim()) throw new Error("El nombre comercial es obligatorio.")
        if (!city.trim()) throw new Error("La ciudad es obligatoria.")
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
          amenities: amenitiesText ? amenitiesText.split(",").map(s => s.trim()).filter(Boolean) : [],
          video_hero: videoHero || null,
          hero_image: heroImage || null,
          enabled_modules: enabledModules,
          modules_config: modulesConfig,
          status,
          visibility,
          plan_type: planType,
          brand_id: brandId || null
        }
      } else if (section === 'multimedia') {
        const uploadedBannerUrl = bannerAssetFile ? await uploadClubAsset(bannerAssetFile, "banners") : bannerImage || null
        const uploadedLogoUrl = logoAssetFile ? await uploadClubAsset(logoAssetFile, "logos") : logo || null
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
          amenities: amenitiesText ? amenitiesText.split(",").map(s => s.trim()).filter(Boolean) : [],
          video_hero: videoHero || null,
          hero_image: heroImage || null,
          enabled_modules: enabledModules,
          modules_config: modulesConfig,
          status,
          visibility,
          plan_type: planType,
          brand_id: brandId || null
        }
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
          amenities: amenitiesText ? amenitiesText.split(",").map(s => s.trim()).filter(Boolean) : [],
          video_hero: videoHero || null,
          hero_image: heroImage || null,
          enabled_modules: enabledModules,
          modules_config: modulesConfig,
          status,
          visibility,
          plan_type: planType,
          brand_id: brandId || null
        }
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
          amenities: amenitiesText ? amenitiesText.split(",").map(s => s.trim()).filter(Boolean) : [],
          video_hero: videoHero || null,
          hero_image: heroImage || null,
          enabled_modules: enabledModules,
          modules_config: modulesConfig,
          status,
          visibility,
          plan_type: planType,
          brand_id: brandId || null
        }
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
          amenities: amenitiesText ? amenitiesText.split(",").map(s => s.trim()).filter(Boolean) : [],
          video_hero: videoHero || null,
          hero_image: heroImage || null,
          enabled_modules: enabledModules,
          modules_config: modulesConfig,
          status,
          visibility,
          plan_type: planType,
          brand_id: brandId || null
        }
      } else if (section === 'payments') {
        if (onlinePaymentsEnabled && verificationStatus !== 'verified') {
          throw new Error("No puedes activar pagos online si tu cuenta no está en estado verificado.")
        }

        const result = await updateClubPaymentSettings(editingClub.id, {
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
        })

        setIsUploadingAssets(false)
        if (result.error) {
          setError(result.error)
        } else {
          setSuccessSection(section)
          router.refresh()
          setTimeout(() => setSuccessSection(null), 2500)
        }
        return
      }

      const result = await updateClub(editingClub.id, payload)
      setIsUploadingAssets(false)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccessSection(section)
        router.refresh()
        setTimeout(() => setSuccessSection(null), 2500)
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al guardar esta sección.")
      setIsUploadingAssets(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingClubId) return

    setError(null)
    setIsPending(true)

    const result = await deleteClub(deletingClubId)
    if (result.error) {
      setError(result.error)
      alert(result.error)
    } else {
      router.refresh()
    }
    setDeletingClubId(null)
    setIsPending(false)
  }

  const isFormLocked = isPending || isUploadingAssets || success

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Discotecas Registradas
            <span className="bg-primary-600/20 border border-primary-500/30 text-primary-400 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              {clubs.length}
            </span>
          </h2>
          <p className="text-sm text-zinc-400">Publica, edita y gestiona las discotecas de tu propiedad.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 glow cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva Discoteca
        </button>
      </div>

      {clubs.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4 border-dashed border-white/10">
          <Building2 className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No tienes discotecas registradas</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Comienza a publicar tu discoteca para que los usuarios puedan encontrarla, calificarla, y adquirir accesos VIP desde el marketplace.
          </p>
          <div className="pt-2">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              Registrar mi Primera Discoteca
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clubs.map(club => (
            <div
              key={club.id}
              onClick={() => router.push(`/dashboard/provider/clubs/${club.id}`)}
              className="glass-card overflow-hidden hover:border-white/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex flex-col justify-between h-full group cursor-pointer"
            >
              <div className="relative h-44 w-full bg-zinc-950 flex-shrink-0">
                {club.banner_image ? (
                  <img
                    src={club.banner_image}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-primary-950 via-zinc-900 to-primary-900/40 flex items-center justify-center opacity-40">
                    <Building2 className="w-12 h-12 text-white/20" />
                  </div>
                )}

                {club.logo && (
                  <div className="absolute bottom-4 left-4 w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden shadow-lg p-0.5">
                    <img src={club.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                  </div>
                )}

                <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-xs font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{Number(club.rating || 0).toFixed(1)}</span>
                </div>

                <div className="absolute top-4 left-4 flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-xs font-bold">
                  {club.active ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-0.5" />
                      Abierto ahora
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400">
                      Cerrado
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-400" /> {club.city}
                    </span>
                    {club.instagram && (
                      <span className="flex items-center gap-1 text-primary-400">
                        <Instagram className="w-3 h-3" /> {club.instagram}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors font-outfit line-clamp-1">
                    {club.name}
                  </h3>
                  {club.address && <p className="text-xs text-zinc-500 truncate">{club.address}</p>}
                  <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 min-h-[32px]">
                    {club.description || "Sin descripción proporcionada."}
                  </p>

                  {/* Operational Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-white/5 border border-white/5 rounded-xl text-[11px]">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Asistentes Hoy</span>
                      <span className="font-extrabold text-white">{(club as any).todayAttendees || 0} personas</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Ventas Hoy</span>
                      <span className="font-extrabold text-emerald-400">${((club as any).todaySales || 0).toLocaleString("es-CO")}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {club.opening_hours && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-white/5 py-1.5 px-3 rounded-lg border border-white/5">
                        <Clock className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                        <span className="truncate">{club.opening_hours}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-white/5 py-1.5 px-3 rounded-lg border border-white/5">
                      <span className="text-primary-400 font-semibold shrink-0">Cover:</span>
                      <span className="text-zinc-200">
                        {club.cover_price !== null && club.cover_price !== undefined && Number(club.cover_price) > 0
                          ? `$${Number(club.cover_price).toLocaleString('es-CO')} COP`
                          : "Gratis / No definido"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-white/5 mt-3 flex-wrap">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(club); }}
                    className="flex-grow bg-white/5 hover:bg-white/10 text-white rounded-xl py-2.5 px-3 text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-[70px]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openManageMenuServicesModal(club); }}
                    className="flex-grow bg-primary-600/10 hover:bg-primary-600/20 text-primary-400 border border-primary-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-[90px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Carta / Servicios
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingClubId(club.id); }}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className={`glass-card w-full ${editingClub ? 'max-w-4xl' : 'max-w-6xl'} my-auto overflow-hidden relative border-white/10 bg-zinc-950 shadow-[0_0_80px_rgba(217,70,239,0.15)] flex flex-col md:flex-row h-full max-h-[calc(100vh-2rem)] md:max-h-[85vh] rounded-[28px]`}>
            
            {/* WIZARD OR EDIT HEADER & CONTENT WRAPPER */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              
              {/* MODAL HEADER */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/40">
                <div>
                  <h3 className="text-xl font-black text-white font-outfit tracking-tight flex items-center gap-2">
                    {editingClub ? `Editar ${name || 'Establecimiento'}` : "Registrar tu Local"}
                    {!editingClub && (
                      <span className="bg-primary-500/20 text-primary-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary-500/30 uppercase tracking-widest">
                        Paso {WIZARD_STEPS.findIndex(s => s.id === currentWizardStep) + 1} de 5
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {editingClub 
                      ? "Modifica secciones independientes rápidamente sin perder datos." 
                      : "Configura tu negocio en Hangover como un perfil profesional."}
                  </p>
                </div>
                
                <button
                  onClick={() => !isFormLocked && setIsModalOpen(false)}
                  disabled={isFormLocked}
                  className="w-10 h-10 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* DYNAMIC PROGRESS BAR (Only on Creation) */}
              {!editingClub && (
                <div className="px-6 py-3 border-b border-white/5 bg-zinc-950 flex items-center justify-between shrink-0 overflow-x-auto scrollbar-none gap-4">
                  {WIZARD_STEPS.map((step, idx) => {
                    const stepIdx = WIZARD_STEPS.findIndex(s => s.id === currentWizardStep)
                    const isCompleted = idx < stepIdx
                    const isActive = step.id === currentWizardStep
                    return (
                      <button
                        key={step.id}
                        onClick={() => !isFormLocked && setCurrentWizardStep(step.id)}
                        className="flex items-center gap-2 shrink-0 cursor-pointer disabled:cursor-not-allowed group"
                        disabled={isFormLocked}
                      >
                        <div className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center border transition-all ${
                          isCompleted 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : isActive 
                            ? 'bg-primary-600 border-primary-500 text-white shadow-[0_0_12px_rgba(217,70,239,0.3)]'
                            : 'bg-zinc-900 border-white/10 text-zinc-500 group-hover:text-zinc-350 transition-colors'
                        }`}>
                          {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <span className={`text-xs font-bold font-outfit transition-colors ${
                          isActive ? 'text-primary-300' : isCompleted ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-350'
                        }`}>
                          {step.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* TABS SELECTOR (Only on Editing) */}
              {editingClub && (
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
              )}

              {/* CORE FORM WRAPPER */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent min-h-0">
                {error && (
                  <div className="flex items-center gap-2.5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                    <span className="font-semibold">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                    <span className="font-bold">¡El local se ha configurado exitosamente! Redirigiendo...</span>
                  </div>
                )}

                {/* ========================================================
                    ONBOARDING WIZARD STEPS (CREATION FLOW)
                    ======================================================== */}
                {!editingClub && (
                  <div>
                    {/* STEP 1: GENERAL */}
                    {currentWizardStep === 'general' && (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-wider text-zinc-300 ml-1">Nombre Comercial *</label>
                          <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            disabled={isFormLocked}
                            placeholder="Ej. Hangover Club Cartagena"
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-base text-white placeholder:text-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-wider text-zinc-300 ml-1">Tipo de Local *</label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {['Discoteca', 'Bar', 'Rooftop', 'Lounge', 'Beach Club'].map((type) => {
                              const isSelected = clubType === type
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => handleTypeSelect(type)}
                                  className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer touch-target ${
                                    isSelected 
                                      ? 'bg-primary-600/15 border-primary-500 text-primary-400 shadow-md'
                                      : 'bg-black/40 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
                                  }`}
                                >
                                  <Building2 className={`w-5 h-5 ${isSelected ? 'text-primary-400' : 'text-zinc-500'}`} />
                                  <span className="text-xs font-bold font-outfit">{type}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-zinc-300 ml-1">Ciudad *</label>
                            <input
                              type="text"
                              value={city}
                              onChange={e => setCity(e.target.value)}
                              required
                              disabled={isFormLocked}
                              placeholder="Ej. Cartagena"
                              className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-base text-white placeholder:text-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-zinc-300 ml-1">Dirección Física *</label>
                            <input
                              type="text"
                              value={address}
                              onChange={e => setAddress(e.target.value)}
                              required
                              disabled={isFormLocked}
                              placeholder="Ej. Calle de la Media Luna #12-40"
                              className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-base text-white placeholder:text-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-zinc-300 ml-1">WhatsApp de Reservas</label>
                            <input
                              type="text"
                              value={whatsapp}
                              onChange={e => setWhatsapp(e.target.value)}
                              disabled={isFormLocked}
                              placeholder="Ej. +573120000000"
                              className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-base text-white placeholder:text-zinc-650 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-zinc-300 ml-1">Instagram (@usuario)</label>
                            <input
                              type="text"
                              value={instagram}
                              onChange={e => setInstagram(e.target.value)}
                              disabled={isFormLocked}
                              placeholder="Ej. @hangover_cartagena"
                              className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-base text-white placeholder:text-zinc-650 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-zinc-300 ml-1">Sitio Web</label>
                            <input
                              type="text"
                              value={website}
                              onChange={e => setWebsite(e.target.value)}
                              disabled={isFormLocked}
                              placeholder="Ej. https://hangover.club"
                              className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-base text-white placeholder:text-zinc-650 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-wider text-zinc-300 ml-1">Descripción del Ambiente</label>
                          <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            disabled={isFormLocked}
                            placeholder="Describe el concepto musical, la coctelería y el código de vestimenta..."
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white placeholder:text-zinc-650 focus:outline-none min-h-[120px] resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 2: MULTIMEDIA */}
                    {currentWizardStep === 'multimedia' && (
                      <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Banner upload */}
                          <div className="rounded-3xl border border-white/5 bg-black/30 p-4 space-y-4">
                            <div>
                              <p className="text-sm font-bold text-white font-outfit">Banner Comercial (Página General)</p>
                              <p className="text-[11px] text-zinc-500">Imagen horizontal para el listado del catálogo.</p>
                            </div>

                            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-primary-950/40 to-zinc-950 h-40">
                              {bannerPreviewUrl ? (
                                <img src={bannerPreviewUrl} alt="Preview banner" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-600">
                                  <ImagePlus className="w-8 h-8 animate-pulse" />
                                  <span className="text-xs">Sin banner seleccionado</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <label className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-black text-white cursor-pointer hover:bg-white/10 transition-colors touch-target">
                                <UploadCloud className="w-4 h-4" />
                                <span>Cargar archivo</span>
                                <input type="file" accept="image/*" onChange={handleBannerFileChange} disabled={isFormLocked} className="hidden" />
                              </label>
                              {bannerPreviewUrl && (
                                <button
                                  type="button"
                                  onClick={clearBannerImage}
                                  className="px-4 py-2.5 text-xs font-bold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer touch-target"
                                >
                                  Quitar
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Logo upload */}
                          <div className="rounded-3xl border border-white/5 bg-black/30 p-4 space-y-4">
                            <div>
                              <p className="text-sm font-bold text-white font-outfit">Logo Identitario (Marca Comercial)</p>
                              <p className="text-[11px] text-zinc-500">Imagen cuadrada (1:1) para iconos y accesos rápidos.</p>
                            </div>

                            <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-primary-950/40 to-zinc-950">
                              {logoPreviewUrl ? (
                                <img src={logoPreviewUrl} alt="Preview logo" className="max-h-full max-w-full object-contain rounded-lg p-2" />
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-2 text-zinc-600">
                                  <ImagePlus className="w-8 h-8 animate-pulse" />
                                  <span className="text-xs">Sin logo seleccionado</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <label className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-black text-white cursor-pointer hover:bg-white/10 transition-colors touch-target">
                                <UploadCloud className="w-4 h-4" />
                                <span>Cargar archivo</span>
                                <input type="file" accept="image/*" onChange={handleLogoFileChange} disabled={isFormLocked} className="hidden" />
                              </label>
                              {logoPreviewUrl && (
                                <button
                                  type="button"
                                  onClick={clearLogoImage}
                                  className="px-4 py-2.5 text-xs font-bold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer touch-target"
                                >
                                  Quitar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Visual ports (Hero Image & Video Hero) */}
                        <div className="rounded-3xl border border-white/5 bg-white/5 p-5 space-y-5">
                          <h4 className="text-sm font-bold text-white font-outfit flex items-center gap-1.5 border-b border-white/5 pb-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            Pantalla de Bienvenida VIP (Hero Media)
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase text-zinc-350 ml-1">Imagen Portada Hero (URL)</label>
                              <input
                                type="text"
                                value={heroImage}
                                onChange={e => setHeroImage(e.target.value)}
                                placeholder="Ej. https://images.unsplash.com/photo-..."
                                className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white placeholder:text-zinc-650 focus:outline-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase text-zinc-350 ml-1">Video Portada Hero - Opcional (URL)</label>
                              <input
                                type="text"
                                value={videoHero}
                                onChange={e => setVideoHero(e.target.value)}
                                placeholder="Ej. https://assets.mixkit.co/videos/..."
                                className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white placeholder:text-zinc-650 focus:outline-none"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-500">
                            * Prioridad visual: 1. Video Hero (reproduce en bucle), 2. Imagen Hero, 3. Banner principal. Si no se cargan, se utilizará una portada por defecto.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: OPERATION */}
                    {currentWizardStep === 'operation' && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-zinc-300 ml-1">Capacidad Máxima (Aforo)</label>
                            <input
                              type="number"
                              min="1"
                              value={capacity}
                              onChange={e => setCapacity(parseInt(e.target.value, 10) || 500)}
                              className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-base text-white focus:outline-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-zinc-300 ml-1">Cover Base ($ COP)</label>
                            <input
                              type="number"
                              min="0"
                              value={coverPrice}
                              onChange={e => setCoverPrice(parseFloat(e.target.value) || 0)}
                              className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-base text-white focus:outline-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-zinc-300 ml-1">Rango de Precios</label>
                            <div className="flex gap-2 h-12">
                              {['$', '$$', '$$$'].map((val) => {
                                const isSelected = priceRange === val
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => setPriceRange(val)}
                                    className={`flex-1 rounded-2xl border font-bold text-sm transition-all cursor-pointer touch-target ${
                                      isSelected 
                                        ? 'bg-primary-600/10 border-primary-500 text-primary-400'
                                        : 'bg-black/40 border-white/10 text-zinc-500 hover:text-white'
                                    }`}
                                  >
                                    {val === '$' ? 'Económico ($)' : val === '$$' ? 'Moderado ($$)' : 'Exclusivo ($$$)'}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Apertura & Cierre */}
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-zinc-300 ml-1">Horas de Operación</label>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={openTime}
                                onChange={e => setOpenTime(e.target.value)}
                                placeholder="Ej. 9:00 PM"
                                className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                              />
                              <input
                                type="text"
                                value={closeTime}
                                onChange={e => setCloseTime(e.target.value)}
                                placeholder="Ej. 4:00 AM"
                                className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                              />
                            </div>
                            <span className="text-[10px] text-zinc-500 ml-1 block">Configuración: Apertura / Cierre</span>
                          </div>

                          {/* Métodos de Pago */}
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-zinc-300 ml-1">Métodos de Pago Aceptados</label>
                            <div className="flex flex-wrap gap-2 pt-1">
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
                                    className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer touch-target ${
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

                        {/* GPS GEOLOCATION */}
                        <div className="rounded-3xl border border-white/5 bg-white/5 p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white font-outfit flex items-center gap-1.5">
                              <Map className="w-4 h-4 text-primary-400" />
                              Localización GPS Inteligente
                            </h4>
                            {successSection === 'gps' && (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                                ¡Dirección Encontrada!
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={gpsQuery}
                              onChange={e => setGpsQuery(e.target.value)}
                              placeholder="Busca calle y ciudad (Ej. Calle de la Media Luna, Cartagena)"
                              className="flex-1 bg-black/60 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleSearchAddress}
                              disabled={isSearchingGps}
                              className="bg-primary-600 hover:bg-primary-500 text-white rounded-2xl px-5 py-3 text-sm font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50 touch-target"
                            >
                              {isSearchingGps ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                            </button>
                          </div>
                          
                          {gpsError && <p className="text-[11px] text-red-400 ml-1 font-semibold">{gpsError}</p>}

                          {/* Coordinates drawers */}
                          <div className="border-t border-white/5 pt-3">
                            <button
                              type="button"
                              onClick={() => setShowAdvancedGps(!showAdvancedGps)}
                              className="text-xs text-zinc-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors uppercase tracking-wider"
                            >
                              {showAdvancedGps ? "▼ Ocultar" : "▶ Mostrar"} Configuración Avanzada de Coordenadas
                            </button>
                            
                            {showAdvancedGps && (
                              <div className="grid grid-cols-2 gap-4 mt-3 p-3 bg-black/40 border border-white/5 rounded-2xl animate-fadeIn">
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 ml-1">Latitud</label>
                                  <input
                                    type="number"
                                    step="0.000001"
                                    value={latitude === null ? "" : latitude}
                                    onChange={e => setLatitude(parseFloat(e.target.value) || null)}
                                    placeholder="Ej. 10.4229"
                                    className="w-full bg-black/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 ml-1">Longitud</label>
                                  <input
                                    type="number"
                                    step="0.000001"
                                    value={longitude === null ? "" : longitude}
                                    onChange={e => setLongitude(parseFloat(e.target.value) || null)}
                                    placeholder="Ej. -75.5472"
                                    className="w-full bg-black/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: MODULES */}
                    {currentWizardStep === 'modules' && (
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-zinc-200 font-outfit">Selección de Módulos Operativos</h4>
                          <p className="text-xs text-zinc-500">Determina las herramientas que ofrecerá este establecimiento a sus clientes.</p>
                        </div>

                        {/* Recommended */}
                        <div className="space-y-3">
                          <h5 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 border-b border-white/5 pb-1 ml-1">
                            Módulos Recomendados ({clubType})
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer touch-target ${
                                    isChecked 
                                      ? 'bg-primary-600/10 border-primary-500 text-white shadow-sm'
                                      : 'bg-black/30 border-white/5 text-zinc-400 hover:border-white/10'
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border mt-0.5 ${
                                    isChecked ? 'bg-primary-600 border-primary-400 text-white' : 'border-white/20 bg-black/40'
                                  }`}>
                                    {isChecked && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-white font-outfit leading-tight">{mod.label}</p>
                                    <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{mod.description}</p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Advanced */}
                        <div className="space-y-3">
                          <h5 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 border-b border-white/5 pb-1 ml-1">
                            Módulos Avanzados (Escala en Hangover)
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer touch-target ${
                                    isChecked 
                                      ? 'bg-primary-600/10 border-primary-500 text-white shadow-sm'
                                      : 'bg-black/30 border-white/5 text-zinc-400 hover:border-white/10'
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border mt-0.5 ${
                                    isChecked ? 'bg-primary-600 border-primary-400 text-white' : 'border-white/20 bg-black/40'
                                  }`}>
                                    {isChecked && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-white font-outfit leading-tight">{mod.label}</p>
                                    <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{mod.description}</p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 5: PREVIEW AND PUBLISHING CHECKLIST */}
                    {currentWizardStep === 'preview' && (
                      <div className="space-y-6">
                        {/* Checklist Section */}
                        <div className="rounded-3xl border border-white/5 bg-white/5 p-5 space-y-4">
                          <h4 className="text-sm font-bold text-white font-outfit flex items-center gap-1.5 border-b border-white/5 pb-2">
                            <Shield className="w-4.5 h-4.5 text-emerald-400" />
                            Chequeo Mínimo de Publicación
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              { label: "Nombre Comercial", valid: !!name.trim() },
                              { label: "Logo del local", valid: !!logoPreviewUrl || !!logo },
                              { label: "Banner del local", valid: !!bannerPreviewUrl || !!bannerImage },
                              { label: "Dirección física", valid: !!address.trim() },
                              { label: "Horarios de operación", valid: !!openTime.trim() || !!closeTime.trim() }
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                                  item.valid 
                                    ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' 
                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}>
                                  {item.valid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                </div>
                                <span className={item.valid ? 'text-zinc-300 font-medium' : 'text-zinc-500 font-semibold'}>
                                  {item.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Completion guidelines recommendations */}
                        {getProfileCompletion().missing.length > 0 && (
                          <div className="p-4 bg-primary-600/10 border border-primary-500/20 rounded-2xl">
                            <p className="text-xs font-bold text-primary-400 font-outfit flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                              Recomendaciones para llegar al 100%:
                            </p>
                            <ul className="text-[11px] text-zinc-400 mt-2 space-y-1 list-disc list-inside">
                              {getProfileCompletion().missing.slice(0, 3).map((item, idx) => (
                                <li key={idx}>{item.action}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* CTA Publication controls */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => handleWizardSubmit(false)}
                            disabled={isFormLocked}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-2xl py-3 px-4 font-bold text-xs uppercase tracking-wider transition-all border border-white/10 cursor-pointer text-center touch-target"
                          >
                            Guardar como Borrador
                          </button>

                          <button
                            type="button"
                            onClick={() => handleWizardSubmit(true)}
                            disabled={isFormLocked || getPublishValidationErrors().length > 0}
                            className={`flex-[2] text-white rounded-2xl py-3 px-4 font-black text-xs uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5 touch-target ${
                              getPublishValidationErrors().length > 0
                                ? 'bg-zinc-800 border border-white/5 text-zinc-500 cursor-not-allowed'
                                : 'bg-primary-600 hover:bg-primary-500 shadow-md shadow-primary-500/10 cursor-pointer'
                            }`}
                          >
                            {isUploadingAssets ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                            <span>Enviar a Revisión</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step buttons */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          const idx = WIZARD_STEPS.findIndex(s => s.id === currentWizardStep)
                          if (idx > 0) setCurrentWizardStep(WIZARD_STEPS[idx - 1].id)
                        }}
                        disabled={currentWizardStep === WIZARD_STEPS[0].id || isFormLocked}
                        className="bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 rounded-xl py-2 px-4 text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" /> Atrás
                      </button>

                      {currentWizardStep !== WIZARD_STEPS[WIZARD_STEPS.length - 1].id ? (
                        <button
                          type="button"
                          onClick={() => {
                            const idx = WIZARD_STEPS.findIndex(s => s.id === currentWizardStep)
                            if (idx < WIZARD_STEPS.length - 1) setCurrentWizardStep(WIZARD_STEPS[idx + 1].id)
                          }}
                          className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2 px-5 text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                        >
                          Siguiente <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================
                    MODULAR TABBED EDITOR (EDIT FLOW)
                    ======================================================== */}
                {editingClub && (
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
                )}
              </div>
            </div>

            {/* LIVE PREVIEW AND COMPLETENESS SIDEBAR (Right pane - Hidden on Mobile unless Wizard Preview) */}
            <div className={`w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 bg-zinc-950/60 p-6 flex flex-col justify-between shrink-0 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent max-h-[40vh] md:max-h-none ${
              !editingClub || currentWizardStep === 'preview' ? 'flex' : 'hidden md:flex'
            }`}>
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

      {deletingClubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="glass-card max-w-sm w-full p-6 text-center border-red-500/20 bg-zinc-950 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-outfit">¿Archivar discoteca?</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Esta acción no se puede deshacer de forma directa. Se archivará permanentemente y dejará de ser visible para los clientes.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingClubId(null)}
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
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sí, Archivar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMenuClub && (
        <ClubMenuServicesManager
          club={selectedMenuClub}
          isOpen={isMenuManagerOpen}
          onClose={() => {
            setIsMenuManagerOpen(false);
            setSelectedMenuClub(null);
          }}
        />
      )}
    </div>
  )
}
