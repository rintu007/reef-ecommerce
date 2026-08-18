-- refundOrder() was reusing 'doa_claim' to mean "refund completed", which is
-- indistinguishable from an active DOA dispute in every order status display
-- across both apps — buyers/sellers had no way to tell "refunded" from
-- "there's an open claim". Add a distinct status for it.
alter type order_status add value if not exists 'refunded';
