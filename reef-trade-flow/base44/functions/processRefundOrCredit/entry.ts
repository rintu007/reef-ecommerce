/**
 * processRefundOrCredit
 * Processes a DOA (dead on arrival) or dispute refund/credit for an order.
 * The app's processing fee (APP_FEE_PERCENT) is always non-refundable.
 *
 * Body: {
 *   order_id: string,
 *   action: "refund" | "store_credit",
 *   reason: string,
 *   photo_url?: string   // proof photo (required for DOA claims)
 * }
 *
 * Admin only.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const APP_FEE_PERCENT = 0.05; // 5% platform fee — never refunded

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });

  const body = await req.json();
  const { order_id, action, reason, photo_url } = body;

  if (!order_id || !action || !reason) {
    return Response.json({ error: 'Missing required fields: order_id, action, reason' }, { status: 400 });
  }
  if (!['refund', 'store_credit'].includes(action)) {
    return Response.json({ error: 'action must be "refund" or "store_credit"' }, { status: 400 });
  }

  // Fetch the order
  const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
  const order = orders[0];
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

  if (['cancelled', 'doa_claim'].includes(order.status)) {
    return Response.json({ error: 'Order has already been refunded or cancelled' }, { status: 409 });
  }

  const orderTotal = order.price * (order.quantity || 1);
  const platformFee = parseFloat((orderTotal * APP_FEE_PERCENT).toFixed(2));
  const refundableAmount = parseFloat((orderTotal - platformFee).toFixed(2));

  if (action === 'store_credit') {
    // Issue store credit to buyer
    const credit = await base44.asServiceRole.entities.UserCredit.create({
      user_email: order.buyer_email,
      amount: refundableAmount,
      reason: reason,
      order_id: order_id,
      issued_by: user.email,
      status: 'available',
    });

    // Update order status
    await base44.asServiceRole.entities.Order.update(order_id, {
      status: 'doa_claim',
      notes: `Store credit issued: $${refundableAmount}. Reason: ${reason}. ${photo_url ? `Photo: ${photo_url}` : ''}`,
    });

    return Response.json({
      success: true,
      action: 'store_credit',
      credit_issued: refundableAmount,
      platform_fee_retained: platformFee,
      credit_record: credit,
      message: `Store credit of $${refundableAmount} issued to ${order.buyer_email}. Platform fee of $${platformFee} (${APP_FEE_PERCENT * 100}%) is non-refundable.`,
    });
  }

  if (action === 'refund') {
    // Mark order as refunded — actual payment refund must be triggered via payment provider (Stripe etc.)
    await base44.asServiceRole.entities.Order.update(order_id, {
      status: 'doa_claim',
      notes: `Refund approved: $${refundableAmount}. Platform fee $${platformFee} retained. Reason: ${reason}. ${photo_url ? `Photo: ${photo_url}` : ''}`,
    });

    return Response.json({
      success: true,
      action: 'refund',
      refundable_amount: refundableAmount,
      platform_fee_retained: platformFee,
      message: `Refund of $${refundableAmount} approved for order ${order_id}. Platform fee of $${platformFee} (${APP_FEE_PERCENT * 100}%) is non-refundable. Trigger the actual refund via your payment provider.`,
    });
  }
});