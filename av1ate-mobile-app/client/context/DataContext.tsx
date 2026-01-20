import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type {
  Aircraft,
  CurrentHours,
  Thresholds,
  MaintenanceItem,
  Document,
  ComputedStatus,
  MultiAircraftData,
} from "@/types/data";
import {
  loadMultiAircraftData,
  saveMultiAircraftData,
  generateId,
  addAircraft as storageAddAircraft,
  deleteAircraft as storageDeleteAircraft,
  setActiveAircraft as storageSetActiveAircraft,
} from "@/lib/storage";
import {
  computeAllStatuses,
  getOverallStatus,
} from "@/lib/statusCalculator";
import {
  refreshAllNotifications,
  cancelNotificationsForItem,
} from "@/services/notifications";

interface DataContextType {
  multiData: MultiAircraftData | null;
  activeAircraft: Aircraft | null;
  loading: boolean;
  statuses: ComputedStatus[];
  overallStatus: "good" | "due_soon" | "overdue";
  refreshData: () => Promise<void>;
  setActiveAircraft: (id: string) => Promise<void>;
  addAircraft: (aircraft: { tail: string; model: string; hourMode: "HOBBS" | "TACH" | "BOTH"; current: CurrentHours }) => Promise<Aircraft>;
  updateActiveAircraft: (updates: Partial<Aircraft>) => Promise<void>;
  deleteAircraft: (id: string) => Promise<boolean>;
  updateCurrentHours: (current: CurrentHours) => Promise<void>;
  updateThresholds: (thresholds: Thresholds) => Promise<void>;
  addMaintenanceItem: (item: Omit<MaintenanceItem, "id">) => Promise<void>;
  updateMaintenanceItem: (item: MaintenanceItem) => Promise<void>;
  deleteMaintenanceItem: (id: string) => Promise<void>;
  logCompletion: (itemId: string, date: string, hours?: number, notes?: string) => Promise<void>;
  addDocument: (doc: Omit<Document, "id" | "addedAt">) => Promise<void>;
  updateDocument: (doc: Document) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [multiData, setMultiData] = useState<MultiAircraftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<ComputedStatus[]>([]);
  const notificationsEnabledRef = useRef(false);

  const getActiveAircraft = useCallback((data: MultiAircraftData | null): Aircraft | null => {
    if (!data) return null;
    return data.aircraftList.find((a) => a.id === data.activeAircraftId) || data.aircraftList[0] || null;
  }, []);

  const activeAircraft = getActiveAircraft(multiData);

  const computeStatuses = useCallback((aircraft: Aircraft | null, notificationsEnabled: boolean = false) => {
    if (!aircraft) {
      setStatuses([]);
      return;
    }
    const computed = computeAllStatuses(
      aircraft.maintenanceItems,
      aircraft.current,
      aircraft.thresholds,
      aircraft.hourMode
    );
    setStatuses(computed);
    
    if (notificationsEnabled) {
      refreshAllNotifications(computed, notificationsEnabled);
    }
  }, []);

