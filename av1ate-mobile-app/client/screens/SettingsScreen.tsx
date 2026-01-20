import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Pressable,
  Switch,
  Modal,
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
import * as Notifications from "expo-notifications";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useData } from "@/context/DataContext";
import { useEntitlement } from "@/context/EntitlementContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { HourMode, MaintenanceItem, RuleType, HourSource } from "@/types/data";

const HOUR_MODE_OPTIONS: { value: HourMode; label: string }[] = [
  { value: "HOBBS", label: "Hobbs only" },
  { value: "TACH", label: "Tach only" },
  { value: "BOTH", label: "Both" },
];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const {
    data,
    updateActiveAircraft,
    updateThresholds,
    addMaintenanceItem,
    updateMaintenanceItem,
    deleteMaintenanceItem,
    setNotificationsEnabled,
  } = useData();
  const { entitlement } = useEntitlement();

  const [model, setModel] = useState("");
  const [tail, setTail] = useState("");
  const [hourMode, setHourMode] = useState<HourMode>("HOBBS");
  const [notificationsOn, setNotificationsOn] = useState(false);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MaintenanceItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemRuleType, setItemRuleType] = useState<RuleType>("DATE");
  const [itemIntervalDays, setItemIntervalDays] = useState("");
  const [itemIntervalHours, setItemIntervalHours] = useState("");
  const [itemHourSource, setItemHourSource] = useState<HourSource>("HOBBS");

  useEffect(() => {
    if (data) {
      setModel(data.aircraft.model);
      setTail(data.aircraft.tail);
      setHourMode(data.aircraft.hourMode);
      setNotificationsOn(data.notificationsEnabled);
    }
  }, [data]);

  const handleSaveAircraft = async () => {
    await updateActiveAircraft({ model, tail, hourMode });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved", "Aircraft settings updated");
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings"
        );
        return;
      }
    }
    setNotificationsOn(value);
    await setNotificationsEnabled(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const checkAccessAndRun = (action: () => void) => {
    if (!entitlement.canEdit) {
      navigation.navigate("Paywall");
      return;
    }
    action();
  };

  const openAddItem = () => {
    checkAccessAndRun(() => {
      setEditingItem(null);
      setItemName("");
      setItemRuleType("DATE");
      setItemIntervalDays("365");
      setItemIntervalHours("");
      setItemHourSource("HOBBS");
      setShowItemModal(true);
    });
  };

  const openEditItem = (item: MaintenanceItem) => {
    checkAccessAndRun(() => {
      setEditingItem(item);
      setItemName(item.name);
      setItemRuleType(item.ruleType);
      setItemIntervalDays(item.intervalDays?.toString() || "");
      setItemIntervalHours(item.intervalHours?.toString() || "");
      setItemHourSource(item.hourSource || "HOBBS");
      setShowItemModal(true);
    });
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    const intervalDays = itemIntervalDays ? parseInt(itemIntervalDays) : undefined;
    const intervalHours = itemIntervalHours ? parseInt(itemIntervalHours) : undefined;

    if (editingItem) {
      await updateMaintenanceItem({
        ...editingItem,
        name: itemName.trim(),
        ruleType: itemRuleType,
        intervalDays,
        intervalHours,
        hourSource: itemHourSource,
      });
    } else {
      await addMaintenanceItem({
        name: itemName.trim(),
        ruleType: itemRuleType,
        intervalDays,
        intervalHours,
        hourSource: itemHourSource,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowItemModal(false);
  };

  const handleDeleteItem = (item: MaintenanceItem) => {
    checkAccessAndRun(() => {
      Alert.alert(
        "Delete Item",
        `Are you sure you want to delete "${item.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deleteMaintenanceItem(item.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    });
  };

  const handleSendFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Feedback");
  };

  const maintenanceItems = data?.maintenanceItems || [];

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
        <ThemedText style={styles.sectionTitle}>Aircraft</ThemedText>
        <Card elevation={1} style={styles.card}>
          <View style={styles.inputRow}>
            <ThemedText style={styles.inputLabel}>Model</ThemedText>
            <TextInput
              style={styles.input}
              value={model}
              onChangeText={setModel}
              placeholder="Aircraft model"
              placeholderTextColor={Colors.dark.textSecondary}
              testID="input-aircraft-model"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.inputRow}>
            <ThemedText style={styles.inputLabel}>Tail Number</ThemedText>
            <TextInput
              style={styles.input}
              value={tail}
              onChangeText={setTail}
              placeholder="N12345"
              placeholderTextColor={Colors.dark.textSecondary}
              autoCapitalize="characters"
              testID="input-tail-number"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.inputRow}>
            <ThemedText style={styles.inputLabel}>Hour Source</ThemedText>
            <View style={styles.optionsRow}>
              {HOUR_MODE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setHourMode(opt.value)}
                  style={[
                    styles.optionPill,
                    hourMode === opt.value && styles.optionPillActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      hourMode === opt.value && styles.optionTextActive,
                    ]}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>
        <Button onPress={handleSaveAircraft} style={styles.saveButton} testID="button-save-aircraft">
          Save Aircraft Settings
        </Button>

        <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
        <Card elevation={1} style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <ThemedText style={styles.switchLabel}>Push Notifications</ThemedText>
              <ThemedText style={styles.switchSubtext}>
                Get alerts when items are due
              </ThemedText>
            </View>
            <Switch
              value={notificationsOn}
              onValueChange={handleToggleNotifications}
              trackColor={{
                false: Colors.dark.backgroundSecondary,
                true: Colors.dark.accent,
              }}
              testID="switch-notifications"
            />
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Maintenance Items</ThemedText>
          <Pressable onPress={openAddItem} style={styles.addButton} testID="button-add-item">
            <Feather name="plus" size={20} color={Colors.dark.accent} />
          </Pressable>
        </View>

        {maintenanceItems.map((item) => (
          <Card key={item.id} elevation={1} style={styles.itemCard}>
            <Pressable
              onPress={() => openEditItem(item)}
              onLongPress={() => handleDeleteItem(item)}
              style={styles.itemRow}
              testID={`item-${item.id}`}
            >
              <View>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemMeta}>
                  {item.ruleType === "DATE" && `Every ${item.intervalDays} days`}
                  {item.ruleType === "HOURS" && `Every ${item.intervalHours} hours`}
                  {item.ruleType === "DATE_OR_HOURS" &&
                    `${item.intervalDays} days or ${item.intervalHours} hours`}
                </ThemedText>
              </View>
              <Feather name="edit-2" size={18} color={Colors.dark.textSecondary} />
            </Pressable>
          </Card>
        ))}

        <ThemedText style={styles.sectionTitle}>Support</ThemedText>
        <Card elevation={1} style={styles.card}>
          <Pressable onPress={handleSendFeedback} style={styles.feedbackRow} testID="button-feedback">
            <Feather name="message-circle" size={20} color={Colors.dark.accent} />
            <View style={styles.feedbackTextContainer}>
              <ThemedText style={styles.feedbackTitle}>Send Feedback</ThemedText>
              <ThemedText style={styles.feedbackSubtext}>
                Report bugs or request features
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.dark.textSecondary} />
          </Pressable>
        </Card>
      </ScrollView>

      <Modal
        visible={showItemModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowItemModal(false)}
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
                    <ThemedText style={styles.modalTitle}>
                      {editingItem ? "Edit Item" : "Add Item"}
                    </ThemedText>
                    <Pressable onPress={() => {
                      Keyboard.dismiss();
                      setShowItemModal(false);
                    }}>
                      <Feather name="x" size={24} color={Colors.dark.text} />
                    </Pressable>
                  </View>

                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    style={styles.modalScrollView}
                    contentContainerStyle={styles.modalScrollContent}
                  >
                    <Card elevation={1} style={styles.modalCard}>
                      <ThemedText style={styles.modalLabel}>Name</ThemedText>
                      <TextInput
                        style={styles.modalInput}
                        value={itemName}
                        onChangeText={setItemName}
                        placeholder="Item name"
                        placeholderTextColor={Colors.dark.textSecondary}
                        testID="input-item-name"
                        returnKeyType="next"
                      />
                    </Card>

                    <Card elevation={1} style={styles.modalCard}>
                      <ThemedText style={styles.modalLabel}>Rule Type</ThemedText>
                      <View style={styles.ruleOptions}>
                        {(["DATE", "HOURS", "DATE_OR_HOURS"] as RuleType[]).map((rule) => (
                          <Pressable
                            key={rule}
                            onPress={() => setItemRuleType(rule)}
                            style={[
                              styles.rulePill,
                              itemRuleType === rule && styles.rulePillActive,
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.ruleText,
                                itemRuleType === rule && styles.ruleTextActive,
                              ]}
                            >
                              {rule === "DATE_OR_HOURS" ? "Both" : rule}
                            </ThemedText>
                          </Pressable>
                        ))}
                      </View>
                    </Card>

                    {(itemRuleType === "DATE" || itemRuleType === "DATE_OR_HOURS") ? (
                      <Card elevation={1} style={styles.modalCard}>
                        <ThemedText style={styles.modalLabel}>Interval (days)</ThemedText>
                        <TextInput
                          style={styles.modalInput}
                          value={itemIntervalDays}
                          onChangeText={setItemIntervalDays}
                          keyboardType="number-pad"
                          placeholder="365"
                          placeholderTextColor={Colors.dark.textSecondary}
                          testID="input-interval-days"
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                        />
                      </Card>
                    ) : null}

                    {(itemRuleType === "HOURS" || itemRuleType === "DATE_OR_HOURS") ? (
                      <Card elevation={1} style={styles.modalCard}>
                        <ThemedText style={styles.modalLabel}>Interval (hours)</ThemedText>
                        <TextInput
                          style={styles.modalInput}
                          value={itemIntervalHours}
                          onChangeText={setItemIntervalHours}
                          keyboardType="number-pad"
                          placeholder="50"
                          placeholderTextColor={Colors.dark.textSecondary}
                          testID="input-interval-hours"
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                        />
                      </Card>
                    ) : null}
                  </ScrollView>

                  <Button onPress={() => {
                    Keyboard.dismiss();
                    handleSaveItem();
                  }} testID="button-save-item">
                    {editingItem ? "Update Item" : "Add Item"}
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  inputRow: {
    paddingVertical: Spacing.sm,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    fontSize: 17,
    color: Colors.dark.text,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.backgroundSecondary,
    marginVertical: Spacing.md,
  },
  optionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  optionPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  optionPillActive: {
    backgroundColor: Colors.dark.accent,
  },
  optionText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  optionTextActive: {
    color: Colors.dark.text,
  },
  saveButton: {
    marginBottom: Spacing.lg,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: "500",
  },
  switchSubtext: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  addButton: {
    padding: Spacing.sm,
  },
  itemCard: {
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: "500",
  },
  itemMeta: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
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
  modalScrollView: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  modalCard: {
    marginBottom: Spacing.lg,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  modalInput: {
    fontSize: 17,
    color: Colors.dark.text,
    padding: 0,
  },
  ruleOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  rulePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  rulePillActive: {
    backgroundColor: Colors.dark.accent,
  },
  ruleText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  ruleTextActive: {
    color: Colors.dark.text,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  feedbackTextContainer: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: "500",
  },
  feedbackSubtext: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
});
