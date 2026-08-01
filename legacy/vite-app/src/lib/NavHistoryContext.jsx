/**
 * NavHistoryContext — per-tab navigation stack for WebView-style back navigation.
 *
 * Each bottom tab maintains its own history stack. When you push a child route
 * (e.g. /listing/123) it is recorded under the active tab. Pressing "Back" pops
 * that stack instead of relying on the browser history API, which behaves
 * inconsistently inside native WebViews.
 */
import { createContext, useContext, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NavHistoryContext = createContext(null);

const ROOT_TABS = ["/", "/browse", "/messages", "/orders", "/learn", "/profile", "/search"];

function getActiveTab(pathname) {
  // Exact tab match
  if (ROOT_TABS.includes(pathname)) return pathname;
  // Child routes — determine which tab "owns" them
  if (pathname.startsWith("/listing") || pathname.startsWith("/category") || pathname.startsWith("/browse")) return "/";
  if (pathname.startsWith("/seller/")) return "/";
  if (pathname.startsWith("/sell") || pathname.startsWith("/seller-dashboard")) return "/profile";
  if (pathname.startsWith("/help") || pathname.startsWith("/privacy")) return "/profile";
  if (pathname.startsWith("/admin")) return "/profile";
  return "/";
}

export function NavHistoryProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  // stacks[tab] = ["/", "/listing/abc", ...]
  const stacks = useRef({});

  const currentTab = getActiveTab(location.pathname);

  // Push a new route onto the active tab stack
  const push = useCallback((to, options) => {
    const tab = getActiveTab(location.pathname);
    if (!stacks.current[tab]) stacks.current[tab] = [location.pathname];
    stacks.current[tab].push(to);
    navigate(to, options);
  }, [location.pathname, navigate]);

  // Go back within the tab stack, or to the tab root if stack is empty
  const goBack = useCallback(() => {
    const tab = getActiveTab(location.pathname);
    const stack = stacks.current[tab] || [];
    if (stack.length > 1) {
      stack.pop();
      const prev = stack[stack.length - 1];
      navigate(prev, { replace: true });
    } else {
      // Fall back to browser back, then root tab
      navigate(-1);
    }
  }, [location.pathname, navigate]);

  // Clear a tab's stack (called when user taps a bottom tab)
  const resetTab = useCallback((tab) => {
    stacks.current[tab] = [tab];
    navigate(tab);
  }, [navigate]);

  // Whether we can go back in the current tab stack
  const canGoBack = !ROOT_TABS.includes(location.pathname);

  return (
    <NavHistoryContext.Provider value={{ push, goBack, resetTab, canGoBack, currentTab }}>
      {children}
    </NavHistoryContext.Provider>
  );
}

export function useNavHistory() {
  const ctx = useContext(NavHistoryContext);
  if (!ctx) throw new Error("useNavHistory must be used inside NavHistoryProvider");
  return ctx;
}