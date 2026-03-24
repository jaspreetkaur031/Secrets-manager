import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export function useSecretSync(projectId) {
  const [syncStatus, setSyncStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSyncStatus = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      // Calls the optimized client-side logic we just added to api.js
      const data = await api.getEnvironmentSyncStatus(projectId);
      setSyncStatus(data);
      setError(null);
    } catch (err) {
      console.error("Sync check failed", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  return { syncStatus, loading, error, refreshSync: fetchSyncStatus };
}
