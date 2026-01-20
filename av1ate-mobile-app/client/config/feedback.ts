export const FEEDBACK_CONFIG = {
  GOOGLE_FORM_ACTION_URL: "https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse",
  GOOGLE_FORM_VIEW_URL: "https://forms.gle/tLWcxPXtR16PU1Zg7",
  
  ENTRY_MESSAGE_ID: "entry.XXXXXXXXX",
  ENTRY_EMAIL_ID: "entry.XXXXXXXXX",
  ENTRY_METADATA_ID: "entry.XXXXXXXXX",
};

export function isFeedbackConfigured(): boolean {
  return (
    !FEEDBACK_CONFIG.GOOGLE_FORM_ACTION_URL.includes("YOUR_FORM_ID") &&
    !FEEDBACK_CONFIG.ENTRY_MESSAGE_ID.includes("XXXXXXXXX")
  );
}

export function isViewUrlConfigured(): boolean {
  return !FEEDBACK_CONFIG.GOOGLE_FORM_VIEW_URL.includes("YOUR_FORM_ID");
}
