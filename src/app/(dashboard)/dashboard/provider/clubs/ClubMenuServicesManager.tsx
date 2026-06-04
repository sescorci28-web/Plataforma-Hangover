"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  ImagePlus,
  Layers,
  DollarSign,
  Eye,
  EyeOff,
  Wine,
  Settings2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createClubService,
  updateClubService,
  deleteClubService,
} from "./actions";

interface Club {
  id: string;
  name: string;
  logo: string | null;
  banner_image: string | null;
}

interface ClubMenuServicesManagerProps {
  club: Club;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  active: boolean;
  featured: boolean;
  available: boolean;
}

interface ClubService {
  id: string;
  name: string;
  description: string;
  price: number | null;
  active: boolean;
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

async function uploadMenuAsset(file: File) {
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
  const filePath = `${user.id}/clubs/menu/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${cleanName || "asset"}.${fileExt}`;

  const { error } = await supabase.storage.from("avatars").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message || "No fue posible subir la imagen.");
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return data.publicUrl;
}

export function ClubMenuServicesManager({ club, isOpen, onClose }: ClubMenuServicesManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"menu" | "services">("menu");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [services, setServices] = useState<ClubService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for Menu Items
  const [isMenuFormOpen, setIsMenuFormOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Whisky");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemActive, setItemActive] = useState(true);
  const [itemFeatured, setItemFeatured] = useState(false);
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemPreviewUrl, setItemPreviewUrl] = useState<string | null>(null);
  const [itemAssetFile, setItemAssetFile] = useState<File | null>(null);

  // Form states for Services
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<ClubService | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceActive, setServiceActive] = useState(true);

  // Pending transitions
  const [isPending, startTransition] = useTransition();

  const fetchItemsAndServices = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const [menuRes, servicesRes] = await Promise.all([
        supabase.from("club_menu_items").select("*").eq("club_id", club.id).order("created_at", { ascending: false }),
        supabase.from("club_services").select("*").eq("club_id", club.id).order("created_at", { ascending: false }),
      ]);

      if (menuRes.error) throw new Error(menuRes.error.message);
      if (servicesRes.error) throw new Error(servicesRes.error.message);

      setMenuItems(menuRes.data || []);
      setServices(servicesRes.data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItemsAndServices();
    }
  }, [isOpen, club.id]);

  const showNotification = (message: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 4000);
    }
  };

  // Clean local URLs
  const cleanupBlobUrl = (url: string | null) => {
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  const resetMenuForm = () => {
    setEditingMenuItem(null);
    setItemName("");
    setItemCategory("Whisky");
    setItemDescription("");
    setItemPrice("");
    setItemImageUrl("");
    setItemActive(true);
    setItemFeatured(false);
    setItemAvailable(true);
    cleanupBlobUrl(itemPreviewUrl);
    setItemPreviewUrl(null);
    setItemAssetFile(null);
    setIsMenuFormOpen(false);
  };

  const resetServiceForm = () => {
    setEditingService(null);
    setServiceName("");
    setServiceDescription("");
    setServicePrice("");
    setServiceActive(true);
    setIsServiceFormOpen(false);
  };

  // Image handler
  const handleItemImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      e.target.value = "";
      return;
    }

    setError(null);
    cleanupBlobUrl(itemPreviewUrl);
    setItemAssetFile(file);
    setItemPreviewUrl(URL.createObjectURL(file));
  };

  // CRUD Product Submit
  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice.trim()) {
      showNotification("El nombre y el precio son obligatorios.", "error");
      return;
    }

    startTransition(async () => {
      try {
        let uploadedUrl = itemImageUrl;
        if (itemAssetFile) {
          uploadedUrl = await uploadMenuAsset(itemAssetFile);
        }

        const payload = {
          club_id: club.id,
          category: itemCategory,
          name: itemName.trim(),
          description: itemDescription.trim() || null,
          price: parseFloat(itemPrice) || 0,
          image_url: uploadedUrl || null,
          active: itemActive,
          featured: itemFeatured,
          available: itemAvailable
        };

        const res = editingMenuItem
          ? await updateMenuItem(editingMenuItem.id, payload)
          : await createMenuItem(payload);

        if (res.error) {
          showNotification(res.error, "error");
        } else {
          showNotification(
            editingMenuItem ? "Producto actualizado con éxito." : "Producto agregado con éxito.",
            "success"
          );
          resetMenuForm();
          fetchItemsAndServices();
          router.refresh();
        }
      } catch (err: any) {
        showNotification(err.message || "Error al subir la imagen del producto.", "error");
      }
    });
  };

  // CRUD Service Submit
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || !serviceDescription.trim()) {
      showNotification("El nombre y la descripción son obligatorios.", "error");
      return;
    }

    startTransition(async () => {
      const payload = {
        club_id: club.id,
        name: serviceName.trim(),
        description: serviceDescription.trim(),
        price: servicePrice.trim() ? parseFloat(servicePrice) : null,
        active: serviceActive,
      };

      const res = editingService
        ? await updateClubService(editingService.id, payload)
        : await createClubService(payload);

      if (res.error) {
        showNotification(res.error, "error");
      } else {
        showNotification(
          editingService ? "Servicio actualizado con éxito." : "Servicio agregado con éxito.",
          "success"
        );
        resetServiceForm();
        fetchItemsAndServices();
        router.refresh();
      }
    });
  };

  // Delete handlers
  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto del menú?")) return;
    const res = await deleteMenuItem(id);
    if (res.error) {
      showNotification(res.error, "error");
    } else {
      showNotification("Producto eliminado correctamente.", "success");
      fetchItemsAndServices();
      router.refresh();
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este servicio del club?")) return;
    const res = await deleteClubService(id);
    if (res.error) {
      showNotification(res.error, "error");
    } else {
      showNotification("Servicio eliminado correctamente.", "success");
      fetchItemsAndServices();
      router.refresh();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card w-full max-w-4xl my-8 overflow-hidden relative border-white/10 bg-zinc-950 shadow-[0_0_50px_rgba(217,70,239,0.15)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
              <span>{club.name}</span>
              <span className="text-zinc-500 font-normal text-sm">| Gestión de Carta y Servicios</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Configura la carta de productos y los servicios ofrecidos en esta discoteca.</p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-black/40 border-b border-white/5 p-1 shrink-0 gap-2 px-6">
          <button
            onClick={() => {
              setActiveTab("menu");
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${
              activeTab === "menu"
                ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <Wine className="w-4 h-4" />
            Carta / Menú
          </button>
          <button
            onClick={() => {
              setActiveTab("services");
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${
              activeTab === "services"
                ? "bg-accent-600 text-white shadow-lg shadow-accent-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <Settings2 className="w-4 h-4" />
            Servicios
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 space-y-2">
              <Loader2 className="w-10 h-10 animate-spin text-primary-400 mx-auto" />
              <p className="text-sm text-zinc-400 font-medium">Cargando catálogo...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "menu" ? (
                <motion.div
                  key="menu-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Productos en Carta ({menuItems.length})</h4>
                    {!isMenuFormOpen && (
                      <button
                        onClick={() => {
                          resetMenuForm();
                          setIsMenuFormOpen(true);
                        }}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar Producto
                      </button>
                    )}
                  </div>

                  {/* Menu Form */}
                  {isMenuFormOpen && (
                    <div className="glass-card p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                          {editingMenuItem ? "Editar Producto" : "Nuevo Producto"}
                        </h5>
                        <button
                          onClick={resetMenuForm}
                          className="text-zinc-400 hover:text-white text-xs"
                        >
                          Cancelar
                        </button>
                      </div>

                      <form onSubmit={handleMenuSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-zinc-400 ml-1">Nombre *</label>
                            <input
                              type="text"
                              value={itemName}
                              onChange={(e) => setItemName(e.target.value)}
                              required
                              disabled={isPending}
                              placeholder="Ej. Botella de Ron Centenario"
                              className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-zinc-400 ml-1">Categoría *</label>
                            <select
                              value={itemCategory}
                              onChange={(e) => setItemCategory(e.target.value)}
                              required
                              disabled={isPending}
                              className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                            >
                              <option value="Whisky">Whisky</option>
                              <option value="Vodka">Vodka</option>
                              <option value="Ron">Ron</option>
                              <option value="Tequila">Tequila</option>
                              <option value="Cerveza">Cerveza</option>
                              <option value="Cócteles">Cócteles</option>
                              <option value="Hookahs">Hookahs</option>
                              <option value="Comida">Comida</option>
                              <option value="Combos">Combos</option>
                              <option value="Otros">Otros</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-zinc-400 ml-1">Precio ($ COP) *</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={itemPrice}
                              onChange={(e) => setItemPrice(e.target.value)}
                              required
                              disabled={isPending}
                              placeholder="Ej. 120000"
                              className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-zinc-400 ml-1">Visibilidad</label>
                            <div className="flex items-center gap-2 h-9 pl-1">
                              <input
                                id="item-active"
                                type="checkbox"
                                checked={itemActive}
                                onChange={(e) => setItemActive(e.target.checked)}
                                disabled={isPending}
                                className="w-4 h-4 rounded border-white/10 bg-black/60 accent-primary-500 cursor-pointer"
                              />
                              <label htmlFor="item-active" className="text-xs text-zinc-300 cursor-pointer select-none">
                                Producto activo en carta
                              </label>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-zinc-400 ml-1">Destacado</label>
                            <div className="flex items-center gap-2 h-9 pl-1">
                              <input
                                id="item-featured"
                                type="checkbox"
                                checked={itemFeatured}
                                onChange={(e) => setItemFeatured(e.target.checked)}
                                disabled={isPending}
                                className="w-4 h-4 rounded border-white/10 bg-black/60 accent-primary-500 cursor-pointer"
                              />
                              <label htmlFor="item-featured" className="text-xs text-zinc-300 cursor-pointer select-none font-medium text-amber-300 flex items-center gap-1">
                                🔥 Más vendido / Destacado
                              </label>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-zinc-400 ml-1">Disponibilidad</label>
                            <div className="flex items-center gap-2 h-9 pl-1">
                              <input
                                id="item-available"
                                type="checkbox"
                                checked={itemAvailable}
                                onChange={(e) => setItemAvailable(e.target.checked)}
                                disabled={isPending}
                                className="w-4 h-4 rounded border-white/10 bg-black/60 accent-primary-500 cursor-pointer"
                              />
                              <label htmlFor="item-available" className="text-xs text-zinc-300 cursor-pointer select-none">
                                Disponible para la venta
                              </label>
                            </div>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[11px] font-semibold text-zinc-400 ml-1">Descripción del producto</label>
                            <textarea
                              value={itemDescription}
                              onChange={(e) => setItemDescription(e.target.value)}
                              disabled={isPending}
                              placeholder="Detalles sobre presentación, onzas, acompañamientos..."
                              className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 min-h-[60px] resize-none"
                            />
                          </div>

                          {/* Image upload preview */}
                          <div className="sm:col-span-2 space-y-2 border border-white/5 bg-black/20 p-3 rounded-xl">
                            <p className="text-[11px] font-semibold text-zinc-400">Imagen del producto</p>
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                              <div className="w-20 h-20 rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                                {itemPreviewUrl ? (
                                  <img src={itemPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                  <ImagePlus className="w-6 h-6 text-zinc-600" />
                                )}
                              </div>
                              <div className="flex-grow space-y-1">
                                <label className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-white/10 transition-colors">
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  Seleccionar foto
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleItemImageChange}
                                    disabled={isPending}
                                    className="hidden"
                                  />
                                </label>
                                <p className="text-[10px] text-zinc-500">Formato JPG, PNG o WEBP. Máximo 3MB.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isPending}
                          className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 px-4 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 glow cursor-pointer disabled:opacity-50"
                        >
                          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingMenuItem ? "Guardar Cambios" : "Agregar Producto"}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Products List */}
                  {menuItems.length === 0 ? (
                    <div className="text-center py-12 border border-white/5 bg-black/20 rounded-2xl">
                      <Wine className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400">No hay productos en el menú de esta discoteca.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {menuItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-black/40 rounded-2xl border border-white/5 flex gap-4 items-center justify-between"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-16 h-16 rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shrink-0">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                                  <Wine className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-bold text-white text-sm truncate font-outfit">{item.name}</h5>
                                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] text-zinc-400 font-semibold">
                                  {item.category}
                                </span>
                                {item.featured && (
                                  <span className="text-[9px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                                    🔥 Destacado
                                  </span>
                                )}
                                {item.available ? (
                                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                                    ✓ Disponible
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                                    🚫 Agotado
                                  </span>
                                )}
                                {item.active ? (
                                  <span className="text-[9px] text-zinc-300 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> Visible</span>
                                ) : (
                                  <span className="text-[9px] text-zinc-600 bg-black/40 border border-white/5 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5"><EyeOff className="w-2.5 h-2.5" /> Oculto</span>
                                )}
                              </div>
                              {item.description && <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{item.description}</p>}
                              <p className="text-xs font-semibold text-emerald-400 mt-1">${item.price.toLocaleString("es-CO")}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                resetMenuForm();
                                setEditingMenuItem(item);
                                setItemName(item.name);
                                setItemCategory(item.category);
                                setItemDescription(item.description || "");
                                setItemPrice(item.price.toString());
                                setItemImageUrl(item.image_url || "");
                                setItemActive(item.active);
                                setItemFeatured(item.featured || false);
                                setItemAvailable(item.available ?? true);
                                setItemPreviewUrl(item.image_url);
                                setIsMenuFormOpen(true);
                              }}
                              className="w-7 h-7 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMenuItem(item.id)}
                              className="w-7 h-7 bg-red-500/10 border border-red-500/10 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="services-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Servicios Ofrecidos ({services.length})</h4>
                    {!isServiceFormOpen && (
                      <button
                        onClick={() => {
                          resetServiceForm();
                          setIsServiceFormOpen(true);
                        }}
                        className="bg-accent-600 hover:bg-accent-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar Servicio
                      </button>
                    )}
                  </div>

                  {/* Service Form */}
                  {isServiceFormOpen && (
                    <div className="glass-card p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                          {editingService ? "Editar Servicio" : "Nuevo Servicio"}
                        </h5>
                        <button
                          onClick={resetServiceForm}
                          className="text-zinc-400 hover:text-white text-xs"
                        >
                          Cancelar
                        </button>
                      </div>

                      <form onSubmit={handleServiceSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[11px] font-semibold text-zinc-400 ml-1">Nombre del servicio *</label>
                            <input
                              type="text"
                              value={serviceName}
                              onChange={(e) => setServiceName(e.target.value)}
                              required
                              disabled={isPending}
                              placeholder="Ej. Parqueadero Privado Vigilado, Mesa VIP Platino"
                              className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-zinc-400 ml-1">Precio ($ COP, dejar en blanco si va incluido)</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={servicePrice}
                              onChange={(e) => setServicePrice(e.target.value)}
                              disabled={isPending}
                              placeholder="Ej. 15000"
                              className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-zinc-400 ml-1">Visibilidad</label>
                            <div className="flex items-center gap-2 h-9 pl-1">
                              <input
                                id="service-active"
                                type="checkbox"
                                checked={serviceActive}
                                onChange={(e) => setServiceActive(e.target.checked)}
                                disabled={isPending}
                                className="w-4 h-4 rounded border-white/10 bg-black/60 accent-accent-500 cursor-pointer"
                              />
                              <label htmlFor="service-active" className="text-xs text-zinc-300 cursor-pointer select-none">
                                Servicio activo y visible
                              </label>
                            </div>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[11px] font-semibold text-zinc-400 ml-1">Descripción del servicio *</label>
                            <textarea
                              value={serviceDescription}
                              onChange={(e) => setServiceDescription(e.target.value)}
                              required
                              disabled={isPending}
                              placeholder="Explica qué incluye este servicio o bajo qué condiciones se presta..."
                              className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 min-h-[70px] resize-none"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isPending}
                          className="w-full bg-accent-600 hover:bg-accent-500 text-white rounded-xl py-2.5 px-4 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 glow cursor-pointer disabled:opacity-50"
                        >
                          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingService ? "Guardar Cambios" : "Agregar Servicio"}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Services List */}
                  {services.length === 0 ? (
                    <div className="text-center py-12 border border-white/5 bg-black/20 rounded-2xl">
                      <Settings2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400">No hay servicios registrados en esta discoteca.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="p-4 bg-black/40 rounded-2xl border border-white/5 flex gap-4 items-center justify-between"
                        >
                          <div className="min-w-0 flex-grow">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-white text-sm font-outfit">{service.name}</h5>
                              {service.active ? (
                                <span className="text-[9px] text-emerald-400 flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> Activo</span>
                              ) : (
                                <span className="text-[9px] text-zinc-500 flex items-center gap-0.5"><EyeOff className="w-2.5 h-2.5" /> Inactivo</span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{service.description}</p>
                            <p className="text-xs font-semibold text-accent-400 mt-1.5">
                              {service.price && Number(service.price) > 0
                                ? `$${Number(service.price).toLocaleString("es-CO")} COP`
                                : "Incluido en el Cover"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-center">
                            <button
                              onClick={() => {
                                resetServiceForm();
                                setEditingService(service);
                                setServiceName(service.name);
                                setServiceDescription(service.description);
                                setServicePrice(service.price ? service.price.toString() : "");
                                setServiceActive(service.active);
                                setIsServiceFormOpen(true);
                              }}
                              className="w-7 h-7 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="w-7 h-7 bg-red-500/10 border border-red-500/10 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

