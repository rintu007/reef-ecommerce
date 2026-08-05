/**
 * Web build of stripe-checkout.ts. @stripe/stripe-react-native isn't
 * web-bundleable (see stripe-provider.web.tsx) — this stub exists purely so
 * listing/[id]/checkout.tsx's module graph never reaches the real package
 * when Metro bundles for web, even though checkout.web.tsx is what actually
 * renders on that platform. Never expected to be called.
 */
export function useCheckoutStripe() {
  const unreachable = () => Promise.reject(new Error("Stripe checkout is not available on web"));
  return { initPaymentSheet: unreachable, presentPaymentSheet: unreachable };
}
