import {
  cancelOrder,
  confirmPickup,
  confirmReceipt,
  createReview,
  deleteOrder,
  denyDoaClaim,
  denyPickup,
  fileDoaClaim,
  getOrder,
  getOwnProfile,
  markPickedUp,
  ORDER_STATUS_META,
  refundOrder,
  shipOrder,
  type Order,
} from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Star } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}

function ReviewForm({ listingId }: { listingId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await createReview(apiClient, { listing_id: listingId, rating, comment: comment || undefined });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <Text className="text-sm text-emerald-600 pt-3 border-t border-border mt-3">Thanks for your review!</Text>;
  }

  return (
    <View className="pt-3 border-t border-border mt-3 gap-2">
      <Text className="text-sm font-semibold text-foreground">Leave a Review</Text>
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)}>
            <Star size={26} color="#f59e0b" fill={star <= rating ? "#f59e0b" : "transparent"} />
          </Pressable>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        placeholder="Optional comment"
        placeholderTextColor={themeColors.mutedForeground}
        className="border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground"
        style={{ minHeight: 70 }}
      />
      {error && <Text className="text-sm text-destructive">{error}</Text>}
      <Pressable onPress={handleSubmit} disabled={submitting} className="self-start bg-primary rounded-xl px-4 py-2.5">
        <Text className="text-sm font-semibold text-white">{submitting ? "Submitting…" : "Submit Review"}</Text>
      </Pressable>
    </View>
  );
}

const DOA_ELIGIBLE_STATUSES = ["confirmed", "shipped", "delivered", "awaiting_pickup", "pickup_confirmed", "completed"];

