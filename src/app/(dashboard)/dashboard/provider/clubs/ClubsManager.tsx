"use client"

import { useState } from "react"
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
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createClub, updateClub, deleteClub } from "./actions"
import { ClubMenuServicesManager } from "./ClubMenuServicesManager"

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
  opening_hours: string | null
  rating: number
  active: boolean
  cover_price: number | null
  created_at: string
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

// Subimos las imágenes al bucket "avatars" con subcarpetas ("clubs/banners" o "clubs/logos")
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
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [description, setDescription] = useState("")
  const [bannerImage, setBannerImage] = useState("")
  const [logo, setLogo] = useState("")
  const [address, setAddress] = useState("")
  const [instagram, setInstagram] = useState("")
  const [openingHours, setOpeningHours] = useState("")
  const [rating, setRating] = useState(5.0)
  const [active, setActive] = useState(true)
  const [coverPrice, setCoverPrice] = useState(0.00)

  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [bannerAssetFile, setBannerAssetFile] = useState<File | null>(null)
  const [logoAssetFile, setLogoAssetFile] = useState<File | null>(null)

  const [isPending, setIsPending] = useState(false)
  const [isUploadingAssets, setIsUploadingAssets] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
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
    setOpeningHours("")
    setRating(5.0)
    setActive(true)
    setCoverPrice(0.00)
    setEditingClub(null)
    cleanupBlobUrl(bannerPreviewUrl)
    cleanupBlobUrl(logoPreviewUrl)
    setBannerPreviewUrl(null)
    setLogoPreviewUrl(null)
    setBannerAssetFile(null)
    setLogoAssetFile(null)
    setError(null)
    setSuccess(false)
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
    setOpeningHours(club.opening_hours || "")
    setRating(club.rating || 5.0)
    setActive(club.active ?? true)
    setCoverPrice(club.cover_price || 0.00)
    setBannerPreviewUrl(club.banner_image || null)
    setLogoPreviewUrl(club.logo || null)
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

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    if (!name.trim()) {
      setError("El nombre de la discoteca es obligatorio.")
      return
    }

    if (!city.trim()) {
      setError("La ciudad es obligatoria.")
      return
    }

    setIsUploadingAssets(true)

    try {
      const uploadedBannerUrl = bannerAssetFile ? await uploadClubAsset(bannerAssetFile, "banners") : bannerImage || null
      const uploadedLogoUrl = logoAssetFile ? await uploadClubAsset(logoAssetFile, "logos") : logo || null

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
      }

      // Direct await — startTransition(async()=>) does NOT properly await
      // async server actions; the result would be silently lost.
      const result = editingClub
        ? await updateClub(editingClub.id, payload)
        : await createClub(payload)

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
      setError(uploadError?.message || "No se pudo subir una o más imágenes.")
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
                      <Eye className="w-3.5 h-3.5" /> Activa
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-zinc-400">
                      <EyeOff className="w-3.5 h-3.5" /> Inactiva
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
                  <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 min-h-[48px]">
                    {club.description || "Sin descripción proporcionada."}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-2xl my-8 overflow-hidden relative border-white/10 bg-zinc-950 shadow-[0_0_50px_var(--color-primary-500)/10]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-outfit">
                  {editingClub ? "Editar Discoteca" : "Registrar Discoteca"}
                </h3>
                <p className="text-xs text-zinc-400">Sube imágenes reales y prevéalas antes de guardar.</p>
              </div>
              <button
                onClick={() => !isFormLocked && setIsModalOpen(false)}
                disabled={isFormLocked}
                className="text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-none">
              {error && (
                <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{editingClub ? "¡Discoteca actualizada!" : "¡Discoteca creada con éxito!"}</span>
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
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
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
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
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
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
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
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
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
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
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
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
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
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Descripción</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={isFormLocked}
                    placeholder="Describe el ambiente, la música y los servicios VIP de tu discoteca..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 min-h-[110px] resize-none"
                  />
                </div>

                <div className="space-y-3 sm:col-span-2 rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Imágenes reales de tu club</p>
                      <p className="text-xs text-zinc-400 mt-1">JPG, PNG, WEBP o GIF · máx. 3MB · bucket: avatars (clubs/banners, clubs/logos).</p>
                    </div>
                    <div className="rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-200">
                      Premium
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[20px] border border-white/10 bg-black/30 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-zinc-300">Banner</p>
                          <p className="text-[11px] text-zinc-500">Ideal para destacar tu cabecera.</p>
                        </div>
                        <div className="rounded-full bg-primary-500/10 px-2 py-1 text-[10px] text-primary-200">
                          avatars/clubs/banners
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-gradient-to-br from-primary-950/80 to-zinc-950 min-h-[160px]">
                        {bannerPreviewUrl ? (
                          <img src={bannerPreviewUrl} alt="Preview del banner" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-500">
                            <ImagePlus className="w-8 h-8" />
                            <span className="text-xs">Selecciona un banner para previsualizarlo</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-white/10 transition-colors">
                          <UploadCloud className="w-3.5 h-3.5" />
                          Subir banner
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerFileChange}
                            disabled={isFormLocked}
                            className="hidden"
                          />
                        </label>
                        {bannerPreviewUrl && (
                          <button
                            type="button"
                            onClick={clearBannerImage}
                            disabled={isFormLocked}
                            className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/10 bg-black/30 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-zinc-300">Logo</p>
                          <p className="text-[11px] text-zinc-500">Ideal para identidad visual del club.</p>
                        </div>
                        <div className="rounded-full bg-primary-500/10 px-2 py-1 text-[10px] text-primary-200">
                          avatars/clubs/logos
                        </div>
                      </div>

                      <div className="flex h-[160px] items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-gradient-to-br from-primary-950/80 to-zinc-950">
                        {logoPreviewUrl ? (
                          <img src={logoPreviewUrl} alt="Preview del logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                            <ImagePlus className="w-8 h-8" />
                            <span className="text-xs">Selecciona un logo para previsualizarlo</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-white/10 transition-colors">
                          <UploadCloud className="w-3.5 h-3.5" />
                          Subir logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoFileChange}
                            disabled={isFormLocked}
                            className="hidden"
                          />
                        </label>
                        {logoPreviewUrl && (
                          <button
                            type="button"
                            onClick={clearLogoImage}
                            disabled={isFormLocked}
                            className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
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
                <button
                  type="submit"
                  disabled={isFormLocked}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
                >
                  {isUploadingAssets || isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : editingClub ? (
                    "Guardar Cambios"
                  ) : (
                    "Crear Discoteca"
                  )}
                </button>
              )}
            </form>
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
              <h3 className="text-lg font-bold text-white font-outfit">¿Eliminar discoteca?</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Esta acción no se puede deshacer. Se eliminarán permanentemente todos los datos de la discoteca de la plataforma.
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
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sí, Eliminar"}
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
