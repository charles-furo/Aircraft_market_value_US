import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";
import {
  getEntitlementState,
  initializeTrialIfNeeded,
  setIsPro,
  EntitlementState,
} from "@/lib/entitlement";
import { initPurchases, checkAndSyncEntitlement, purchaseLifetime, restorePurchases } from "@/lib/purchases";

interface EntitlementContextType {
  entitlement: EntitlementState;
  loading: boolean;
  refresh: () => Promise<void>;
  purchase: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  requireAccess: (action: () => void) => void;
}

const defaultState: EntitlementState = {
  isPro: false,
  trialActive: true,
  trialExpired: false,
  trialDaysRemaining: 14,
  canEdit: true,
};

const EntitlementContext = createContext<EntitlementContextType>({
  entitlement: defaultState,
  loading: true,
  refresh: async () => {},
  purchase: async () => false,
  restore: async () => false,
  requireAccess: () => {},
});

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [entitlement, setEntitlement] = useState<EntitlementState>(defaultState);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      await initializeTrialIfNeeded();
      await checkAndSyncEntitlement();
      const state = await getEntitlementState();
      setEntitlement(state);
    } catch (error) {
      console.warn("[Entitlement] Failed to refresh:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await initializeTrialIfNeeded();
      await initPurchases();
      await refresh();
    };
    initialize();
  }, [refresh]);

  const purchase = useCallback(async (): Promise<boolean> => {
    const success = await purchaseLifetime();
    if (success) {
      await refresh();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return success;
  }, [refresh]);

  const restore = useCallback(async (): Promise<boolean> => {
    const success = await restorePurchases();
    if (success) {
      await refresh();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return success;
  }, [refresh]);

  const requireAccess = useCallback(
    (action: () => void) => {
      if (entitlement.canEdit) {
        action();
      }
    },
    [entitlement.canEdit]
  );

  return (
    <EntitlementContext.Provider
      value={{
        entitlement,
        loading,
        refresh,
        purchase,
        restore,
        requireAccess,
      }}
    >
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlement() {
  return useContext(EntitlementContext);
}
