import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const TAB_TITLES = {
  "/": "Reef Market",
  "/browse": "Browse",
  "/messages": "Messages",
  "/orders": "Orders",
  "/learn": "Learn",
  "/profile": "Profile",
  "/search": "Search",
};

export default function TopNav({ canGoBack, onBack, childTitle }) {
  const location = useLocation();
  const tabTitle = TAB_TITLES[location.pathname];
  const title = childTitle || tabTitle || "Reef Market";
  const isTab = !!tabTitle;

  return (
    <header className="safe-area-top bg-background/95 backdrop-blur-sm border-b border-border flex-shrink-0 z-40">
      <div className="max-w-lg mx-auto w-full flex items-center h-12 px-4 gap-3">
        {!isTab && canGoBack && (
          <button
            onClick={onBack}
            className="p-1 -ml-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <h1 className="text-base font-semibold text-foreground flex-1 truncate">
          {title}
        </h1>
      </div>
    </header>
  );
}