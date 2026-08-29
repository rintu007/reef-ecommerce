import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, tracking_number, carrier } = await req.json();

    // Fetch order
    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    const order = orders[0];
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Create message from system to buyer
    const conversationId = [order.buyer_email, 'system'].sort().join('|');
    const messageContent = `📦 Your item "${order.listing_title}" has been shipped!\n\n` +
      `Tracking Number: ${tracking_number}\n` +
      `Carrier: ${carrier || 'Unknown'}\n\n` +
      `You can track your shipment in your Orders page. We'll automatically notify you when it's delivered.`;

    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversationId,
      listing_id: order.listing_id,
      sender_email: 'system',
      receiver_email: order.buyer_email,
      content: messageContent,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error notifying buyer:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});