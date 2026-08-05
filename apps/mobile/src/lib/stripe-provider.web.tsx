import type { ReactElement } from "react";

/**
 * Web build of stripe-provider.tsx — deliberately never imports
 * @stripe/stripe-react-native (it isn't web-compatible; see the sibling
 * file's comment). Checkout on the web target shows its own "not available"
 * state instead (listing/[id]/checkout.web.tsx).
 */
export function StripeProvider({ children }: { children: ReactElement }) {
  return children;
}
