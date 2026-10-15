import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface CountdownProps {
  dateISO: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  status: 'waiting' | 'active' | 'ended';
}

export const EventCountdownMobile = ({ dateISO }: CountdownProps) => {
  const { isCompact } = useResponsive();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0, hours: 0, minutes: 0, seconds: 0, status: 'waiting'
  });

  useEffect(() => {
    const target = new Date(dateISO).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      const eventDuration = 6 * 60 * 60 * 1000;

      if (diff <= 0) {
        if (Math.abs(diff) < eventDuration) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, status: 'active' });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, status: 'ended' });
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds, status: 'waiting' });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [dateISO]);

  if (timeLeft.status === 'ended') {
    return (
      <View style={styles.container}>
        <Text style={styles.endedText}>Este evento ya finalizó</Text>
      </View>
    );
  }

  if (timeLeft.status === 'active') {
    return (
      <View style={styles.container}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>EN VIVO AHORA</Text>
        </View>
      </View>
    );
  }

  const units = [
    { value: timeLeft.days, label: 'DÍAS' },
    { value: timeLeft.hours, label: 'HRS' },
    { value: timeLeft.minutes, label: 'MIN' },
    { value: timeLeft.seconds, label: 'SEG' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>La venta de tickets cierra en</Text>
      <View style={styles.unitsRow}>
        {units.map((u, i) => (
          <React.Fragment key={u.label}>
            <View style={[styles.unitBox, isCompact && { width: 42, height: 42 }]}>
              <Text style={[styles.unitValue, isCompact && { fontSize: 15 }]}>{String(u.value).padStart(2, '0')}</Text>
              <Text style={styles.unitLabel}>{u.label}</Text>
            </View>
            {i < units.length - 1 && <Text style={styles.separator}>:</Text>}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  unitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  unitBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(129,140,248,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitValue: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  unitLabel: {
    color: '#818cf8',
    fontSize: 7.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  separator: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '900',
    alignSelf: 'center',
    marginHorizontal: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    gap: 6,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444',
  },
  liveText: {
    color: '#ef4444', fontSize: 12, fontWeight: '900', letterSpacing: 1.5,
  },
  endedText: { color: '#71717a', fontSize: 13, fontWeight: 'bold' },
});
