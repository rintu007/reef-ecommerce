/**
 * notifySellerOfSale
 * Sends a message + email to seller when an item sells.
 * Gives clear instructions for shipping vs. local pickup.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { order_id } = await req.json();

  const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
  const order = orders[0];
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

  const isPickup = order.shipping_method === 'local_pickup';

  // In-app message to seller
  let messageContent = `🎉 Your item "${order.listing_title}" has been sold!\n\n`;
  messageContent += `Buyer: ${order.buyer_email}\n`;
  messageContent += `Sale price: $${order.price?.toFixed(2)}\n\n`;

  if (isPickup) {
    messageContent += `📍 LOCAL PICKUP ORDER\n`;
    messageContent += `Address: ${order.pickup_address || 'N/A'}\n`;
    messageContent += order.pickup_time ? `Scheduled time: ${order.pickup_time}\n\n` : '\n';
    messageContent += `Next step: When the buyer picks up the item, go to your Orders tab and tap "Mark as Picked Up". The buyer will be asked to confirm, and funds will be released to you once they do.\n\n`;
    messageContent += `If the buyer doesn't respond within 72 hours, funds are released automatically.`;
  } else {
    messageContent += `🚚 SHIPPING ORDER\n`;
    messageContent += `Next step: Ship the item and then go to your Orders tab to enter the tracking number. Funds will be released to you automatically once delivery is confirmed by the tracking carrier.`;
  }

  const conversationId = [order.seller_email, 'system'].sort().join('|');
  await base44.asServiceRole.entities.Message.create({
    conversation_id: conversationId,
    listing_id: order.listing_id,
    sender_email: 'system',
    receiver_email: order.seller_email,
    content: messageContent,
  });

  // Email to seller
  const emailBody = isPickup
    ? `Hi,\n\nGreat news — your item "${order.listing_title}" has been sold for $${order.price?.toFixed(2)}!\n\n📍 LOCAL PICKUP\nThe buyer will pick up the item at:\n${order.pickup_address || 'Your specified address'}\n${order.pickup_time ? `Scheduled time: ${order.pickup_time}\n` : ''}\nWhat to do next:\n1. Arrange the pickup with the buyer (they have your address)\n2. Once the buyer collects the item, open your Orders tab and tap "Mark as Picked Up"\n3. The buyer will be notified and asked to confirm pickup\n4. Funds will be released to your bank account once they confirm (or automatically after 72 hours)\n\nNote: Reef Market deducts a 5% platform fee + Stripe processing fee from your payout.\n\n— The Reef Market Team`
    : `Hi,\n\nGreat news — your item "${order.listing_title}" has been sold for $${order.price?.toFixed(2)}!\n\n🚚 SHIPPING ORDER\nWhat to do next:\n1. Pack and ship the item to the buyer\n2. Once shipped, open your Orders tab and enter the tracking number\n3. Funds will be released to your bank account automatically once delivery is confirmed by the tracking carrier\n\nNote: Reef Market deducts a 5% platform fee + Stripe processing fee from your payout.\n\n— The Reef Market Team`;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: order.seller_email,
    subject: `🎉 Your item "${order.listing_title}" sold on Reef Market!`,
    body: emailBody,
  }).catch(() => {});

  return Response.json({ success: true });
});