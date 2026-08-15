import { useState } from "react";

/**
 * Hook générique de refresh :
 * - exécute une action asynchrone optionnelle (ex : refetch API)
 * - incrémente une clé pour forcer un remount visuel
 * - expose un flag `refreshing`
 */
export function useTokenRefresh(onExternalRefresh?: () => Promise<void>) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingDrag, setRefreshingDrag] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onExternalRefresh) await onExternalRefresh();
    } finally {
      setRefreshing(false);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDragRefresh = async () => {
    setRefreshingDrag(true);
    try {
      if (onExternalRefresh) await onExternalRefresh();
    } finally {
      setRefreshingDrag(false);
    }
  };
  return { refreshKey, refreshing, refreshingDrag, handleRefresh, handleDragRefresh };
}
