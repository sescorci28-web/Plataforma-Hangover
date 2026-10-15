import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Info, Megaphone, Users } from 'lucide-react-native';

export type DetailTabType = 'info' | 'activity' | 'community';

interface EventDetailTabsProps {
  activeTab: DetailTabType;
  onTabChange: (tab: DetailTabType) => void;
  updatesCount?: number;
  communityCount?: number;
}

export const EventDetailTabs: React.FC<EventDetailTabsProps> = ({
  activeTab,
  onTabChange,
  updatesCount = 0,
  communityCount = 0,
}) => {
  const animInfo = useRef(new Animated.Value(activeTab === 'info' ? 1 : 0)).current;
  const animActivity = useRef(new Animated.Value(activeTab === 'activity' ? 1 : 0)).current;
  const animCommunity = useRef(new Animated.Value(activeTab === 'community' ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animInfo, {
        toValue: activeTab === 'info' ? 1 : 0,
        friction: 9,
        tension: 60,
        useNativeDriver: false,
      }),
      Animated.spring(animActivity, {
        toValue: activeTab === 'activity' ? 1 : 0,
        friction: 9,
        tension: 60,
        useNativeDriver: false,
      }),
      Animated.spring(animCommunity, {
        toValue: activeTab === 'community' ? 1 : 0,
        friction: 9,
        tension: 60,
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeTab]);

  const renderTab = (
    tabKey: DetailTabType,
    label: string,
    Icon: React.ElementType,
    animValue: Animated.Value,
    count?: number,
    badgeColor?: string
  ) => {
    const isActive = activeTab === tabKey;

    const flexAnim = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1.8],
    });

    const bgAnim = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255, 255, 255, 0)', 'rgba(129, 140, 248, 0.15)'],
    });

    const borderAnim = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['transparent', 'rgba(129, 140, 248, 0.35)'],
    });

    const labelOpacity = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.3, 1],
    });

    const iconColor = isActive ? '#818cf8' : '#a1a1aa';

    return (
      <Animated.View
        style={[
          styles.tabWrapper,
          {
            flex: flexAnim,
            backgroundColor: bgAnim,
            borderColor: borderAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.tabTouchable}
          onPress={() => onTabChange(tabKey)}
          activeOpacity={0.85}
        >
          <Icon size={15} color={iconColor} />

          {isActive ? (
            <Animated.Text
              style={[styles.activeTabText, { opacity: labelOpacity }]}
              numberOfLines={1}
            >
              {label} {count && count > 0 ? `• ${count}` : ''}
            </Animated.Text>
          ) : (
            count && count > 0 ? (
              <View style={[styles.inactiveBadge, badgeColor ? { backgroundColor: badgeColor } : null]}>
                <Text style={[styles.inactiveBadgeText, badgeColor ? { color: '#10b981' } : null]}>
                  {count}
                </Text>
              </View>
            ) : null
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {renderTab('info', 'Información', Info, animInfo)}
      {renderTab('activity', 'Actividad', Megaphone, animActivity, updatesCount)}
      {renderTab('community', 'Comunidad', Users, animCommunity, communityCount, 'rgba(16, 185, 129, 0.15)')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  tabWrapper: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  activeTabText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  inactiveBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  inactiveBadgeText: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
