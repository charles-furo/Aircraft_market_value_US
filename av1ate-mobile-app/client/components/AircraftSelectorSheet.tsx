import React from "react";
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { Aircraft } from "@/types/data";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AircraftSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  aircraftList: Aircraft[];
  activeAircraftId: string;
  onSelectAircraft: (id: string) => void;
  onAddAircraft: () => void;
  onManageAircraft?: (aircraft: Aircraft) => void;
}

function AircraftCard({
  aircraft,
  isActive,
  onPress,
  onLongPress,
}: {
  aircraft: Aircraft;
  isActive: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleLongPress = () => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        styles.aircraftCard,
        isActive && styles.aircraftCardActive,
        pressed && styles.aircraftCardPressed,
      ]}
      testID={`aircraft-card-${aircraft.id}`}
    >
      <View style={styles.aircraftCardContent}>
        <View style={styles.aircraftInfo}>
          <ThemedText style={styles.tailNumber}>{aircraft.tail}</ThemedText>
          <ThemedText style={styles.modelText}>{aircraft.model}</ThemedText>
        </View>
        {isActive ? (
          <View style={styles.checkmarkContainer}>
            <Feather name="check-circle" size={24} color={Colors.dark.accent} />
          </View>
        ) : null}
      </View>
      <View style={styles.hoursInfo}>
        <View style={styles.hourItem}>
          <ThemedText style={styles.hourLabel}>Hobbs</ThemedText>
          <ThemedText style={styles.hourValue}>
            {aircraft.current.hobbs?.toFixed(1) ?? "0.0"}
          </ThemedText>
        </View>
        <View style={styles.hourDivider} />
        <View style={styles.hourItem}>
          <ThemedText style={styles.hourLabel}>Tach</ThemedText>
          <ThemedText style={styles.hourValue}>
            {aircraft.current.tach?.toFixed(1) ?? "0.0"}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

export function AircraftSelectorSheet({
  visible,
  onClose,
  aircraftList,
  activeAircraftId,
  onSelectAircraft,
  onAddAircraft,
  onManageAircraft,
}: AircraftSelectorSheetProps) {
  const insets = useSafeAreaInsets();

  const handleSelectAircraft = (id: string) => {
    onSelectAircraft(id);
    onClose();
  };

  const handleAddAircraft = () => {
    onClose();
    setTimeout(() => {
      onAddAircraft();
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(150)}
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <ThemedText style={styles.title}>Your Aircraft</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {aircraftList.map((aircraft) => (
              <AircraftCard
                key={aircraft.id}
                aircraft={aircraft}
                isActive={aircraft.id === activeAircraftId}
                onPress={() => handleSelectAircraft(aircraft.id)}
                onLongPress={onManageAircraft ? () => onManageAircraft(aircraft) : undefined}
              />
            ))}
          </ScrollView>

          <Pressable
            onPress={handleAddAircraft}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            testID="button-add-aircraft"
          >
            <Feather name="plus" size={20} color={Colors.dark.accent} />
            <ThemedText style={styles.addButtonText}>Add Aircraft</ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingHorizontal: Spacing.lg,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.dark.backgroundTertiary,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.backgroundTertiary,
  },
  title: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  list: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  listContent: {
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  aircraftCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundTertiary,
  },
  aircraftCardActive: {
    borderColor: Colors.dark.accent,
    borderWidth: 2,
  },
  aircraftCardPressed: {
    opacity: 0.8,
  },
  aircraftCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  aircraftInfo: {
    flex: 1,
  },
  tailNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.text,
    letterSpacing: 2,
    marginBottom: 4,
  },
  modelText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  checkmarkContainer: {
    marginLeft: Spacing.md,
  },
  hoursInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.backgroundTertiary,
  },
  hourItem: {
    flex: 1,
  },
  hourLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hourValue: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  hourDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.dark.backgroundTertiary,
    marginHorizontal: Spacing.lg,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    borderStyle: "dashed",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  addButtonPressed: {
    opacity: 0.7,
    backgroundColor: Colors.dark.accent + "10",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
});
