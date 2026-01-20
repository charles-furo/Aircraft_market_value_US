export type HourMode = "HOBBS" | "TACH" | "BOTH";
export type RuleType = "DATE" | "HOURS" | "DATE_OR_HOURS";
export type HourSource = "HOBBS" | "TACH";
export type StatusType = "good" | "due_soon" | "overdue";

export interface CurrentHours {
  hobbs?: number;
  tach?: number;
  updatedAt: string;
}

export interface Thresholds {
  dateThresholdDays: number[];
  hourThresholds: number[];
}

export interface MaintenanceItem {
  id: string;
  name: string;
  ruleType: RuleType;
  intervalDays?: number;
  intervalHours?: number;
  hourSource?: HourSource;
  lastCompletedAt?: string;
  lastCompletedHours?: number;
  notes?: string;
}

export interface Document {
  id: string;
  title: string;
  localUri: string;
  mimeType: string;
  addedAt: string;
  tags: string[];
  linkedItemId?: string;
}

export interface NotificationState {
  lastNotifiedStatus: Record<string, StatusType>;
  lastWeeklyDigest?: string;
}

export interface Aircraft {
  id: string;
  tail: string;
  model: string;
  hourMode: HourMode;
  current: CurrentHours;
  thresholds: Thresholds;
  maintenanceItems: MaintenanceItem[];
  documents: Document[];
}

export interface MultiAircraftData {
  aircraftList: Aircraft[];
  activeAircraftId: string;
  notificationState: NotificationState;
  notificationsEnabled: boolean;
}

export interface AppData {
  aircraft: { model: string; tail: string; hourMode: HourMode };
  current: CurrentHours;
  thresholds: Thresholds;
  maintenanceItems: MaintenanceItem[];
  documents: Document[];
  notificationState: NotificationState;
  notificationsEnabled: boolean;
}

export interface ComputedStatus {
  item: MaintenanceItem;
  status: StatusType;
  dueDate?: Date;
  dueHours?: number;
  daysRemaining?: number;
  hoursRemaining?: number;
  dueText: string;
  urgencyScore: number;
}
