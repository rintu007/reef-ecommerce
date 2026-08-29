import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id } = await req.json();

    // Fetch the order
    const orders = await base44.entities.Order.filter({ id: order_id });
    const order = orders[0];

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only buyer can cancel
    if (order.buyer_email !== user.email) {
      return Response.json({ error: 'Not authorized to cancel this order' }, { status: 403 });
    }

    // Only pending orders can be cancelled
    if (order.status !== 'pending') {
      return Response.json({ error: 'Only pending orders can be cancelled' }, { status: 400 });
    }

    // Update order to cancelled
    await base44.entities.Order.update(order.id, { status: 'cancelled' });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});