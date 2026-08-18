import { ORDER_STATUS_META, type OrderStatus } from "@reef-market/shared";
import { Text, View } from "react-native";

/** Colored pill + human label for an order status — see packages/shared/src/constants/order-status.ts. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${meta.badgeClassName}`}>
      <Text className={`text-xs font-semibold ${meta.badgeClassName}`}>{meta.label}</Text>
    </View>
  );
}
