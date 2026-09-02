import { useEffect, useState } from "react";
import { Animated, type ViewStyle } from "react-native";

/**
 * A pulsing placeholder box — used to build loading skeletons so a screen
 * shows "something is coming" immediately instead of a blank gap between
 * "loading" and content popping in abruptly.
 *
 * `color` sets an explicit backgroundColor (inline style, so it reliably
 * wins over the `bg-muted` default) for use on dark/colored backgrounds
 * (e.g. Home's gradient hero) where the light-mode `muted` gray would be
 * invisible.
 */
export function Skeleton({ style, className, color }: { style?: ViewStyle; className?: string; color?: string }) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-muted rounded-md ${className ?? ""}`}
      style={[{ opacity }, color ? { backgroundColor: color } : null, style]}
    />
  );
}
