import { useLocation, Outlet } from "react-router-dom";
import EULAModal, { hasAcceptedEULA, markEULAAccepted } from "@/components/moderation/EULAModal";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import TopNav from "./TopNav";
import BottomNav from "./BottomNav";
import { useRef, lazy, Suspense, useEffect, useCallback, useState } from "react";
import { useNavHistory } from "@/lib/NavHistoryContext";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

// Lazy-load all preserved tab pages
const Home = lazy(() => import("@/pages/Home"));
const Browse = lazy(() => import("@/pages/Browse"));
const Messages = lazy(() => import("@/pages/Messages"));
const Orders = lazy(() => import("@/pages/Orders"));
const Learn = lazy(() => import("@/pages/Learn"));
const Profile = lazy(() => import("@/pages/Profile"));
const Search = lazy(() => import("@/pages/SearchPage"));
const Services = lazy(() => import("@/pages/Services"));

const TABS = ["/", "/browse", "/messages", "/orders", "/learn", "/profile", "/search", "/services"];

const TAB_COMPONENTS = {
  "/": Home,
  "/browse": Browse,
  "/messages": Messages,
  "/orders": Orders,
  "/learn": Learn,
  "/profile": Profile,
  "/search": Search,
  "/services": Services,
};

const PAGE_TITLES = {
  "/sell": "New Listing",
  "/seller-dashboard": "Seller Dashboard",
  "/admin": "Admin",
  "/help": "Help & Feedback",
  "/privacy": "Privacy Policy",
};

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl bg-muted animate-pulse h-24" />
      ))}
    </div>
  );
}

function PreservedTab({ path, isActive }) {
  const Component = TAB_COMPONENTS[path];
  return (
    <div style={{ display: isActive ? "block" : "none" }}>
      <Suspense fallback={<TabSkeleton />}>
        <Component />
      </Suspense>
    </div>
  );
}

const AUTH_REQUIRED_TABS = new Set(["/messages", "/orders", "/profile"]);

export default function AppShell() {
  const location = useLocation();
  const { goBack, canGoBack } = useNavHistory();
  const { isAuthenticated, user } = useAuth();
  const [eulaAccepted, setEulaAccepted] = useState(hasAcceptedEULA());

  // Sync EULA acceptance from user profile (persists across devices)
  useEffect(() => {
    if (!eulaAccepted && user?.eula_accepted) {
      markEULAAccepted();
      setEulaAccepted(true);
    }
  }, [user]);

  const visited = useRef(new Set());
  const scrollPositions = useRef({});
  const mainRef = useRef(null);

  // Track page views for visitor analytics
  useEffect(() => {
    // Get or create a session ID for this browser session
    let sessionId = sessionStorage.getItem("rm_session_id");
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("rm_session_id", sessionId);
    }
    const logVisit = async () => {
      try {
        let userEmail = "";
        let isGuest = true;
        try {
          const me = await base44.auth.me();
          userEmail = me?.email || "";
          isGuest = false;
        } catch (e) { /* guest */ }
        await base44.entities.VisitorLog.create({
          path: location.pathname,
          session_id: sessionId,
          user_email: userEmail,
          is_guest: isGuest,
        });
      } catch (e) { /* silently fail */ }
    };
    logVisit();
  }, [location.pathname]);

  // Determine if current path is a preserved tab
  const currentTab = TABS.find((p) =>
    p === "/" ? location.pathname === "/" : location.pathname === p
  );
  const isTab = !!currentTab;

  // Track visited tabs for mount-once behavior
  if (currentTab) visited.current.add(currentTab);

  // Restore scroll position when switching tabs; reset scroll for child screens
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    if (currentTab) {
      el.scrollTop = scrollPositions.current[currentTab] ?? 0;
    } else {
      // Child screen — always scroll to top
      el.scrollTop = 0;
    }
  }, [location.pathname, currentTab]);

  const handleScroll = useCallback(() => {
    const el = mainRef.current;
    if (el && currentTab) {
      scrollPositions.current[currentTab] = el.scrollTop;
    }
  }, [currentTab]);

  const childTitle = PAGE_TITLES[location.pathname] || "";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
      <div className="relative flex flex-col bg-background overflow-hidden w-full h-full md:w-[430px] md:h-[932px] md:max-h-[100dvh] md:rounded-3xl md:shadow-2xl" style={{height: '100dvh'}}>
      {!eulaAccepted && <EULAModal onAccept={() => setEulaAccepted(true)} />}
      {eulaAccepted && <AnnouncementPopup />}
      <TopNav canGoBack={canGoBack} onBack={goBack} childTitle={childTitle} />

      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto max-w-lg mx-auto w-full"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}
      >
        {TABS.map((p) => {
          if (!visited.current.has(p)) return null;
          if (!isAuthenticated && AUTH_REQUIRED_TABS.has(p)) return null;
          return (
            <PreservedTab key={p} path={p} isActive={p === currentTab} />
          );
        })}

        {!isTab && (
          <Suspense fallback={<TabSkeleton />}>
            <Outlet />
          </Suspense>
        )}
      </main>

      <BottomNav />
    </div>
    </div>
  );
}