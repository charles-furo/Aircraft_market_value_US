import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import type { ComputedStatus, NotificationState } from "@/types/data";
import {
  requestNotificationPermissions,
  scheduleMaintenanceNotifications,
  cancelItemNotifications,
  setupNotificationListeners,
  sendDueSoonNotifications,
} from "@/lib/notifications";

let isInitialized = false;
let cleanupListeners: (() => void) | null = null;

export async function initializeNotifications(
  onNavigateToItem?: (itemId: string) => void
): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  if (isInitialized) {
    return true;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) {
    return false;
  }

  cleanupListeners = setupNotificationListeners(
    undefined,
    (response) => {
      const data = response.notification.request.content.data;
      if (data?.itemId && onNavigateToItem) {
        onNavigateToItem(data.itemId as string);
      }
    }
  );

  isInitialized = true;
  return true;
}

export async function updateNotificationsForStatuses(
  statuses: ComputedStatus[],
  previousState: NotificationState,
  notificationsEnabled: boolean
): Promise<NotificationState> {
  if (Platform.OS === "web" || !notificationsEnabled) {
    return previousState;
  }

  return await sendDueSoonNotifications(statuses, previousState);
}

export async function refreshAllNotifications(
  statuses: ComputedStatus[],
  notificationsEnabled: boolean
): Promise<void> {
  if (Platform.OS === "web" || !notificationsEnabled) {
    return;
  }

  const itemsToNotify = statuses.filter(
    (s) => s.status === "due_soon" || s.status === "overdue"
  );
  await scheduleMaintenanceNotifications(itemsToNotify);
}

export async function cancelNotificationsForItem(itemId: string): Promise<void> {
  await cancelItemNotifications(itemId);
}

export function cleanupNotifications(): void {
  if (cleanupListeners) {
    cleanupListeners();
    cleanupListeners = null;
  }
  isInitialized = false;
}
