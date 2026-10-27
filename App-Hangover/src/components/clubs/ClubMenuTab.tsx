import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Wine,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  X,
  CheckCircle,
  Info,
  Lock,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Clock,
  Send,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import { ClubMenuItem, VenueOrder } from '@/types/club.types';
import { ClubTheme } from '@/constants/clubTheme';
import { clubService } from '@/services/club.service';

export interface ClubMenuTabProps {
  clubId?: string;
  clubName?: string;
  items: ClubMenuItem[];
  isLoading?: boolean;
  error?: string | null;
  hasActivePresence?: boolean;
  isClubOpen?: boolean;
  userOrders?: VenueOrder[];
  customerName?: string;
  onRetry?: () => void;
  onSelectItem?: (item: ClubMenuItem) => void;
  onOrderPlaced?: () => void;
  onOrderConfirmed?: () => void;
  onStayFinalized?: () => void;
  onNavigateToExperience?: () => void;
}

interface CartItem {
  item: ClubMenuItem;
  quantity: number;
  notes?: string;
}

export const ClubMenuTab: React.FC<ClubMenuTabProps> = ({
  clubId,
  clubName = 'Discoteca',
  items,
  isLoading = false,
  error = null,
  hasActivePresence = false,
  isClubOpen = true,
  userOrders = [],
  customerName = 'Cliente',
  onRetry,
  onSelectItem,
  onOrderPlaced,
  onOrderConfirmed,
  onStayFinalized,
  onNavigateToExperience,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedProduct, setSelectedProduct] = useState<ClubMenuItem | null>(null);

  // Estados del Carrito de Pedido en Vivo
  const [cart, setCart] = useState<{ [productId: string]: CartItem }>({});
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [tableOrLocation, setTableOrLocation] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Deduplicación defensiva por ID para garantizar que no aparezcan productos duplicados
  const sanitizedItems = useMemo(() => {
    const seen = new Set<string>();
    return (items || []).filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [items]);

  // Categorías presentes en los productos reales (deduplicación case-insensitive)
  const categories = useMemo(() => {
    const list = ['Todos'];
    const catMap = new Map<string, string>();
    sanitizedItems.forEach((item) => {
      if (item.category && item.category.trim()) {
        const clean = item.category.trim();
        const lower = clean.toLowerCase();
        if (!catMap.has(lower)) {
          catMap.set(lower, clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase());
        }
      }
    });
    return [...list, ...Array.from(catMap.values())];
  }, [sanitizedItems]);

  // Filtrado por categoría seleccionada
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Todos') return sanitizedItems;
    return sanitizedItems.filter(
      (item) => (item.category || '').toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [sanitizedItems, selectedCategory]);

  // Sincronizar el producto seleccionado si sus datos cambian en Supabase
  useEffect(() => {
    if (selectedProduct) {
      const updated = sanitizedItems.find((i) => i.id === selectedProduct.id);
      if (
        updated &&
        (updated.image_url !== selectedProduct.image_url ||
          updated.price !== selectedProduct.price ||
          updated.available !== selectedProduct.available ||
          updated.name !== selectedProduct.name)
      ) {
        setSelectedProduct(updated);
      }
    }
  }, [sanitizedItems, selectedProduct]);

  // Cálculos del Carrito
  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const totalCartCount = useMemo(
    () => cartItems.reduce((acc, curr) => acc + curr.quantity, 0),
    [cartItems]
  );
  const totalCartPrice = useMemo(
    () => cartItems.reduce((acc, curr) => acc + curr.quantity * curr.item.price, 0),
    [cartItems]
  );

  const handleAddToCart = useCallback(
    (product: ClubMenuItem) => {
      if (!isClubOpen) {
        Alert.alert(
          'Discoteca Cerrada',
          'La discoteca se encuentra cerrada actualmente. No se pueden emitir nuevos pedidos.'
        );
        return;
      }
      if (!product.available) {
        Alert.alert('Producto Agotado', 'Este producto no está disponible temporalmente.');
        return;
      }
      setCart((prev) => {
        const existing = prev[product.id];
        const newQty = (existing?.quantity || 0) + 1;
        return {
          ...prev,
          [product.id]: {
            item: product,
            quantity: newQty,
            notes: existing?.notes || '',
          },
        };
      });
    },
    [isClubOpen]
  );

  const handleRemoveFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return {
        ...prev,
        [productId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  }, []);

  const handleClearItem = useCallback((productId: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  }, []);

  // Manejador de selección de producto para ver detalle
  const handleProductPress = useCallback(
    (item: ClubMenuItem) => {
      if (onSelectItem) {
        onSelectItem(item);
      }
      setSelectedProduct(item);
    },
    [onSelectItem]
  );

  // Confirmar y Enviar Pedido a PostgreSQL create_venue_order
  const handleConfirmOrder = async () => {
    if (!isClubOpen) {
      Alert.alert(
        'Discoteca Cerrada',
        'La discoteca se encuentra cerrada actualmente. No se pueden emitir nuevos pedidos.'
      );
      return;
    }
    if (!clubId) {
      Alert.alert('Error', 'Identificador de discoteca no disponible.');
      return;
    }
    if (!tableOrLocation.trim()) {
      Alert.alert(
        'Mesa / Ubicación Requerida',
        'Por favor ingresa tu ubicación dentro del local (ej. "Mesa 14", "Barra Principal", "Zona VIP 2").'
      );
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Carrito Vacío', 'Agrega al menos un producto a tu pedido.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const payloadItems = cartItems.map((ci) => ({
        product_id: ci.item.id,
        quantity: ci.quantity,
        notes: ci.notes?.trim() || undefined,
      }));

      const result = await clubService.createClubVenueOrder({
        clubId,
        customerName: customerName.trim() || 'Cliente Hangover',
        tableOrLocation: tableOrLocation.trim(),
        notes: orderNotes.trim() || undefined,
        items: payloadItems,
      });

      if (result.success) {
        setCart({});
        setIsCartModalVisible(false);
        setOrderNotes('');
        Alert.alert(
          '¡Pedido Enviado al Bar! 🍹',
          `Tu orden ${result.orderNumber || ''} ha sido registrada con éxito para la ${tableOrLocation.trim()}.\nPuedes seguir su preparación en vivo en "Mi Experiencia".`,
          onNavigateToExperience
            ? [
                {
                  text: 'Ver en Mi Experiencia',
                  onPress: () => onNavigateToExperience(),
                },
                {
                  text: 'Seguir en Carta',
                  style: 'cancel',
                },
              ]
            : [{ text: 'Entendido' }]
        );
        if (onOrderPlaced) {
          onOrderPlaced();
        }
      } else {
        Alert.alert('Error al enviar comanda', result.error || 'No se pudo registrar el pedido.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Error de conexión.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // 1. Estado de Carga (Loading)
  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color={ClubTheme.colors.primary} />
        <Text style={styles.loadingText}>Cargando carta digital...</Text>
      </View>
    );
  }

  // 2. Estado de Error (Error de consulta o conexión)
  if (error) {
    return (
      <View style={styles.stateContainer}>
        <View style={styles.errorIconCircle}>
          <AlertTriangle size={26} color={ClubTheme.colors.danger} />
        </View>
        <Text style={styles.errorTitle}>Error al cargar la carta</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        {onRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Reintentar cargar la carta"
          >
            <RotateCcw size={15} color="#ffffff" />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 3. Estado Vacío Real (Sin productos publicados)
  if (sanitizedItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Wine size={24} color={ClubTheme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Carta digital no publicada</Text>
        <Text style={styles.emptySubtitle}>
          Esta discoteca aún no ha añadido sus productos o botellas a la carta digital.
        </Text>
      </View>
    );
  }

  // 4. Estado con Datos: Renderizado del Menú
  return (
    <View style={styles.container}>
      {/* 4.1 BANNER DE PRESENCIA Y MODO OPERATIVO */}
      {!isClubOpen ? (
        <View style={styles.closedClubNoticeCard}>
          <View style={styles.closedClubIconCircle}>
            <Lock size={16} color="#EF4444" />
          </View>
          <View style={styles.closedClubTextCol}>
            <Text style={styles.closedClubTitle}>Discoteca Cerrada Ahora</Text>
            <Text style={styles.closedClubDesc}>
              El establecimiento se encuentra cerrado comercialmente. No se admiten nuevos pedidos en vivo en este momento.
            </Text>
          </View>
        </View>
      ) : hasActivePresence ? (
        <View style={styles.activePresenceCard}>
          <View style={styles.activePresenceIconCircle}>
            <Sparkles size={16} color="#10B981" />
          </View>
          <View style={styles.activePresenceTextCol}>
            <Text style={styles.activePresenceTitle}>Pedidos en Vivo Activos</Text>
            <Text style={styles.activePresenceDesc}>
              Elige tus bebidas y envía la comanda directamente al bar indicando tu mesa.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.informativeModeCard}>
          <View style={styles.informativeIconCircle}>
            <Lock size={16} color="#A78BFA" />
          </View>
          <View style={styles.informativeTextCol}>
            <Text style={styles.informativeTitle}>Carta en Modo Informativo</Text>
            <Text style={styles.informativeDesc}>
              Puedes ver precios y productos. Los pedidos en vivo se activan cuando el personal valida tu QR en el ingreso.
            </Text>
          </View>
        </View>
      )}

      {/* 4.2 ACCESO COMPACTO A MI EXPERIENCIA */}
      {onNavigateToExperience && (hasActivePresence || (userOrders && userOrders.length > 0)) && (
        <TouchableOpacity
          style={styles.experienceShortcutBanner}
          activeOpacity={0.85}
          onPress={onNavigateToExperience}
        >
          <View style={styles.experienceShortcutLeft}>
            <View style={styles.experienceShortcutIcon}>
              <Sparkles size={16} color="#F900BF" />
            </View>
            <View style={styles.experienceShortcutTextCol}>
              <Text style={styles.experienceShortcutTitle}>Mi Experiencia</Text>
              <Text style={styles.experienceShortcutSubtitle} numberOfLines={1}>
                {userOrders.filter((o) => ['pending', 'accepted', 'in_preparation', 'ready', 'delivered'].includes(o.status)).length > 0
                  ? `${userOrders.filter((o) => ['pending', 'accepted', 'in_preparation', 'ready', 'delivered'].includes(o.status)).length} pedido(s) activo(s) • Ver cuenta y pedidos`
                  : 'Consulta tu saldo, consumos y pedidos en vivo'}
              </Text>
            </View>
          </View>
          <View style={styles.experienceShortcutBadge}>
            <Text style={styles.experienceShortcutBadgeText}>Ver</Text>
            <ChevronRight size={13} color="#FF85B3" />
          </View>
        </TouchableOpacity>
      )}

      {/* 4.3 SELECTOR DE CATEGORÍAS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 4.4 LISTADO DE PRODUCTOS */}
      <View style={styles.itemsList}>
        {filteredItems.map((item) => {
          const cartQuantity = cart[item.id]?.quantity || 0;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.productCard, !item.available && styles.productCardUnavailable]}
              onPress={() => handleProductPress(item)}
              activeOpacity={0.75}
            >
              {item.image_url ? (
                <Image
                  key={item.image_url}
                  source={{ uri: item.image_url }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderIcon}>
                  <Wine size={20} color={ClubTheme.colors.textMuted} />
                </View>
              )}

              <View style={styles.productDetails}>
                <View style={styles.titleRow}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.featured && (
                    <View style={styles.featuredBadge}>
                      <Sparkles size={11} color="#fbbf24" />
                      <Text style={styles.featuredBadgeText}>Popular</Text>
                    </View>
                  )}
                </View>

                {item.description ? (
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>
                    ${item.price.toLocaleString('es-CO')}
                  </Text>
                  {!item.available && (
                    <View style={styles.soldOutBadge}>
                      <Text style={styles.soldOutText}>Agotado</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Botón de acción para pedir cuando el usuario está dentro */}
              {hasActivePresence && isClubOpen && item.available && (
                <View style={styles.productActionCol}>
                  {cartQuantity > 0 ? (
                    <View style={styles.quantityControlRow}>
                      <TouchableOpacity
                        style={styles.quantityBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveFromCart(item.id);
                        }}
                      >
                        <Minus size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text style={styles.quantityValue}>{cartQuantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                      >
                        <Plus size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addBtn}
                      activeOpacity={0.8}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item);
                      }}
                    >
                      <Plus size={14} color="#FFFFFF" />
                      <Text style={styles.addBtnText}>Pedir</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {filteredItems.length === 0 && (
          <View style={styles.noResultsBox}>
            <Text style={styles.noResultsText}>
              No hay productos disponibles en la categoría "{selectedCategory}".
            </Text>
          </View>
        )}
      </View>

      {/* 4.5 BARRA FLOTANTE DE RESUMEN DEL CARRITO (CUANDO HAY ITEMS) */}
      {hasActivePresence && isClubOpen && totalCartCount > 0 && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity
            style={styles.floatingCartBtn}
            activeOpacity={0.85}
            onPress={() => setIsCartModalVisible(true)}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.floatingCartBadge}>
                <ShoppingBag size={18} color="#FFFFFF" />
                <View style={styles.cartBadgeCircle}>
                  <Text style={styles.cartBadgeCircleText}>{totalCartCount}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.floatingCartTitle}>Ver Pedido en Vivo</Text>
                <Text style={styles.floatingCartSubtitle}>
                  {totalCartCount} {totalCartCount === 1 ? 'producto' : 'productos'} seleccionados
                </Text>
              </View>
            </View>
            <View style={styles.floatingCartRight}>
              <Text style={styles.floatingCartPrice}>${totalCartPrice.toLocaleString('es-CO')}</Text>
              <Text style={styles.floatingCartAction}>Enviar comanda ›</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* 4.6 MODAL DE CONFIRMACIÓN DE PEDIDO / COMANDA */}
      <Modal
        visible={isCartModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCartModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.cartModalCard}>
            {/* Header */}
            <View style={styles.cartModalHeader}>
              <View style={styles.cartModalHeaderTitleCol}>
                <Text style={styles.cartModalTitle}>Tu Pedido en Vivo</Text>
                <Text style={styles.cartModalSubtitle}>Comanda directa a barra / mesa</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCartModalVisible(false)}
                style={styles.modalCloseIconBtn}
              >
                <X size={20} color={ClubTheme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.cartItemsScroll} showsVerticalScrollIndicator={false}>
              {cartItems.map(({ item, quantity }) => (
                <View key={item.id} style={styles.cartItemRow}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>
                      ${(item.price * quantity).toLocaleString('es-CO')} COP
                      <Text style={styles.cartItemUnitPrice}> (${item.price.toLocaleString('es-CO')} c/u)</Text>
                    </Text>
                  </View>

                  <View style={styles.cartItemControls}>
                    <TouchableOpacity
                      style={styles.cartQtyBtn}
                      onPress={() => handleRemoveFromCart(item.id)}
                    >
                      <Minus size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.cartQtyText}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.cartQtyBtn}
                      onPress={() => handleAddToCart(item)}
                    >
                      <Plus size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cartDeleteBtn}
                      onPress={() => handleClearItem(item.id)}
                    >
                      <Trash2 size={15} color={ClubTheme.colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Formulario de Mesa / Ubicación */}
              <View style={styles.cartFormSection}>
                <Text style={styles.inputLabel}>
                  Mesa o Ubicación en el local <Text style={styles.requiredMark}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder='Ej. "Mesa 12", "Barra Principal", "VIP 4"'
                  placeholderTextColor={ClubTheme.colors.textMuted}
                  value={tableOrLocation}
                  onChangeText={setTableOrLocation}
                  autoCapitalize="sentences"
                />

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                  Notas para el bartender (opcional)
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput]}
                  placeholder='Ej. "Sin hielo", "Vasos adicionales", "Hielo aparte"'
                  placeholderTextColor={ClubTheme.colors.textMuted}
                  value={orderNotes}
                  onChangeText={setOrderNotes}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Resumen Total */}
              <View style={styles.cartSummaryBox}>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${totalCartPrice.toLocaleString('es-CO')} COP</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryTotalLabel}>Total a Pagar</Text>
                  <Text style={styles.summaryTotalValue}>${totalCartPrice.toLocaleString('es-CO')} COP</Text>
                </View>
              </View>
            </ScrollView>

            {/* Footer con Botón de Enviar Pedido */}
            <View style={styles.cartModalFooter}>
              <TouchableOpacity
                style={[styles.submitOrderBtn, isSubmittingOrder && styles.btnDisabled]}
                disabled={isSubmittingOrder}
                activeOpacity={0.85}
                onPress={handleConfirmOrder}
              >
                {isSubmittingOrder ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={16} color="#FFFFFF" />
                    <Text style={styles.submitOrderBtnText}>
                      Confirmar y Enviar al Bar • ${totalCartPrice.toLocaleString('es-CO')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 4.7 MODAL DE DETALLE INFORMATIVO DEL PRODUCTO */}
      <Modal
        visible={!!selectedProduct}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedProduct(null)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedProduct && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderCategory}>
                    <Text style={styles.modalCategoryText}>
                      {selectedProduct.category || 'Carta'}
                    </Text>
                    {selectedProduct.featured && (
                      <View style={styles.featuredBadge}>
                        <Sparkles size={11} color="#fbbf24" />
                        <Text style={styles.featuredBadgeText}>Popular</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseIconBtn}
                    onPress={() => setSelectedProduct(null)}
                    activeOpacity={0.8}
                  >
                    <X size={20} color={ClubTheme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {selectedProduct.image_url ? (
                  <Image
                    key={selectedProduct.image_url}
                    source={{ uri: selectedProduct.image_url }}
                    style={styles.modalProductImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.modalProductPlaceholder}>
                    <Wine size={48} color={ClubTheme.colors.textMuted} />
                  </View>
                )}

                <View style={styles.modalBody}>
                  <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                  <Text style={styles.modalProductPrice}>
                    ${selectedProduct.price.toLocaleString('es-CO')} COP
                  </Text>

                  {selectedProduct.description ? (
                    <Text style={styles.modalProductDescription}>
                      {selectedProduct.description}
                    </Text>
                  ) : (
                    <Text style={styles.modalProductNoDescription}>
                      Producto disponible para consumo en las instalaciones de la discoteca.
                    </Text>
                  )}

                  {/* Estado de disponibilidad e instrucciones */}
                  {!isClubOpen ? (
                    <View style={styles.statusBoxUnavailable}>
                      <Lock size={18} color={ClubTheme.colors.danger} />
                      <View style={styles.statusBoxTextCol}>
                        <Text style={styles.statusBoxTitleUnavailable}>Discoteca Cerrada</Text>
                        <Text style={styles.statusBoxDesc}>
                          No se pueden realizar pedidos porque el establecimiento se encuentra cerrado actualmente.
                        </Text>
                      </View>
                    </View>
                  ) : selectedProduct.available ? (
                    <View style={styles.statusBoxAvailable}>
                      <CheckCircle size={18} color={ClubTheme.colors.success} />
                      <View style={styles.statusBoxTextCol}>
                        <Text style={styles.statusBoxTitleAvailable}>Disponible</Text>
                        <Text style={styles.statusBoxDesc}>
                          {hasActivePresence
                            ? 'Puedes pedirlo ahora mismo indicando tu mesa.'
                            : 'Disponible en el local una vez validada tu entrada en puerta.'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.statusBoxUnavailable}>
                      <AlertTriangle size={18} color={ClubTheme.colors.danger} />
                      <View style={styles.statusBoxTextCol}>
                        <Text style={styles.statusBoxTitleUnavailable}>Producto Agotado</Text>
                        <Text style={styles.statusBoxDesc}>
                          Este producto se encuentra agotado temporalmente en este local.
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Botón de acción rápido si está disponible y presente */}
                  {hasActivePresence && isClubOpen && selectedProduct.available ? (
                    <TouchableOpacity
                      style={styles.modalAddCartBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        handleAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                    >
                      <Plus size={16} color="#FFFFFF" />
                      <Text style={styles.modalAddCartBtnText}>
                        Agregar al Pedido (${selectedProduct.price.toLocaleString('es-CO')})
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.modalDismissBtn}
                      onPress={() => setSelectedProduct(null)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalDismissBtnText}>Volver a la carta</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    gap: 14,
  },
  // Banners de presencia
  closedClubNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: ClubTheme.radii.lg,
    padding: 14,
  },
  closedClubIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedClubTextCol: {
    flex: 1,
  },
  closedClubTitle: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  closedClubDesc: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  activePresenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: ClubTheme.radii.lg,
    padding: 14,
  },
  activePresenceIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePresenceTextCol: {
    flex: 1,
  },
  activePresenceTitle: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  activePresenceDesc: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  informativeModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    borderRadius: ClubTheme.radii.lg,
    padding: 14,
  },
  informativeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  informativeTextCol: {
    flex: 1,
  },
  informativeTitle: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  informativeDesc: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  // Acceso compacto a Mi Experiencia
  experienceShortcutBanner: {
    marginHorizontal: 20,
    backgroundColor: '#0F0B1F',
    borderWidth: 1,
    borderColor: 'rgba(249, 0, 191, 0.35)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  experienceShortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  experienceShortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(249, 0, 191, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  experienceShortcutTextCol: {
    flex: 1,
  },
  experienceShortcutTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  experienceShortcutSubtitle: {
    color: '#D1D5DB',
    fontSize: 11,
    marginTop: 2,
  },
  experienceShortcutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(249, 0, 191, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(249, 0, 191, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  experienceShortcutBadgeText: {
    color: '#FF85B3',
    fontSize: 11,
    fontWeight: '800',
  },
  // Categorías
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: ClubTheme.radii.full,
    backgroundColor: ClubTheme.colors.surface,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  categoryChipSelected: {
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderColor: ClubTheme.colors.primary,
  },
  categoryChipText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  // Lista de productos
  itemsList: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 70,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  productCardUnavailable: {
    opacity: 0.65,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  productImage: {
    width: 68,
    height: 68,
    borderRadius: ClubTheme.radii.md,
    backgroundColor: '#161622',
  },
  placeholderIcon: {
    width: 68,
    height: 68,
    borderRadius: ClubTheme.radii.md,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetails: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productName: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: ClubTheme.radii.full,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  featuredBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '700',
  },
  productDescription: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  productPrice: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: ClubTheme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  soldOutText: {
    color: ClubTheme.colors.danger,
    fontSize: 10,
    fontWeight: '700',
  },
  productActionCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ClubTheme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: ClubTheme.radii.md,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quantityControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderRadius: ClubTheme.radii.md,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    overflow: 'hidden',
  },
  quantityBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: ClubTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    minWidth: 26,
    textAlign: 'center',
  },
  // Barra flotante del Carrito
  floatingCartContainer: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    right: 20,
    zIndex: 99,
  },
  floatingCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ClubTheme.colors.primary,
    borderRadius: ClubTheme.radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: ClubTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartBadge: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeCircle: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeCircleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  floatingCartTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  floatingCartSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
  },
  floatingCartRight: {
    alignItems: 'flex-end',
  },
  floatingCartPrice: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  floatingCartAction: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  // Modal de Carrito / Comanda
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  cartModalCard: {
    backgroundColor: ClubTheme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: ClubTheme.colors.border,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  cartModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: ClubTheme.colors.border,
  },
  cartModalHeaderTitleCol: {
    gap: 2,
  },
  cartModalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  cartModalSubtitle: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
  },
  cartItemsScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  cartItemInfo: {
    flex: 1,
    gap: 2,
  },
  cartItemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cartItemPrice: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  cartItemUnitPrice: {
    color: ClubTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '400',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cartQtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: ClubTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartQtyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  cartDeleteBtn: {
    padding: 6,
    marginLeft: 4,
  },
  cartFormSection: {
    marginTop: 16,
    gap: 6,
  },
  inputLabel: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  requiredMark: {
    color: ClubTheme.colors.danger,
  },
  textInput: {
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    borderRadius: ClubTheme.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  textAreaInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  cartSummaryBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderRadius: ClubTheme.radii.md,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    gap: 8,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: ClubTheme.colors.border,
  },
  summaryTotalLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  summaryTotalValue: {
    color: '#34D399',
    fontSize: 17,
    fontWeight: '800',
  },
  cartModalFooter: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  submitOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ClubTheme.colors.primary,
    paddingVertical: 14,
    borderRadius: ClubTheme.radii.md,
    shadowColor: ClubTheme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  submitOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  // Modal de Detalle Informativo
  modalContent: {
    backgroundColor: ClubTheme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    padding: 20,
    gap: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalCategoryText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalCloseIconBtn: {
    padding: 6,
    borderRadius: ClubTheme.radii.full,
    backgroundColor: ClubTheme.colors.surfaceElevated,
  },
  modalProductImage: {
    width: '100%',
    height: 190,
    borderRadius: ClubTheme.radii.lg,
    backgroundColor: '#161622',
  },
  modalProductPlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: ClubTheme.radii.lg,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    gap: 12,
  },
  modalProductName: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  modalProductPrice: {
    color: '#34D399',
    fontSize: 18,
    fontWeight: '800',
  },
  modalProductDescription: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  modalProductNoDescription: {
    color: ClubTheme.colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  statusBoxAvailable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: ClubTheme.colors.successLight,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: ClubTheme.radii.md,
    padding: 12,
  },
  statusBoxTextCol: {
    flex: 1,
    gap: 2,
  },
  statusBoxTitleAvailable: {
    color: ClubTheme.colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  statusBoxDesc: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  statusBoxUnavailable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: ClubTheme.colors.dangerLight,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: ClubTheme.radii.md,
    padding: 12,
  },
  statusBoxTitleUnavailable: {
    color: ClubTheme.colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  modalAddCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ClubTheme.colors.primary,
    paddingVertical: 14,
    borderRadius: ClubTheme.radii.md,
    marginTop: 4,
  },
  modalAddCartBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalDismissBtn: {
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    paddingVertical: 12,
    borderRadius: ClubTheme.radii.md,
    alignItems: 'center',
    marginTop: 4,
  },
  modalDismissBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  // Estados de carga y error
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  errorIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ClubTheme.colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  errorSubtitle: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ClubTheme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: ClubTheme.radii.md,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  noResultsBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noResultsText: {
    color: ClubTheme.colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
