import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Star, BadgeCheck } from 'lucide-react-native';
import { ClubInfo } from '@/data/mockClubs';

interface ClubCardProps {
  club: ClubInfo;
  onPress: () => void;
}

export const ClubCard = ({ club, onPress }: ClubCardProps) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.container}>
      <ImageBackground 
        source={{ uri: club.imageUrl }} 
        style={styles.imageBackground}
        imageStyle={{ borderRadius: 20 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(2,2,5,0.8)', 'rgba(2,2,5,1)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.topRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{club.category.toUpperCase()}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Star size={12} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.ratingText}>{club.rating}</Text>
              </View>
            </View>

            <View style={styles.titleRow}>
              <Text style={styles.title}>{club.name}</Text>
              {club.verified && <BadgeCheck size={20} color="#38bdf8" fill="#fff" />}
            </View>
            
            <View style={styles.infoRow}>
              <MapPin size={14} color="#818cf8" />
              <Text style={styles.infoText} numberOfLines={1}>{club.location}</Text>
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.statusText}>{club.hours}</Text>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Explorar</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 280,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: '#1e1e2d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'flex-end',
    padding: 20,
  },
  content: {
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  badgeText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statusText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
