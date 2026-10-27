import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import {
  Info,
  Wine,
  Sparkles,
  Calendar,
  Users,
  Ticket,
} from 'lucide-react-native';
import { ClubTheme } from '@/constants/clubTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ProfileTabType =
  | 'info'
  | 'menu'
  | 'experience'
  | 'events'
  | 'community'
  | 'bookings';

export interface ClubNavigationTabsProps {
  activeTab: ProfileTabType;
  onSelectTab: (tab: ProfileTabType) => void;
  eventsCount?: number;
  tablesCount?: number;
  menuItemsCount?: number;
  experienceCount?: number;
  communityCount?: number;
}

interface TabItemConfig {
  id: ProfileTabType;
  label: string;
  IconComponent: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  count?: number;
}

export const ClubNavigationTabs: React.FC<ClubNavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  eventsCount = 0,
  tablesCount = 0,
  menuItemsCount = 0,
  experienceCount = 0,
  communityCount = 0,
}) => {
  // 1. TODAS LAS PESTAÑAS REALES DEL PERFIL DE DISCOTECA
  const tabs: TabItemConfig[] = [
    {
      id: 'info',
      label: 'Información',
      IconComponent: Info,
    },
    {
      id: 'menu',
      label: 'Carta',
      IconComponent: Wine,
      count: menuItemsCount > 0 ? menuItemsCount : undefined,
    },
    {
      id: 'experience',
      label: 'Mi experiencia',
      IconComponent: Sparkles,
      count: experienceCount > 0 ? experienceCount : undefined,
    },
    {
      id: 'events',
      label: 'Eventos',
      IconComponent: Calendar,
      count: eventsCount > 0 ? eventsCount : undefined,
    },
    {
      id: 'community',
      label: 'Comunidad',
      IconComponent: Users,
      count: communityCount > 0 ? communityCount : undefined,
    },
    {
      id: 'bookings',
      label: 'Reservas',
      IconComponent: Ticket,
      count: tablesCount > 0 ? tablesCount : undefined,
    },
  ];

  const scrollViewRef = useRef<any>(null);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});

  // 2. VALORES ANIMADOS (0: sólo icono compacto, 1: icono desplazado + nombre)
  const animValues = useRef<Record<ProfileTabType, Animated.Value>>({
    info: new Animated.Value(activeTab === 'info' ? 1 : 0),
    menu: new Animated.Value(activeTab === 'menu' ? 1 : 0),
    experience: new Animated.Value(activeTab === 'experience' ? 1 : 0),
    events: new Animated.Value(activeTab === 'events' ? 1 : 0),
    community: new Animated.Value(activeTab === 'community' ? 1 : 0),
    bookings: new Animated.Value(activeTab === 'bookings' ? 1 : 0),
  }).current;

  // 3. ANIMACIÓN FLUIDA EN PARALELO (250ms)
  useEffect(() => {
    const tabIds: ProfileTabType[] = [
      'info',
      'menu',
      'experience',
      'events',
      'community',
      'bookings',
    ];

    const animations = tabIds.map((tabId) => {
      const toValue = tabId === activeTab ? 1 : 0;
      return Animated.timing(animValues[tabId], {
        toValue,
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false, // Necesario para interpolación de maxWidth
      });
    });

    Animated.parallel(animations).start();

    // Auto-scroll suave para centrar la pestaña seleccionada
    const timer = setTimeout(() => {
      const layout = tabLayouts.current[activeTab];
      if (layout) {
        const targetScrollX = Math.max(0, layout.x - (SCREEN_WIDTH - 140) / 2);
        scrollViewRef.current?.scrollTo({ x: targetScrollX, animated: true });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [activeTab, animValues]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.IconComponent;
          const anim = animValues[tab.id];

          // Interpolación fluida de expansión del texto (0 -> 160)
          const labelMaxWidth = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 160],
          });

          // Aparición suave de la opacidad del texto
          const labelOpacity = anim.interpolate({
            inputRange: [0, 0.35, 1],
            outputRange: [0, 0, 1],
          });

          // Desplazamiento sutil del texto hacia su posición
          const labelTranslateX = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [-8, 0],
          });

          // Desplazamiento lateral del icono al activarse
          const iconTranslateX = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -3],
          });

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label}${tab.count ? `, ${tab.count} elementos` : ''}`}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                tabLayouts.current[tab.id] = { x, width };
              }}
              style={styles.tabButton}
            >
              {/* ICONO: gris claro al estar inactivo, blanco suave al seleccionarse, con desplazamiento lateral */}
              <Animated.View
                style={{
                  transform: [{ translateX: iconTranslateX }],
                }}
              >
                <IconComp
                  size={18}
                  color={isActive ? '#FFFFFF' : '#9CA3AF'}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </Animated.View>

              {/* ETIQUETA EXPANDIBLE: sólo la sección seleccionada muestra su nombre */}
              <Animated.View
                style={[
                  styles.labelWrapper,
                  {
                    maxWidth: labelMaxWidth,
                    opacity: labelOpacity,
                    transform: [{ translateX: labelTranslateX }],
                  },
                ]}
              >
                <View style={styles.labelRow}>
                  <Text style={styles.tabLabel} numberOfLines={1}>
                    {tab.label}
                  </Text>
                  {tab.count !== undefined && tab.count > 0 && (
                    <Text style={styles.tabCount}>
                      ({tab.count})
                    </Text>
                  )}
                </View>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ----------------------------------------------------------------------------
// ESTILOS TOTALMENTE MINIMALISTAS: CERO BORDES, CERO CÁPSULAS, FONDO INTEGRADO
// ----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    backgroundColor: ClubTheme.colors.bg, // Integrado al fondo oscuro nativo
    paddingVertical: 10,
    // Eliminación total de bordes, líneas, contornos o trazos
    borderWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
    alignItems: 'center',
  },

  // PESTAÑA: Totalmente limpia, sin fondo, sin bordes ni cápsulas delineadas
  tabButton: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
  },

  // CONTENEDOR DE TEXTO EXPANDIBLE
  labelWrapper: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 2,
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  tabCount: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
});