function DoaClaimSection({ order, onFiled }: { order: Order; onFiled: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (order.doa_claim_status === "pending") {
    return (
      <View className="pt-3 border-t border-border mt-3">
        <Text className="text-sm font-semibold text-amber-700">Claim under review</Text>
        <Text className="text-sm text-muted-foreground mt-0.5">{order.doa_claim_reason}</Text>
      </View>
    );
  }

  if (!DOA_ELIGIBLE_STATUSES.includes(order.status)) return null;

  if (!open) {
    return (
      <Pressable testID="file-claim-button" onPress={() => setOpen(true)} className="self-start bg-red-100 rounded-xl px-4 py-2.5 mt-2">
        <Text className="text-sm font-semibold text-red-800">
          {order.doa_claim_status === "denied" ? "File a New Claim" : "File a Claim"}
        </Text>
      </Pressable>
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await fileDoaClaim(apiClient, order.id, { reason });
      onFiled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to file claim");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="pt-3 border-t border-border mt-3 gap-2">
      <Text className="text-sm font-semibold text-foreground">File a DOA Claim</Text>
      <TextInput
        testID="claim-reason-input"
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        placeholder="What happened? (e.g. arrived dead, photo taken within 2 hours)"
        placeholderTextColor={themeColors.mutedForeground}
        className="border border-border bg-background rounded-xl px-3 py-2.5 text-sm text-foreground"
        style={{ minHeight: 70 }}
      />
      {error && <Text className="text-sm text-destructive">{error}</Text>}
      <Pressable
        testID="submit-claim-button"
        onPress={submit}
        disabled={submitting || !reason.trim()}
        className="self-start bg-red-600 rounded-xl px-4 py-2.5"
      >
        {submitting ? <ActivityIndicator color={themeColors.white} /> : <Text className="text-sm font-semibold text-white">Submit Claim</Text>}
      </Pressable>
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { addItem } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [added, setAdded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return getOrder(apiClient, id)
      .then(({ order }) => setOrder(order))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!session) return;
    getOwnProfile(apiClient)
      .then(({ profile }) => setIsAdmin(profile.role === "admin"))
      .catch(() => {});
  }, [session]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!order) return;
    const confirmed = await confirmAsync("Delete this order?", "This can't be undone.", "Delete");
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await deleteOrder(apiClient, order.id);
      safeGoBack(router);
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to delete order");
    } finally {
      setBusy(false);
    }
  }

  function handleReAddToCart() {
    if (!order?.listing_id) return;
    addItem({
      listingId: order.listing_id,
      quantity: order.quantity,
      shippingMethod: order.shipping_method === "local_pickup" ? "local_pickup" : "shipping",
      pickupTime: order.pickup_time ?? undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading || !order) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={themeColors.primary} />
      </SafeAreaView>
    );
  }

  const role: "buyer" | "seller" | "admin" = isAdmin ? "admin" : order.buyer_id === session?.user.id ? "buyer" : "seller";
  const canReview = role === "buyer" && order.status === "completed" && !!order.listing_id;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">Order Details</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="rounded-xl border border-border bg-card p-4 gap-3">
          <View className="flex-row gap-3">
            <View className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
              {order.listing_photo && <Image source={{ uri: order.listing_photo }} style={{ width: 64, height: 64 }} contentFit="cover" />}
            </View>
            <View className="flex-1">
              {order.listing_id ? (
                <Link href={`/listing/${order.listing_id}`} asChild>
                  <Pressable>
                    <Text className="font-semibold text-sm text-primary" numberOfLines={2}>
                      {order.listing_title}
                    </Text>
                  </Pressable>
                </Link>
              ) : (
                <Text className="font-semibold text-sm text-foreground" numberOfLines={2}>
                  {order.listing_title}
                </Text>
              )}
              <Text className="text-sm text-muted-foreground">Qty {order.quantity}</Text>
            </View>
          </View>

          <View className="border-t border-border pt-2 gap-1.5">
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-sm text-muted-foreground">Status</Text>
              <OrderStatusBadge status={order.status} />
            </View>
            <Text className="text-xs text-muted-foreground -mt-1 mb-1">{ORDER_STATUS_META[order.status].description}</Text>
            <Row label="Total charged" value={order.total_charged != null ? `$${order.total_charged.toFixed(2)}` : "—"} />
            <Row label="Delivery" value={order.shipping_method === "shipping" ? "Shipping" : "Local pickup"} />
            {order.tracking_number && (
              <Row label="Tracking" value={order.carrier ? `${order.tracking_number} (${order.carrier})` : order.tracking_number} />
            )}
            {order.pickup_address && <Row label="Pickup address" value={order.pickup_address} />}
            {order.pickup_time && <Row label="Pickup time" value={order.pickup_time} />}
          </View>

          {error && <Text className="text-sm text-destructive">{error}</Text>}

          {role === "buyer" && order.status === "pending" && (
            <View className="flex-row gap-2">
              {order.listing_id && (
                <Pressable onPress={handleReAddToCart} disabled={busy} className="bg-muted rounded-xl px-4 py-2.5">
                  <Text className="text-sm font-semibold text-foreground">{added ? "Added ✓" : "Re-add to Cart"}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => run(() => cancelOrder(apiClient, order.id))} disabled={busy} className="bg-red-100 rounded-xl px-4 py-2.5">
                <Text className="text-sm font-semibold text-red-800">Cancel Order</Text>
              </Pressable>
            </View>
          )}

          {role === "buyer" && order.status === "cancelled" && (
            <Pressable onPress={handleDelete} disabled={busy} className="self-start bg-red-100 rounded-xl px-4 py-2.5">
              <Text className="text-sm font-semibold text-red-800">Delete Order</Text>
            </Pressable>
          )}

          {role === "buyer" && (order.status === "confirmed" || order.status === "shipped") && (
            <Pressable onPress={() => run(() => confirmReceipt(apiClient, order.id))} disabled={busy} className="self-start bg-primary rounded-xl px-4 py-2.5">
              <Text className="text-sm font-semibold text-white">Confirm Receipt</Text>
            </Pressable>
          )}

          {role === "buyer" && order.status === "awaiting_pickup" && (
            <View className="flex-row gap-2">
              <Pressable onPress={() => run(() => confirmPickup(apiClient, order.id))} disabled={busy} className="bg-primary rounded-xl px-4 py-2.5">
                <Text className="text-sm font-semibold text-white">Confirm Pickup</Text>
              </Pressable>
              <Pressable onPress={() => run(() => denyPickup(apiClient, order.id))} disabled={busy} className="bg-red-100 rounded-xl px-4 py-2.5">
                <Text className="text-sm font-semibold text-red-800">I Didn&apos;t Pick This Up</Text>
              </Pressable>
            </View>
          )}

          {role === "seller" && order.status === "confirmed" && order.shipping_method === "shipping" && (
            <View className="gap-2">
              <TextInput
                value={trackingNumber}
                onChangeText={setTrackingNumber}
                placeholder="Tracking number"
                placeholderTextColor={themeColors.mutedForeground}
                className="border border-border bg-background rounded-xl px-3 py-2.5 text-sm text-foreground"
              />
              <TextInput
                value={carrier}
                onChangeText={setCarrier}
                placeholder="Carrier (optional)"
                placeholderTextColor={themeColors.mutedForeground}
                className="border border-border bg-background rounded-xl px-3 py-2.5 text-sm text-foreground"
              />
              <Pressable
                onPress={() => run(() => shipOrder(apiClient, order.id, { tracking_number: trackingNumber, carrier: carrier || undefined }))}
                disabled={busy || !trackingNumber}
                className="self-start bg-primary rounded-xl px-4 py-2.5"
              >
                <Text className="text-sm font-semibold text-white">Mark Shipped</Text>
              </Pressable>
            </View>
          )}

          {role === "seller" && order.status === "confirmed" && order.shipping_method === "local_pickup" && (
            <Pressable onPress={() => run(() => markPickedUp(apiClient, order.id))} disabled={busy} className="self-start bg-primary rounded-xl px-4 py-2.5">
              <Text className="text-sm font-semibold text-white">Mark Picked Up</Text>
            </Pressable>
          )}

          {role === "admin" && order.payment_intent_id && order.status !== "doa_claim" && order.status !== "cancelled" && (
            <View className="flex-row gap-2">
              <Pressable onPress={() => run(() => refundOrder(apiClient, order.id, "refund"))} disabled={busy} className="bg-red-100 rounded-xl px-4 py-2.5">
                <Text className="text-sm font-semibold text-red-800">Refund via Stripe</Text>
              </Pressable>
              <Pressable
                onPress={() => run(() => refundOrder(apiClient, order.id, "store_credit"))}
                disabled={busy}
                className="bg-muted rounded-xl px-4 py-2.5"
              >
                <Text className="text-sm font-semibold text-foreground">Issue Store Credit</Text>
              </Pressable>
            </View>
          )}

          {role === "admin" && order.doa_claim_status && (
            <View className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <Text className="text-sm font-semibold text-amber-900">
                DOA claim: <Text className="capitalize">{order.doa_claim_status}</Text>
              </Text>
              {order.doa_claim_reason && <Text className="text-sm text-amber-800 mt-1">{order.doa_claim_reason}</Text>}
              {order.doa_claim_status === "pending" && (
                <Pressable onPress={() => run(() => denyDoaClaim(apiClient, order.id))} disabled={busy} className="self-start bg-muted rounded-lg px-3 py-2 mt-2">
                  <Text className="text-xs font-semibold text-foreground">Deny Claim</Text>
                </Pressable>
              )}
            </View>
          )}

          {canReview && order.listing_id && <ReviewForm listingId={order.listing_id} />}

          {role === "buyer" && <DoaClaimSection order={order} onFiled={load} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
