import { Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { themeColors } from "@/lib/theme-colors";

const PALETTE = [themeColors.primary, themeColors.accent, themeColors.destructive, "#8a94a6"];

/** Lightweight react-native-svg bar chart — no charting dependency exists in apps/mobile (unlike web's recharts). */
export function MiniBarChart({ data, height = 100 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = data.length > 0 ? 100 / data.length : 100;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (height - 4);
          return (
            <Rect
              key={i}
              x={i * barWidth + barWidth * 0.15}
              y={height - barHeight}
              width={barWidth * 0.7}
              height={barHeight}
              fill={themeColors.primary}
              rx={1}
            />
          );
        })}
      </Svg>
    </View>
  );
}

export function MiniPieChart({ data, size = 120 }: { data: { label: string; value: number }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2;
  let startAngle = -90;

  const slices =
    total > 0
      ? data
          .filter((d) => d.value > 0)
          .map((d, i) => {
            const angle = (d.value / total) * 360;
            const endAngle = startAngle + angle;
            const path = describeArc(r, r, r, startAngle, endAngle);
            startAngle = endAngle;
            return { path, color: PALETTE[i % PALETTE.length], label: d.label, value: d.value };
          })
      : [];

  return (
    <View className="flex-row items-center gap-4">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.length > 0 ? (
          slices.map((s, i) => <Path key={i} d={s.path} fill={s.color} />)
        ) : (
          <Path d={describeArc(r, r, r, 0, 359.99)} fill={themeColors.border} />
        )}
      </Svg>
      <View className="gap-1">
        {data.map((d, i) => (
          <View key={i} className="flex-row items-center gap-1.5">
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: PALETTE[i % PALETTE.length] }} />
            <Text className="text-xs text-muted-foreground">
              {d.label}: {d.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", cx, cy, "L", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y, "Z"].join(" ");
}
