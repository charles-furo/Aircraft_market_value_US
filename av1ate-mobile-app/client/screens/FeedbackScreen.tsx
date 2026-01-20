import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useData } from "@/context/DataContext";
import { useEntitlement } from "@/context/EntitlementContext";
import {
  submitFeedback,
  saveDraft,
  loadDraft,
  clearDraft,
  getFormViewUrl,
  getMetadata,
} from "@/services/feedbackForm";
import { isFeedbackConfigured, isViewUrlConfigured } from "@/config/feedback";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const MIN_MESSAGE_LENGTH = 10;

export default function FeedbackScreen() {
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { activeAircraft } = useData();
  const { entitlement } = useEntitlement();
  const messageInputRef = useRef<TextInput>(null);

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const isConfigured = isFeedbackConfigured();

  useEffect(() => {
    loadDraft().then((draft) => {
      if (draft) {
        setMessage(draft.message);
        setEmail(draft.email);
        setHasDraft(true);
      }
    });
  }, []);

  useEffect(() => {
    if (message.length > 0 || email.length > 0) {
      saveDraft(message, email);
    }
  }, [message, email]);

  const getAircraftInfo = () => {
    if (!activeAircraft) return undefined;
    return `${activeAircraft.model} (${activeAircraft.tail})`;
  };

  const getTrialStatus = () => {
    if (entitlement.isPro) return "Pro";
    if (entitlement.trialActive) return `Trial (${entitlement.trialDaysRemaining} days left)`;
    return "Expired";
  };

  const isValid = message.trim().length >= MIN_MESSAGE_LENGTH;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSend = async () => {
    if (!isValid || sending) return;

    dismissKeyboard();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);

    const result = await submitFeedback({
      message: message.trim(),
      email: email.trim() || undefined,
      aircraftInfo: getAircraftInfo(),
      trialStatus: getTrialStatus(),
    });

    setSending(false);

    if (result.success) {
      await clearDraft();
      setMessage("");
      setEmail("");
      setHasDraft(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Thanks!", "Your feedback has been sent.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } else if (result.error === "not_configured") {
      await saveDraft(message, email);
      Alert.alert(
        "Not Configured",
        "Feedback form is not set up yet. Please use Copy or Open Form instead.",
        [{ text: "OK" }]
      );
    } else {
      await saveDraft(message, email);
      Alert.alert(
        "Couldn't Send",
        "Unable to send right now. Please try again, or tap Open Form / Copy.",
        [{ text: "OK" }]
      );
    }
  };

  const handleCopy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const metadata = getMetadata(getAircraftInfo(), getTrialStatus());
    const fullText = `${message.trim()}\n\n---\nEmail: ${email || "Not provided"}\nApp: ${metadata.appVersion}\nOS: ${metadata.platform} ${metadata.osVersion}\nAircraft: ${metadata.aircraft || "N/A"}\nStatus: ${metadata.trialStatus || "N/A"}`;
    await Clipboard.setStringAsync(fullText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", "Feedback copied to clipboard");
  };

  const handleOpenForm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!isViewUrlConfigured()) {
      Alert.alert("Not Available", "Feedback form not configured yet.");
      return;
    }
    
    await WebBrowser.openBrowserAsync(getFormViewUrl());
    Alert.alert("Thanks!", "Please submit the form in your browser.");
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={headerHeight}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Spacing.lg,
                paddingBottom: insets.bottom + Spacing.xl + 100,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText style={styles.subtitle}>
              Share your thoughts, report issues, or request features
            </ThemedText>

            <Card elevation={1} style={styles.inputCard}>
              <ThemedText style={styles.inputLabel}>Message</ThemedText>
              <TextInput
                ref={messageInputRef}
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder="What would you like to share?"
                placeholderTextColor={Colors.dark.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                returnKeyType="default"
                blurOnSubmit={false}
                testID="input-feedback-message"
              />
              <ThemedText style={styles.charCount}>
                {message.length} characters (min {MIN_MESSAGE_LENGTH})
              </ThemedText>
            </Card>

            <Card elevation={1} style={styles.inputCard}>
              <ThemedText style={styles.inputLabel}>Email (optional)</ThemedText>
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={dismissKeyboard}
                testID="input-feedback-email"
              />
              <ThemedText style={styles.emailHint}>
                Include if you'd like us to follow up
              </ThemedText>
            </Card>

            <Button
              onPress={handleOpenForm}
              style={styles.primaryButton}
              testID="button-open-form"
            >
              Open Feedback Form
            </Button>

            <View style={styles.secondaryActions}>
              <Pressable onPress={handleCopy} style={styles.secondaryButton} testID="button-copy-feedback">
                <Feather name="copy" size={18} color={Colors.dark.accent} />
                <ThemedText style={styles.secondaryButtonText}>Copy</ThemedText>
              </Pressable>
            </View>

            {hasDraft ? (
              <ThemedText style={styles.draftNote}>
                Draft restored from previous session
              </ThemedText>
            ) : null}

            {!isConfigured ? (
              <ThemedText style={styles.configNote}>
                Feedback form not configured
              </ThemedText>
            ) : null}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  inputCard: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  messageInput: {
    fontSize: 16,
    color: Colors.dark.text,
    minHeight: 120,
    padding: 0,
  },
  charCount: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "right",
  },
  emailInput: {
    fontSize: 16,
    color: Colors.dark.text,
    padding: 0,
  },
  emailHint: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
  },
  primaryButton: {
    marginBottom: Spacing.lg,
  },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: Colors.dark.accent,
    fontWeight: "500",
  },
  actionDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  draftNote: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: Spacing.lg,
    fontStyle: "italic",
  },
  configNote: {
    fontSize: 12,
    color: Colors.dark.statusYellow,
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
