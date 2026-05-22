'use client'

import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, Building2, MapPin, Star, Clock, X, Loader2, AlertTriangle, CheckCircle2, Eye, EyeOff } from "lucide-react";

// Local SVG icon to avoid version mismatch in lucide-react
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
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
import { createClub, updateClub, deleteClub } from "./actions";

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
  created_at: string;
}

interface ClubsManagerProps {
  clubs: Club[];
}

export function ClubsManager({ clubs }: ClubsManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [logo, setLogo] = useState("");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [rating, setRating] = useState(5.0);
  const [active, setActive] = useState(true);

  // Actions states
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Delete modal state
  const [deletingClubId, setDeletingClubId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingClub(null);
    setName("");
    setCity("");
    setDescription("");
    setBannerImage("");
    setLogo("");
    setAddress("");
    setInstagram("");
    setOpeningHours("");
    setRating(5.0);
    setActive(true);
    setError(null);
    setSuccess(false);
    setIsModalOpen(true);
  };

  const openEditModal = (club: Club) => {
    setEditingClub(club);
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
    setError(null);
    setSuccess(false);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    const payload = {
      name: name.trim(),
      city: city.trim(),
      description: description.trim() || null,
      banner_image: bannerImage.trim() || null,
      logo: logo.trim() || null,
      address: address.trim() || null,
      instagram: instagram.trim() || null,
      opening_hours: openingHours.trim() || null,
      rating: Number(rating) || 5.0,
      active
    };

    startTransition(async () => {
      let result;
      if (editingClub) {
        result = await updateClub(editingClub.id, payload);
      } else {
        result = await createClub(payload);
      }

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess(false);
        }, 1500);
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingClubId) return;
    setError(null);

    startTransition(async () => {
      const result = await deleteClub(deletingClubId);
      if (result.error) {
        setError(result.error);
        alert(result.error);
      }
      setDeletingClubId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header section with Create Button */}
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

      {/* Clubs Grid */}
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
          {clubs.map((club) => (
            <div 
              key={club.id} 
              className="glass-card overflow-hidden hover:border-white/20 transition-all flex flex-col justify-between h-full group"
            >
              {/* Header Banner Image */}
              <div className="relative h-44 w-full bg-zinc-950 flex-shrink-0">
                {club.banner_image ? (
                  <img
                    src={club.banner_image}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-primary-950 via-zinc-900 to-accent-950 flex items-center justify-center opacity-40">
                    <Building2 className="w-12 h-12 text-white/20" />
                  </div>
                )}
                
                {/* Logo overlay */}
                {club.logo && (
                  <div className="absolute bottom-4 left-4 w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden shadow-lg p-0.5">
                    <img src={club.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                  </div>
                )}

                {/* Rating Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-xs font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{Number(club.rating || 0).toFixed(1)}</span>
                </div>

                {/* Status Badge */}
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

              {/* Club Info Details */}
              <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-accent-400" /> {club.city}</span>
                    {club.instagram && <span className="flex items-center gap-1 text-primary-400"><Instagram className="w-3 h-3" /> {club.instagram}</span>}
                  </div>
                  
                  <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors font-outfit line-clamp-1">
                    {club.name}
                  </h3>
                  {club.address && (
                    <p className="text-xs text-zinc-500 truncate">{club.address}</p>
                  )}
                  
                  <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 min-h-[48px]">
                    {club.description || "Sin descripción proporcionada."}
                  </p>

                  {club.opening_hours && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-white/5 py-1.5 px-3 rounded-lg border border-white/5 mt-2">
                      <Clock className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                      <span className="truncate">{club.opening_hours}</span>
                    </div>
                  )}
                </div>

                {/* Edit / Delete Actions */}
                <div className="flex items-center gap-3 pt-3 border-t border-white/5 mt-3">
                  <button
                    onClick={() => openEditModal(club)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl py-2.5 px-3 text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => setDeletingClubId(club.id)}
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-lg my-8 overflow-hidden relative border-white/10 bg-zinc-950 shadow-[0_0_50px_var(--color-primary-500)/10]">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-outfit">
                  {editingClub ? "Editar Discoteca" : "Registrar Discoteca"}
                </h3>
                <p className="text-xs text-zinc-400">Rellena los detalles de la discoteca.</p>
              </div>
              <button
                onClick={() => !isPending && setIsModalOpen(false)}
                disabled={isPending}
                className="text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-none">
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

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Nombre de la Discoteca *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isPending || success}
                    placeholder="Ej. Pacha Ibiza"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Ciudad *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    disabled={isPending || success}
                    placeholder="Ej. Ibiza"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>

                {/* Rating */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Calificación Inicial (0.0 - 5.0)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={rating}
                    onChange={(e) => setRating(parseFloat(e.target.value) || 5.0)}
                    disabled={isPending || success}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>

                {/* Banner Image URL */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">URL de Imagen de Banner</label>
                  <input
                    type="url"
                    value={bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                    disabled={isPending || success}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>

                {/* Logo URL */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">URL de Logo</label>
                  <input
                    type="url"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    disabled={isPending || success}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Dirección Física</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isPending || success}
                    placeholder="Ej. Av. 8 de Agosto, Local 12"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>

                {/* Instagram Handle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Instagram (@usuario)</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    disabled={isPending || success}
                    placeholder="@opium_barcelona"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>

                {/* Opening Hours */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Horario de Apertura</label>
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    disabled={isPending || success}
                    placeholder="Ej. Jueves a Sábados 10PM - 6AM"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isPending || success}
                    placeholder="Describe el ambiente, la música y los servicios VIP de tu discoteca..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 min-h-[90px] resize-none"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-3 py-2 px-1 sm:col-span-2">
                  <input
                    id="club-active"
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    disabled={isPending || success}
                    className="w-4 h-4 rounded border-white/10 bg-black/60 accent-primary-500 text-primary-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="club-active" className="text-xs font-medium text-zinc-300 cursor-pointer select-none">
                    Marcar como activa (visible en el marketplace general)
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              {!success && (
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    editingClub ? "Guardar Cambios" : "Crear Discoteca"
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
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
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Sí, Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
