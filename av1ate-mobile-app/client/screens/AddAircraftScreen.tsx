import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useData } from "@/context/DataContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { HourMode, CurrentHours } from "@/types/data";

const HOUR_MODES: { value: HourMode; label: string }[] = [
  { value: "HOBBS", label: "Hobbs Only" },
  { value: "TACH", label: "Tach Only" },
  { value: "BOTH", label: "Both" },
];

export default function AddAircraftScreen() {
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { addAircraft, multiData } = useData();

  const [tail, setTail] = useState("");
  const [model, setModel] = useState("");
  const [hourMode, setHourMode] = useState<HourMode>("BOTH");
  const [hobbs, setHobbs] = useState("");
  const [tach, setTach] = useState("");
  const [saving, setSaving] = useState(false);

  const validateTail = (value: string): boolean => {
    if (!value.trim()) {
      Alert.alert("Required", "Please enter a tail number");
      return false;
    }
    
    const existingTails = multiData?.aircraftList.map((a) => a.tail.toUpperCase()) || [];
    if (existingTails.includes(value.toUpperCase().trim())) {
      Alert.alert("Duplicate", "An aircraft with this tail number already exists");
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateTail(tail)) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      const current: CurrentHours = {
        hobbs: hobbs ? parseFloat(hobbs) : 0,
        tach: tach ? parseFloat(tach) : 0,
        updatedAt: new Date().toISOString(),
      };

      await addAircraft({
        tail: tail.toUpperCase().trim(),
        model: model.trim() || "Aircraft",
        hourMode,
        current,
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error adding aircraft:", error);
      Alert.alert("Error", "Failed to add aircraft. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={headerHeight}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: headerHeight + Spacing.lg,
                paddingBottom: insets.bottom + Spacing.xl,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Card elevation={1} style={styles.formCard}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Tail Number *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={tail}
                  onChangeText={setTail}
                  placeholder="N12345"
                  placeholderTextColor={Colors.dark.textSecondary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="next"
                  testID="input-tail"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Model</ThemedText>
                <TextInput
                  style={styles.input}
                  value={model}
                  onChangeText={setModel}
                  placeholder="Cessna 172, Piper PA-28, etc."
                  placeholderTextColor={Colors.dark.textSecondary}
                  returnKeyType="next"
                  testID="input-model"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Hour Tracking Mode</ThemedText>
                <View style={styles.segmentedControl}>
                  {HOUR_MODES.map((mode) => (
                    <View
                      key={mode.value}
                      style={[
                        styles.segment,
                        hourMode === mode.value && styles.segmentActive,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.segmentText,
                          hourMode === mode.value && styles.segmentTextActive,
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setHourMode(mode.value);
                        }}
                      >
                        {mode.label}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </Card>

            <Card elevation={1} style={styles.formCard}>
              <View style={styles.cardHeader}>
                <Feather name="clock" size={18} color={Colors.dark.accent} />
                <ThemedText style={styles.cardTitle}>Starting Hours (Optional)</ThemedText>
              </View>

              <View style={styles.hoursRow}>
                <View style={styles.hourInputGroup}>
                  <ThemedText style={styles.label}>Hobbs</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={hobbs}
                    onChangeText={setHobbs}
                    placeholder="0.0"
                    placeholderTextColor={Colors.dark.textSecondary}
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                    testID="input-hobbs"
                  />
                </View>
                <View style={styles.hourInputGroup}>
                  <ThemedText style={styles.label}>Tach</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={tach}
                    onChangeText={setTach}
                    placeholder="0.0"
                    placeholderTextColor={Colors.dark.textSecondary}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    testID="input-tach"
                  />
                </View>
              </View>
            </Card>

            <Button
              onPress={handleSave}
              style={styles.saveButton}
              disabled={saving}
              testID="button-save-aircraft"
            >
              {saving ? "Adding..." : "Add Aircraft"}
            </Button>
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
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 17,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundTertiary,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundTertiary,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: Colors.dark.accent,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.textSecondary,
  },
  segmentTextActive: {
    color: Colors.dark.backgroundRoot,
    fontWeight: "600",
  },
  hoursRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  hourInputGroup: {
    flex: 1,
  },
  saveButton: {
    marginTop: Spacing.md,
    height: 52,
  },
});
