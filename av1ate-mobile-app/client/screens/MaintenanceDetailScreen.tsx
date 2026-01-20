import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useData } from "@/context/DataContext";
import { useEntitlement } from "@/context/EntitlementContext";
import { getStatusColor, getStatusLabel } from "@/lib/statusCalculator";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

type RouteParams = {
  MaintenanceDetail: { id: string };
};

export default function MaintenanceDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, "MaintenanceDetail">>();
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { activeAircraft, statuses, logCompletion } = useData();
  const { entitlement } = useEntitlement();

  const [showLogModal, setShowLogModal] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logHours, setLogHours] = useState("");
  const [logNotes, setLogNotes] = useState("");

  const itemId = route.params?.id;
  const status = useMemo(
    () => statuses.find((s) => s.item.id === itemId),
    [statuses, itemId]
  );

  if (!status) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>Item not found</ThemedText>
      </ThemedView>
    );
  }

  const { item } = status;
  const statusColor = getStatusColor(status.status, Colors.dark);
  const statusLabel = getStatusLabel(status.status);

  const handleLogCompletion = async () => {
    Keyboard.dismiss();
    const hoursValue = logHours ? parseFloat(logHours) : undefined;
    await logCompletion(item.id, logDate, hoursValue, logNotes || undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowLogModal(false);
    setLogHours("");
    setLogNotes("");
  };

  const openLogModal = () => {
    if (!entitlement.canEdit) {
      navigation.navigate("Paywall");
      return;
    }
    setLogDate(new Date().toISOString().split("T")[0]);
    if (activeAircraft?.current.hobbs) {
      setLogHours(activeAircraft.current.hobbs.toString());
    }
    setShowLogModal(true);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not recorded";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRuleTypeLabel = (ruleType: string) => {
    switch (ruleType) {
      case "DATE":
        return "Calendar-based";
      case "HOURS":
        return "Hours-based";
      case "DATE_OR_HOURS":
        return "Whichever comes first";
      default:
        return ruleType;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>{item.name}</ThemedText>
          <View style={[styles.statusPill, { backgroundColor: statusColor + "20" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <ThemedText style={[styles.statusLabel, { color: statusColor }]}>
              {statusLabel}
            </ThemedText>
          </View>
        </View>

        <Card elevation={1} style={styles.card}>
          <ThemedText style={styles.cardTitle}>Status</ThemedText>
          <ThemedText style={styles.dueText}>{status.dueText}</ThemedText>
        </Card>

        <Card elevation={1} style={styles.card}>
          <ThemedText style={styles.cardTitle}>Rule</ThemedText>
          <ThemedText style={styles.cardValue}>
            {getRuleTypeLabel(item.ruleType)}
          </ThemedText>
          {item.intervalDays ? (
            <ThemedText style={styles.cardDetail}>
              Every {item.intervalDays} days ({Math.round(item.intervalDays / 30)} months)
            </ThemedText>
          ) : null}
          {item.intervalHours ? (
            <ThemedText style={styles.cardDetail}>
              Every {item.intervalHours} hours ({item.hourSource || "Hobbs"})
            </ThemedText>
          ) : null}
        </Card>

        <Card elevation={1} style={styles.card}>
          <ThemedText style={styles.cardTitle}>Last Completed</ThemedText>
          <ThemedText style={styles.cardValue}>
            {formatDate(item.lastCompletedAt)}
          </ThemedText>
          {item.lastCompletedHours !== undefined ? (
            <ThemedText style={styles.cardDetail}>
              At {item.lastCompletedHours.toFixed(1)} hours
            </ThemedText>
          ) : null}
          {item.notes ? (
            <ThemedText style={styles.notes}>{item.notes}</ThemedText>
          ) : null}
        </Card>

        {status.dueDate ? (
          <Card elevation={1} style={styles.card}>
            <ThemedText style={styles.cardTitle}>Due Date</ThemedText>
            <ThemedText style={styles.cardValue}>
              {formatDate(status.dueDate.toISOString())}
            </ThemedText>
            {status.daysRemaining !== undefined ? (
              <ThemedText style={styles.cardDetail}>
                {status.daysRemaining < 0
                  ? `${Math.abs(status.daysRemaining)} days overdue`
                  : `${status.daysRemaining} days remaining`}
              </ThemedText>
            ) : null}
          </Card>
        ) : null}

        {status.dueHours !== undefined ? (
          <Card elevation={1} style={styles.card}>
            <ThemedText style={styles.cardTitle}>Due Hours</ThemedText>
            <ThemedText style={styles.cardValue}>
              {status.dueHours.toFixed(1)} hours
            </ThemedText>
            {status.hoursRemaining !== undefined ? (
              <ThemedText style={styles.cardDetail}>
                {status.hoursRemaining < 0
                  ? `${Math.abs(status.hoursRemaining).toFixed(1)} hours overdue`
                  : `${status.hoursRemaining.toFixed(1)} hours remaining`}
              </ThemedText>
            ) : null}
          </Card>
        ) : null}

        <Button onPress={openLogModal} testID="button-log-completion" style={styles.logButton}>
          Log Completion
        </Button>
      </ScrollView>

      <Modal
        visible={showLogModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLogModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardAvoidingView}
            >
              <TouchableWithoutFeedback onPress={() => {}}>
                <ThemedView style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                  <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Log Completion</ThemedText>
                    <Pressable
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowLogModal(false);
                      }}
                      testID="button-close-modal"
                    >
                      <Feather name="x" size={24} color={Colors.dark.text} />
                    </Pressable>
                  </View>

                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    style={styles.modalScrollView}
                    contentContainerStyle={styles.modalScrollContent}
                  >
                    <Card elevation={1} style={styles.inputCard}>
                      <ThemedText style={styles.inputLabel}>Completion Date</ThemedText>
                      <TextInput
                        style={styles.input}
                        value={logDate}
                        onChangeText={setLogDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={Colors.dark.textSecondary}
                        testID="input-log-date"
                        returnKeyType="next"
                      />
                    </Card>

                    {(item.ruleType === "HOURS" || item.ruleType === "DATE_OR_HOURS") ? (
                      <Card elevation={1} style={styles.inputCard}>
                        <ThemedText style={styles.inputLabel}>Hours at Completion</ThemedText>
                        <TextInput
                          style={styles.input}
                          value={logHours}
                          onChangeText={setLogHours}
                          keyboardType="decimal-pad"
                          placeholder="0.0"
                          placeholderTextColor={Colors.dark.textSecondary}
                          testID="input-log-hours"
                          returnKeyType="next"
                        />
                      </Card>
                    ) : null}

                    <Card elevation={1} style={styles.inputCard}>
                      <ThemedText style={styles.inputLabel}>Notes (optional)</ThemedText>
                      <TextInput
                        style={[styles.input, styles.notesInput]}
                        value={logNotes}
                        onChangeText={setLogNotes}
                        placeholder="Any notes about this service..."
                        placeholderTextColor={Colors.dark.textSecondary}
                        multiline
                        testID="input-log-notes"
                        returnKeyType="done"
                        blurOnSubmit
                      />
                    </Card>
                  </ScrollView>

                  <Button onPress={handleLogCompletion} testID="button-save-log">
                    Save
                  </Button>
                </ThemedView>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing["2xl"],
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  cardValue: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  cardDetail: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  dueText: {
    ...Typography.h4,
    color: Colors.dark.text,
  },
  notes: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
    fontStyle: "italic",
  },
  logButton: {
    marginTop: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  keyboardAvoidingView: {
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  modalScrollView: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingBottom: Spacing.lg,
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
  input: {
    fontSize: 17,
    color: Colors.dark.text,
    padding: 0,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
});
