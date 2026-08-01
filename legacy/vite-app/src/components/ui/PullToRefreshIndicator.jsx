/**
 * iOS-style pull-to-refresh spinner indicator.
 * Place at the top of any scrollable content area.
 */
export default function PullToRefreshIndicator({ pullDistance, isRefreshing }) {
  if (pullDistance === 0 && !isRefreshing) return null;
  const height = isRefreshing ? 44 : pullDistance * 0.65;
  const opacity = isRefreshing ? 1 : Math.min(1, pullDistance / 60);

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-150"
      style={{ height }}
    >
      <div
        className="flex items-center justify-center w-7 h-7 rounded-full bg-card shadow-sm border border-border"
        style={{ opacity }}
      >
        <div
          className={`w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full ${isRefreshing ? "animate-spin" : ""}`}
          style={!isRefreshing ? { transform: `rotate(${pullDistance * 3.6}deg)` } : {}}
        />
      </div>
    </div>
  );
}