  const refreshData = useCallback(async () => {
    const data = await loadMultiAircraftData();
    setMultiData(data);
    notificationsEnabledRef.current = data?.notificationsEnabled || false;
    const aircraft = getActiveAircraft(data);
    computeStatuses(aircraft, data?.notificationsEnabled || false);
    setLoading(false);
  }, [computeStatuses, getActiveAircraft]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const setActiveAircraftFn = useCallback(async (id: string) => {
    if (!multiData) return;
    await storageSetActiveAircraft(id);
    const newData = { ...multiData, activeAircraftId: id };
    setMultiData(newData);
    const aircraft = newData.aircraftList.find((a) => a.id === id) || null;
    computeStatuses(aircraft, notificationsEnabledRef.current);
  }, [multiData, computeStatuses]);

  const addAircraftFn = useCallback(async (aircraft: { tail: string; model: string; hourMode: "HOBBS" | "TACH" | "BOTH"; current: CurrentHours }): Promise<Aircraft> => {
    const newAircraft = await storageAddAircraft(aircraft);
    await refreshData();
    return newAircraft;
  }, [refreshData]);

  const updateActiveAircraft = useCallback(async (updates: Partial<Aircraft>) => {
    if (!multiData || !activeAircraft) return;
    const updatedAircraft = { ...activeAircraft, ...updates };
    const newList = multiData.aircraftList.map((a) =>
      a.id === activeAircraft.id ? updatedAircraft : a
    );
    const newData = { ...multiData, aircraftList: newList };
    setMultiData(newData);
    await saveMultiAircraftData(newData);
    computeStatuses(updatedAircraft, notificationsEnabledRef.current);
  }, [multiData, activeAircraft, computeStatuses]);

  const deleteAircraftFn = useCallback(async (id: string): Promise<boolean> => {
    const success = await storageDeleteAircraft(id);
    if (success) {
      await refreshData();
    }
    return success;
  }, [refreshData]);

  const updateCurrentHours = useCallback(async (current: CurrentHours) => {
    if (!activeAircraft) return;
    await updateActiveAircraft({ current });
  }, [activeAircraft, updateActiveAircraft]);

  const updateThresholds = useCallback(async (thresholds: Thresholds) => {
    if (!activeAircraft) return;
    await updateActiveAircraft({ thresholds });
  }, [activeAircraft, updateActiveAircraft]);

  const addMaintenanceItem = useCallback(async (item: Omit<MaintenanceItem, "id">) => {
    if (!activeAircraft) return;
    const newItem: MaintenanceItem = { ...item, id: generateId() };
    const newItems = [...activeAircraft.maintenanceItems, newItem];
    await updateActiveAircraft({ maintenanceItems: newItems });
  }, [activeAircraft, updateActiveAircraft]);

  const updateMaintenanceItem = useCallback(async (item: MaintenanceItem) => {
    if (!activeAircraft) return;
    const newItems = activeAircraft.maintenanceItems.map((i) =>
      i.id === item.id ? item : i
    );
    await updateActiveAircraft({ maintenanceItems: newItems });
  }, [activeAircraft, updateActiveAircraft]);

  const deleteMaintenanceItem = useCallback(async (id: string) => {
    if (!activeAircraft) return;
    const newItems = activeAircraft.maintenanceItems.filter((i) => i.id !== id);
    await cancelNotificationsForItem(id);
    await updateActiveAircraft({ maintenanceItems: newItems });
  }, [activeAircraft, updateActiveAircraft]);

  const logCompletion = useCallback(async (
    itemId: string,
    date: string,
    hours?: number,
    notes?: string
  ) => {
    if (!activeAircraft) return;
    const item = activeAircraft.maintenanceItems.find((i) => i.id === itemId);
    if (!item) return;
    const updatedItem: MaintenanceItem = {
      ...item,
      lastCompletedAt: date,
      lastCompletedHours: hours ?? item.lastCompletedHours,
      notes: notes ?? item.notes,
    };
    const newItems = activeAircraft.maintenanceItems.map((i) =>
      i.id === itemId ? updatedItem : i
    );
    await updateActiveAircraft({ maintenanceItems: newItems });
  }, [activeAircraft, updateActiveAircraft]);

  const addDocument = useCallback(async (doc: Omit<Document, "id" | "addedAt">) => {
    if (!activeAircraft) return;
    const newDoc: Document = {
      ...doc,
      id: generateId(),
      addedAt: new Date().toISOString(),
    };
    const newDocs = [...activeAircraft.documents, newDoc];
    await updateActiveAircraft({ documents: newDocs });
  }, [activeAircraft, updateActiveAircraft]);

  const updateDocument = useCallback(async (doc: Document) => {
    if (!activeAircraft) return;
    const newDocs = activeAircraft.documents.map((d) =>
      d.id === doc.id ? doc : d
    );
    await updateActiveAircraft({ documents: newDocs });
  }, [activeAircraft, updateActiveAircraft]);

  const deleteDocument = useCallback(async (id: string) => {
    if (!activeAircraft) return;
    const newDocs = activeAircraft.documents.filter((d) => d.id !== id);
    await updateActiveAircraft({ documents: newDocs });
  }, [activeAircraft, updateActiveAircraft]);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (!multiData) return;
    notificationsEnabledRef.current = enabled;
    const newData = { ...multiData, notificationsEnabled: enabled };
    setMultiData(newData);
    await saveMultiAircraftData(newData);
    
    if (enabled) {
      const aircraft = getActiveAircraft(newData);
      if (aircraft) {
        const computed = computeAllStatuses(
          aircraft.maintenanceItems,
          aircraft.current,
          aircraft.thresholds,
          aircraft.hourMode
        );
        refreshAllNotifications(computed, enabled);
      }
    }
  }, [multiData, getActiveAircraft]);

  const overallStatus = statuses.length > 0 ? getOverallStatus(statuses) : "good";

  const data = activeAircraft ? {
    aircraft: {
      model: activeAircraft.model,
      tail: activeAircraft.tail,
      hourMode: activeAircraft.hourMode,
    },
    current: activeAircraft.current,
    thresholds: activeAircraft.thresholds,
    maintenanceItems: activeAircraft.maintenanceItems,
    documents: activeAircraft.documents,
    notificationState: multiData?.notificationState || { lastNotifiedStatus: {} },
    notificationsEnabled: multiData?.notificationsEnabled || false,
  } : null;

  return (
    <DataContext.Provider
      value={{
        multiData,
        activeAircraft,
        loading,
        statuses,
        overallStatus,
        refreshData,
        setActiveAircraft: setActiveAircraftFn,
        addAircraft: addAircraftFn,
        updateActiveAircraft,
        deleteAircraft: deleteAircraftFn,
        updateCurrentHours,
        updateThresholds,
        addMaintenanceItem,
        updateMaintenanceItem,
        deleteMaintenanceItem,
        logCompletion,
        addDocument,
        updateDocument,
        deleteDocument,
        setNotificationsEnabled,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  
  const { activeAircraft, multiData, ...rest } = context;
  
  const data = activeAircraft ? {
    aircraft: {
      model: activeAircraft.model,
      tail: activeAircraft.tail,
      hourMode: activeAircraft.hourMode,
    },
    current: activeAircraft.current,
    thresholds: activeAircraft.thresholds,
    maintenanceItems: activeAircraft.maintenanceItems,
    documents: activeAircraft.documents,
    notificationState: multiData?.notificationState || { lastNotifiedStatus: {} },
    notificationsEnabled: multiData?.notificationsEnabled || false,
  } : null;
  
  return { ...rest, data, activeAircraft, multiData };
}
