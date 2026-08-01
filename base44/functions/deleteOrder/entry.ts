import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return Response.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const orders = await base44.entities.Order.filter({ id: orderId });
    if (!orders.length) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];

    // Only allow deletion if order is cancelled and user is buyer or admin
    if (order.status !== 'cancelled') {
      return Response.json({ error: 'Only cancelled orders can be deleted' }, { status: 400 });
    }

    if (user.role !== 'admin' && order.buyer_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await base44.asServiceRole.entities.Order.delete(orderId);

    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});