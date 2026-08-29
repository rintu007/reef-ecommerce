/**
 * checkAndGrantVerifiedSeller
 * Called internally after an order completes.
 * Counts the seller's completed sales and grants verified_seller badge if >= 10.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req, { skipAuth: true });

  const body = await req.json().catch(() => ({}));
  // Support both direct calls { seller_email } and entity automation payloads { data: { seller_email } }
  const seller_email = body.seller_email || body.data?.seller_email;
  if (!seller_email) return Response.json({ error: 'seller_email required' }, { status: 400 });

  // Count all completed orders for this seller
  const completedOrders = await base44.asServiceRole.entities.Order.filter({
    seller_email,
    status: 'completed',
  });
  const count = completedOrders.length;

  // Find the seller user record
  const users = await base44.asServiceRole.entities.User.filter({ email: seller_email });
  const sellerUser = users[0];
  if (!sellerUser) return Response.json({ error: 'Seller not found' }, { status: 404 });

  // Update completed_sales_count
  const updateData = { completed_sales_count: count };

  // Grant verified badge if they hit 10 and don't already have it
  if (count >= 10 && !sellerUser.verified_seller) {
    updateData.verified_seller = true;
    // Send congratulations email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: seller_email,
      subject: '🎉 You\'re now a Verified Seller on Reef Market!',
      body: `Congratulations!\n\nYou've completed 10 successful sales and have been awarded the Verified Seller badge on Reef Market.\n\nAs a verified seller, when you ship coral your funds will be released immediately when you upload your tracking number — no waiting for delivery confirmation!\n\nKeep up the great work.\n\n— The Reef Market Team`,
    }).catch(() => {});

    console.log(`Granted verified_seller badge to ${seller_email} after ${count} sales.`);
  }

  await base44.asServiceRole.entities.User.update(sellerUser.id, updateData);

  return Response.json({ success: true, completed_sales: count, verified: count >= 10 });
});