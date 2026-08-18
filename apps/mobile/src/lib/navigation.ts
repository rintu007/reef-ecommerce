import type { useRouter } from "expo-router";

type Router = ReturnType<typeof useRouter>;

/**
 * `router.back()` silently does nothing if the current screen ended up as
 * the root of the stack (deep link, a prior `replace`, Fast Refresh during
 * dev, or — per React Navigation's `navigate()` semantics — landing back on
 * an already-mounted instance of the same dynamic route further down a long
 * chain like seller → listing → seller → listing…). Reported as "I can't
 * back out" after drilling several levels deep into seller/listing pages.
 * Falls back to Home instead of doing nothing.
 */
export function safeGoBack(router: Router, fallback: Parameters<Router["replace"]>[0] = "/(tabs)/home") {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
