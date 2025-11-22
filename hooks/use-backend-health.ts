// hooks/use-backend-health.ts

import { fetchBackendHealthInfo, BackendInfo } from '@/utils/backendApi';
import { logger } from '@/utils/logger';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Hook to fetch and log backend health information at app startup.
 * Fetches once on initial mount and logs the response in a formatted way.
 * This is a non-blocking, informational call that doesn't affect app initialization.
 */
export function useBackendHealth() {
  // Fetch backend health info once at app startup - never refetches
  const { data: backendInfo } = useQuery({
    queryKey: ['backendHealthInfo'],
    queryFn: fetchBackendHealthInfo,
    staleTime: Infinity, // Never consider data stale
    retry: false, // Don't retry if it fails - it's just informational
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    refetchOnMount: false, // Don't refetch on remount (only fetch on initial mount)
  });

  // Log backend info when it's received
  useEffect(() => {
    if (backendInfo) {
      logBackendHealthInfo(backendInfo);
    }
  }, [backendInfo]);
}

/**
 * Formats and logs backend health information
 */
function logBackendHealthInfo(backendInfo: BackendInfo): void {
  const lines: string[] = [];
  
  // Basic info
  if (backendInfo.name) {
    lines.push(`   └─ Name: ${backendInfo.name}`);
  }
  if (backendInfo.version) {
    lines.push(`   └─ Version: ${backendInfo.version}`);
  }
  if (backendInfo.status || backendInfo.health) {
    lines.push(`   └─ Status: ${backendInfo.status || backendInfo.health}`);
  }
  
  // Endpoints (formatted nicely)
  if (backendInfo.endpoints && typeof backendInfo.endpoints === 'object') {
    lines.push(`   └─ Endpoints:`);
    Object.entries(backendInfo.endpoints).forEach(([key, endpoint]) => {
      if (typeof endpoint === 'object' && endpoint !== null) {
        lines.push(`      • ${key}: ${endpoint.path || key}`);
        if (endpoint.description) {
          lines.push(`        ${endpoint.description}`);
        }
        if (endpoint.cache) {
          lines.push(`        Cache: ${endpoint.cache}`);
        }
        if (endpoint.authentication) {
          lines.push(`        Auth: ${endpoint.authentication}`);
        }
      }
    });
  }
  
  // Diagnostics (simplified)
  if (backendInfo.diagnostics) {
    lines.push(`   └─ Diagnostics:`);
    if (backendInfo.diagnostics.cache) {
      const cache = backendInfo.diagnostics.cache;
      lines.push(`      • Cache: ${cache.exists ? 'exists' : 'missing'}, ${cache.isStale ? 'stale' : 'fresh'}`);
    }
    if (backendInfo.diagnostics.environmentVariables) {
      const envVars = Object.entries(backendInfo.diagnostics.environmentVariables)
        .filter(([_, exists]) => exists)
        .map(([key]) => key);
      if (envVars.length > 0) {
        lines.push(`      • Env vars: ${envVars.join(', ')}`);
      }
    }
  }
  
  if (backendInfo.timestamp) {
    lines.push(`   └─ Timestamp: ${backendInfo.timestamp}`);
  }
  
  // Log everything in one go
  logger('📊 Backend Health Info:', 'log', 'info');
  lines.forEach(line => logger(line, 'log', 'info'));
}

