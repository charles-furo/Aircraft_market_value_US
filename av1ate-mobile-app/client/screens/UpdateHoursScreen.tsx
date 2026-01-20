import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Alert, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useData } from "@/context/DataContext";
import { useEntitlement } from "@/context/EntitlementContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

export default function UpdateHoursScreen() {
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { activeAircraft, updateCurrentHours } = useData();
  const { entitlement } = useEntitlement();

  useEffect(() => {
    if (!entitlement.canEdit) {
      navigation.replace("Paywall");
    }
  }, [entitlement.canEdit, navigation]);

  const [hobbs, setHobbs] = useState("");
  const [tach, setTach] = useState("");

  useEffect(() => {
    if (activeAircraft) {
      setHobbs(activeAircraft.current.hobbs?.toString() ?? "");
      setTach(activeAircraft.current.tach?.toString() ?? "");
    }
  }, [activeAircraft]);

  const handleSave = async () => {
    const hobbsValue = hobbs.trim() !== "" ? parseFloat(hobbs) : undefined;
    const tachValue = tach.trim() !== "" ? parseFloat(tach) : undefined;

    if (hobbsValue === undefined || isNaN(hobbsValue) || hobbsValue < 0) {
      Alert.alert("Error", "Please enter a valid Hobbs time");
      return;
    }

    if (tachValue === undefined || isNaN(tachValue) || tachValue < 0) {
      Alert.alert("Error", "Please enter a valid Tach time");
      return;
    }

    await updateCurrentHours({
      hobbs: hobbsValue,
      tach: tachValue,
      updatedAt: new Date().toISOString(),
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
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
        <ThemedText style={styles.title}>Update Aircraft Hours</ThemedText>
        <ThemedText style={styles.subtitle}>
          Enter current meter readings
        </ThemedText>

        <Card elevation={1} style={styles.inputCard}>
          <ThemedText style={styles.label}>Hobbs Time</ThemedText>
          <TextInput
            style={styles.input}
            value={hobbs}
            onChangeText={setHobbs}
            keyboardType="decimal-pad"
            placeholder="0.0"
            placeholderTextColor={Colors.dark.textSecondary}
            testID="input-hobbs"
          />
        </Card>

        <Card elevation={1} style={styles.inputCard}>
          <ThemedText style={styles.label}>Tach Time</ThemedText>
          <TextInput
            style={styles.input}
            value={tach}
            onChangeText={setTach}
            keyboardType="decimal-pad"
            placeholder="0.0"
            placeholderTextColor={Colors.dark.textSecondary}
            testID="input-tach"
          />
        </Card>

        <View style={styles.buttonContainer}>
          <Button onPress={handleSave} testID="button-save-hours">
            Save Hours
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing["2xl"],
  },
  inputCard: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    ...Typography.metric,
    color: Colors.dark.text,
    padding: 0,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
});
