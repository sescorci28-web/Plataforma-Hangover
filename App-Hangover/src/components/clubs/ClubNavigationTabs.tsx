import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Info,
  Wine,
  Calendar,
  Users,
  Sparkles,
} from 'lucide-react-native';
import { ClubTheme } from '@/constants/clubTheme';

export type ProfileTabType = 'info' | 'menu' | 'events' | 'community' | 'bookings';

interface ClubNavigationTabsProps {
  activeTab: ProfileTabType;
  onSelectTab: (tab: ProfileTabType) => void;
  eventsCount?: number;
  tablesCount?: number;
  menuItemsCount?: number;
}

export const ClubNavigationTabs: React.FC<ClubNavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  eventsCount = 0,
  tablesCount = 0,
  menuItemsCount = 0,
}) => {
  const tabs: Array<{
    id: ProfileTabType;
    label: string;
    icon: (color: string) => React.ReactNode;
    count?: number;
  }> = [
    {
      id: 'info',
      label: 'Información',
      icon: (color) => <Info size={15} color={color} />,
    },
    {
      id: 'menu',
      label: 'Carta',
      icon: (color) => <Wine size={15} color={color} />,
      count: menuItemsCount > 0 ? menuItemsCount : undefined,
    },
    {
      id: 'events',
      label: 'Eventos',
      icon: (color) => <Calendar size={15} color={color} />,
      count: eventsCount > 0 ? eventsCount : undefined,
    },
    {
      id: 'community',
      label: 'Comunidad',
      icon: (color) => <Users size={15} color={color} />,
    },
    {
      id: 'bookings',
      label: 'Reservas',
      icon: (color) => <Sparkles size={15} color={color} />,
      count: tablesCount > 0 ? tablesCount : undefined,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const activeColor = '#ffffff';
          const inactiveColor = ClubTheme.colors.textMuted;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.75}
            >
              {tab.icon(isActive ? activeColor : inactiveColor)}
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>

              {tab.count !== undefined && (
                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                  <Text style={[styles.countText, isActive && styles.countTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ClubTheme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: ClubTheme.colors.borderSubtle,
    paddingVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: ClubTheme.radii.full,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  tabLabel: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countBadgeActive: {
    backgroundColor: ClubTheme.colors.primary,
  },
  countText: {
    color: ClubTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  countTextActive: {
    color: '#ffffff',
  },
});
