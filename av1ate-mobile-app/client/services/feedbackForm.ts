import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { Platform } from "react-native";
import { FEEDBACK_CONFIG, isFeedbackConfigured } from "@/config/feedback";

const DRAFT_KEY = "av1ate_feedback_draft";

export interface FeedbackPayload {
  message: string;
  email?: string;
  aircraftInfo?: string;
  trialStatus?: string;
}

export interface FeedbackMetadata {
  appVersion: string;
  buildNumber: string;
  platform: string;
  osVersion: string | number;
  timestamp: string;
  aircraft?: string;
  trialStatus?: string;
}

export interface SubmitResult {
  success: boolean;
  error?: "not_configured" | "network_error";
}

function buildMetadataString(metadata: FeedbackMetadata): string {
  const lines = [
    `App: ${metadata.appVersion} (${metadata.buildNumber})`,
    `OS: ${metadata.platform} ${metadata.osVersion}`,
    `Time: ${metadata.timestamp}`,
  ];
  
  if (metadata.aircraft) {
    lines.push(`Aircraft: ${metadata.aircraft}`);
  }
  
  if (metadata.trialStatus) {
    lines.push(`Status: ${metadata.trialStatus}`);
  }
  
  return lines.join("\n");
}

export function getMetadata(aircraftInfo?: string, trialStatus?: string): FeedbackMetadata {
  return {
    appVersion: Application.nativeApplicationVersion || "dev",
    buildNumber: Application.nativeBuildVersion || "dev",
    platform: Platform.OS,
    osVersion: Platform.Version,
    timestamp: new Date().toISOString(),
    aircraft: aircraftInfo,
    trialStatus,
  };
}

export async function submitFeedback(payload: FeedbackPayload): Promise<SubmitResult> {
  if (!isFeedbackConfigured()) {
    return { success: false, error: "not_configured" };
  }

  const metadata = getMetadata(payload.aircraftInfo, payload.trialStatus);
  const metadataString = buildMetadataString(metadata);
  
  const formData = new URLSearchParams();
  formData.append(FEEDBACK_CONFIG.ENTRY_MESSAGE_ID, payload.message);
  
  if (payload.email) {
    formData.append(FEEDBACK_CONFIG.ENTRY_EMAIL_ID, payload.email);
  }
  
  formData.append(FEEDBACK_CONFIG.ENTRY_METADATA_ID, metadataString);
  
  try {
    await fetch(FEEDBACK_CONFIG.GOOGLE_FORM_ACTION_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
    
    await clearDraft();
    return { success: true };
  } catch (error) {
    return { success: false, error: "network_error" };
  }
}

export async function saveDraft(message: string, email: string): Promise<void> {
  const draft = JSON.stringify({ message, email, savedAt: new Date().toISOString() });
  await AsyncStorage.setItem(DRAFT_KEY, draft);
}

export async function loadDraft(): Promise<{ message: string; email: string } | null> {
  try {
    const stored = await AsyncStorage.getItem(DRAFT_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return { message: parsed.message || "", email: parsed.email || "" };
  } catch {
    return null;
  }
}

export async function clearDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}

export function getFormViewUrl(): string {
  return FEEDBACK_CONFIG.GOOGLE_FORM_VIEW_URL;
}
