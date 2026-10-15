import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';

interface EventRatingStarsProps {
  rating: number; // 0 a 5
  onRatingChange: (score: number) => void;
  size?: number;
  readOnly?: boolean;
}

export const EventRatingStars: React.FC<EventRatingStarsProps> = ({
  rating,
  onRatingChange,
  size = 32,
  readOnly = false,
}) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      {stars.map((starNum) => {
        const isFilled = starNum <= rating;
        return (
          <TouchableOpacity
            key={starNum}
            onPress={() => !readOnly && onRatingChange(starNum)}
            disabled={readOnly}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <Star
              size={size}
              color={isFilled ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)'}
              fill={isFilled ? '#fbbf24' : 'transparent'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
});
