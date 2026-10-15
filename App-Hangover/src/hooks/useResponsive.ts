import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ResponsiveConfig {
  width: number;
  height: number;
  isCompact: boolean;   // ≤ 374px (OPPO A5, Androids compactos, iPhone SE)
  isStandard: boolean;  // 375px - 429px (iPhone 13/14/15, Android estándar)
  isLarge: boolean;     // ≥ 430px (iPhone Pro Max, Androids grandes)
  screenPadding: number;
  cardWidthHorizontal: number;
  cardHeightHorizontal: number;
  heroHeight: number;
  topInset: number;
  bottomInset: number;
  safeBottomPadding: number;
  scaleFont: (fontSize: number) => number;
}

export function useResponsive(): ResponsiveConfig {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isCompact = width < 375;
  const isLarge = width >= 430;
  const isStandard = !isCompact && !isLarge;

  const screenPadding = isCompact ? 14 : 20;

  const cardWidthHorizontal = isCompact ? 200 : isLarge ? 250 : 230;
  const cardHeightHorizontal = isCompact ? 155 : isLarge ? 175 : 165;
  const heroHeight = isCompact ? 260 : isLarge ? 340 : 300;

  const safeBottomPadding = Math.max(insets.bottom, 16);
  const topInset = Math.max(insets.top, 12);

  const scaleFont = (fontSize: number): number => {
    if (isCompact) return Math.round(fontSize * 0.92);
    if (isLarge) return Math.round(fontSize * 1.05);
    return fontSize;
  };

  return {
    width,
    height,
    isCompact,
    isStandard,
    isLarge,
    screenPadding,
    cardWidthHorizontal,
    cardHeightHorizontal,
    heroHeight,
    topInset,
    bottomInset: insets.bottom,
    safeBottomPadding,
    scaleFont,
  };
}
