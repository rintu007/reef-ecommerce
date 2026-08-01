import { useState, useRef, useCallback } from "react";

/**
 * Reusable pull-to-refresh hook.
 * Attach onTouchStart/onTouchMove/onTouchEnd to the scrollable container.
 * pullDistance and isRefreshing drive the indicator UI.
 */
export function usePullToRefresh(onRefresh) {
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e) => {
    const el = e.currentTarget;
    if (el.scrollTop === 0) {
      const dist = Math.max(0, Math.min(72, e.touches[0].clientY - touchStartY.current));
      setPullDistance(dist);
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= 60) {
      setIsRefreshing(true);
      setPullDistance(0);
      await onRefresh();
      setIsRefreshing(false);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  return { pullDistance, isRefreshing, onTouchStart, onTouchMove, onTouchEnd };
}