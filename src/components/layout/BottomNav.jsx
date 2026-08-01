import { useLocation } from "react-router-dom";
import { Home, Search, PlusCircle, MessageCircle, ShoppingBag, BookOpen, User, LayoutDashboard, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useNavHistory } from "@/lib/NavHistoryContext";
import { useUserPrefs } from "@/lib/UserPrefsContext";
import { getT } from "@/lib/i18n";

const ALL_TAB_DEFS = [
  { path: "/", icon: Home, key: "home" },
  { path: "/search", icon: Search, key: "browse" },
  { path: "/sell", icon: PlusCircle, key: "sell" },
  { path: "/messages", icon: MessageCircle, key: "messages" },
  { path: "/orders", icon: ShoppingBag, key: "orders" },
  { path: "/services", icon: Wrench, key: "services" },
  { path: "/profile", icon: User, key: "profile" },
];

const GUEST_TAB_DEFS = [
  { path: "/", icon: Home, key: "home" },
  { path: "/search", icon: Search, key: "browse" },
  { path: "/learn", icon: BookOpen, key: "learn" },
];


function TabItem({ path, icon: Icon, label, isActive, onTap }) {
  return (
    <button
      onClick={() => onTap(path)}
      className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-0 relative"
    >
      <div className="relative">
        <Icon
          className={cn(
            "w-[26px] h-[26px] transition-colors",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
          strokeWidth={isActive ? 2.5 : 1.8}
        />
      </div>
      <span
        className={cn(
          "text-[10px] font-medium transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </button>
  );
}

export default function BottomNav() {
  const location = useLocation();
  const { isAuthenticated, navigateToLogin } = useAuth();
  const { resetTab, push } = useNavHistory();
  const { language } = useUserPrefs();
  const t = getT(language);

  const tabs = (isAuthenticated ? ALL_TAB_DEFS : GUEST_TAB_DEFS).map(tab => ({
    ...tab,
    label: t(tab.key),
  }));

  const handleTabTap = (path) => {
    if (!isAuthenticated && (path === "/sell" || path === "/messages" || path === "/orders" || path === "/profile")) {
      navigateToLogin();
      return;
    }
    if (location.pathname === path) {
      resetTab(path);
    } else {
      push(path);
    }
  };

  return (
    <nav className="bg-card/95 backdrop-blur-md border-t border-border shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around px-1 pt-1.5 pb-1 max-w-lg mx-auto h-14">
        {tabs.map(({ path, icon, label }) => {
          const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
          return (
            <TabItem key={path} path={path} icon={icon} label={label} isActive={isActive} onTap={handleTabTap} />
          );
        })}

        {/* Guest: Sell + Sign In */}
        {!isAuthenticated && (
          <>
            <TabItem
              path="/sell"
              icon={PlusCircle}
              label={t("sell")}
              isActive={false}
              onTap={handleTabTap}
            />
            <button
              onClick={navigateToLogin}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-0"
            >
              <User className="w-[26px] h-[26px] text-primary" strokeWidth={2.5} />
              <span className="text-[10px] font-medium text-primary">{t("sign_in").split(" /")[0]}</span>
            </button>
          </>
        )}

        {/* Authenticated extras */}
        {isAuthenticated && (
          <TabItem
            path="/seller-dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            isActive={location.pathname === "/seller-dashboard"}
            onTap={handleTabTap}
          />
        )}
        
      </div>
    </nav>
  );
}