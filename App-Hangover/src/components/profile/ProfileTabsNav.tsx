import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Image as ImageIcon, Calendar, Activity, Heart, 
  Plus, Sparkles, ChevronRight, Video, Film 
} from 'lucide-react-native';

import { UserTicketsSection } from './UserTicketsSection';
import { ProfileExperiences } from './ProfileExperiences';
import { UserBookingTicket } from '@/services/ticket.service';
import { UserMoment } from '@/services/moments.service';

export type ProfileTabType = 'momentos' | 'eventos' | 'actividad' | 'favoritos';

interface ProfileTabsNavProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
  onCreateMoment?: () => void;
  moments?: UserMoment[];
  onSelectMoment?: (moment: UserMoment) => void;
  tickets?: UserBookingTicket[];
  ticketsLoading?: boolean;
  ticketsError?: string | null;
  onRetryTickets?: () => void;
  onSelectTicketQR?: (ticket: UserBookingTicket) => void;
  activeTicketsCount?: number;
  onShowToast?: (title: string, message: string) => void;
  onOpenTickets?: () => void;
  isOwnProfile?: boolean;
}

export function ProfileTabsNav({
  activeTab,
  onTabChange,
  onCreateMoment,
  moments = [],
  onSelectMoment,
  tickets = [],
  ticketsLoading = false,
  ticketsError = null,
  onRetryTickets = () => {},
  onSelectTicketQR = () => {},
  activeTicketsCount = 0,
  onShowToast = () => {},
  onOpenTickets = () => {},
  isOwnProfile = true,
}: ProfileTabsNavProps) {
  return (
    <View style={styles.container}>
      {/* 1. BARRA DE TABS DE NAVEGACIÓN PROPIA DE HANGOVER */}
      <View style={styles.tabBar}>
        {/* TAB 1: MOMENTOS */}
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => onTabChange('momentos')}
          activeOpacity={0.8}
        >
          <ImageIcon 
            size={20} 
            color={activeTab === 'momentos' ? '#F900BF' : '#64748b'} 
          />
          <Text style={[
            styles.tabLabel, 
            activeTab === 'momentos' ? styles.tabLabelActive : styles.tabLabelInactive
          ]}>
            Momentos
          </Text>
          {activeTab === 'momentos' && (
            <LinearGradient 
              colors={['#4700D8', '#9900F0', '#F900BF']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.activeIndicator} 
            />
          )}
        </TouchableOpacity>

        {/* TAB 2: EVENTOS */}
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => onTabChange('eventos')}
          activeOpacity={0.8}
        >
          <Calendar 
            size={20} 
            color={activeTab === 'eventos' ? '#F900BF' : '#64748b'} 
          />
          <Text style={[
            styles.tabLabel, 
            activeTab === 'eventos' ? styles.tabLabelActive : styles.tabLabelInactive
          ]}>
            Eventos
          </Text>
          {activeTab === 'eventos' && (
            <LinearGradient 
              colors={['#4700D8', '#9900F0', '#F900BF']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.activeIndicator} 
            />
          )}
        </TouchableOpacity>

        {/* TAB 3: ACTIVIDAD */}
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => onTabChange('actividad')}
          activeOpacity={0.8}
        >
          <Activity 
            size={20} 
            color={activeTab === 'actividad' ? '#F900BF' : '#64748b'} 
          />
          <Text style={[
            styles.tabLabel, 
            activeTab === 'actividad' ? styles.tabLabelActive : styles.tabLabelInactive
          ]}>
            Actividad
          </Text>
          {activeTab === 'actividad' && (
            <LinearGradient 
              colors={['#4700D8', '#9900F0', '#F900BF']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.activeIndicator} 
            />
          )}
        </TouchableOpacity>

        {/* TAB 4: FAVORITOS */}
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => onTabChange('favoritos')}
          activeOpacity={0.8}
        >
          <Heart 
            size={20} 
            color={activeTab === 'favoritos' ? '#F900BF' : '#64748b'} 
          />
          <Text style={[
            styles.tabLabel, 
            activeTab === 'favoritos' ? styles.tabLabelActive : styles.tabLabelInactive
          ]}>
            Favoritos
          </Text>
          {activeTab === 'favoritos' && (
            <LinearGradient 
              colors={['#4700D8', '#9900F0', '#F900BF']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.activeIndicator} 
            />
          )}
        </TouchableOpacity>
      </View>

      {/* 2. CONTENIDO DEL TAB SELECCIONADO */}
      <View style={styles.tabContentContainer}>
        {activeTab === 'momentos' && (
          <View style={styles.tabSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>
                {isOwnProfile ? 'Mis momentos' : 'Momentos'}
              </Text>
              {moments.length > 0 && (
                <TouchableOpacity style={styles.seeAllLink}>
                  <Text style={styles.seeAllText}>Ver todos →</Text>
                </TouchableOpacity>
              )}
            </View>

            {moments.length === 0 && !isOwnProfile ? (
              <View style={styles.emptyStateBox}>
                <ImageIcon size={36} color="#F900BF" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyStateTitle}>Sin Momentos</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Este usuario aún no ha compartido momentos en Hangover.
                </Text>
              </View>
            ) : (
              /* SCROLL HORIZONTAL DE CARDS DE MOMENTOS CON BOTÓN "+ NUEVO MOMENTO" */
              <ScrollView 
                horizontal 
                nestedScrollEnabled={true}
                showsHorizontalScrollIndicator={false} 
                style={styles.horizontalMomentsScroll}
              >
                {/* BOTÓN + NUEVO MOMENTO (SOLO PERFIL PROPIO) */}
                {isOwnProfile && onCreateMoment && (
                  <TouchableOpacity 
                    style={styles.createMomentCard} 
                    onPress={onCreateMoment}
                    activeOpacity={0.8}
                  >
                    <View style={styles.plusIconCircle}>
                      <Plus size={22} color="#FFFFFF" />
                    </View>
                    <Text style={styles.createMomentText}>Nuevo{"\n"}momento</Text>
                  </TouchableOpacity>
                )}

                {/* LISTADO DINÁMICO DE MOMENTOS DEL USUARIO */}
                {moments.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.momentCardMock}
                    onPress={() => onSelectMoment && onSelectMoment(item)}
                    activeOpacity={0.85}
                  >
                    {item.type === 'image' ? (
                      <Image source={{ uri: item.uri }} style={styles.momentImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.momentVideoBg}>
                        <LinearGradient
                          colors={['#1F004D', '#9900F0']}
                          style={StyleSheet.absoluteFill}
                        />
                        <Film size={26} color="#FFFFFF" />
                      </View>
                    )}

                    <View style={styles.momentBadgeTop}>
                      {item.type === 'video' ? (
                        <Video size={12} color="#A855F7" />
                      ) : (
                        <Sparkles size={12} color="#FF85B3" />
                      )}
                    </View>

                    {item.caption ? (
                      <View style={styles.momentCaptionOverlay}>
                        <Text style={styles.momentCaptionText} numberOfLines={1}>
                          {item.caption}
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {activeTab === 'eventos' && (
          isOwnProfile ? (
            <ProfileExperiences
              activeTicketsCount={activeTicketsCount}
              onOpenTickets={onOpenTickets}
              onShowToast={onShowToast}
            />
          ) : (
            <View style={styles.emptyStateBox}>
              <Calendar size={36} color="#A855F7" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyStateTitle}>Eventos y Asistencias</Text>
              <Text style={styles.emptyStateSubtitle}>
                Los eventos y asistencias públicas de este usuario aparecerán aquí.
              </Text>
            </View>
          )
        )}

        {activeTab === 'actividad' && (
          <View style={styles.emptyStateBox}>
            <Activity size={36} color="#A855F7" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyStateTitle}>Actividad Nocturna</Text>
            <Text style={styles.emptyStateSubtitle}>
              {isOwnProfile 
                ? 'Tu historial de visitas a discotecas y reservas aparecerá aquí.' 
                : 'La actividad pública de este usuario en Hangover aparecerá aquí.'}
            </Text>
          </View>
        )}

        {activeTab === 'favoritos' && (
          <View style={styles.emptyStateBox}>
            <Heart size={36} color="#F900BF" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyStateTitle}>
              {isOwnProfile ? 'Mis Favoritos' : 'Favoritos'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {isOwnProfile 
                ? 'Guarda tus discotecas, DJs y eventos preferidos para verlos rápidamente.' 
                : 'Las discotecas y eventos favoritos de este usuario aparecerán aquí.'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabLabelInactive: {
    color: '#64748b',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 8,
    right: 8,
    height: 3,
    borderRadius: 2,
  },
  tabContentContainer: {
    paddingTop: 16,
  },
  tabSection: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sectionHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  seeAllLink: {
    paddingVertical: 4,
  },
  seeAllText: {
    color: '#A855F7',
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalMomentsScroll: {
    paddingLeft: 20,
  },
  createMomentCard: {
    width: 100,
    height: 140,
    borderRadius: 18,
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.3)',
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    padding: 10,
  },
  plusIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(153, 0, 240, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  createMomentText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  momentCardMock: {
    width: 100,
    height: 140,
    borderRadius: 18,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: '#0F0921',
  },
  momentImg: {
    width: '100%',
    height: '100%',
  },
  momentVideoBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  momentCaptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5, 2, 14, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  momentCaptionText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  momentBadgeTop: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(5, 2, 14, 0.65)',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  momentGlowText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 12,
  },
  videoIconTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyStateBox: {
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.2)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
