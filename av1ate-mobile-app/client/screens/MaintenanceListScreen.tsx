import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { RemainingGauge, computeGaugeData } from "@/components/RemainingGauge";
import { useData } from "@/context/DataContext";
import { getStatusColor } from "@/lib/statusCalculator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { ComputedStatus } from "@/types/data";

type FilterType = "all" | "due_soon" | "overdue";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FilterPill({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={[
        styles.filterPill,
        active && styles.filterPillActive,
      ]}
    >
      <ThemedText
        style={[
          styles.filterText,
          active && styles.filterTextActive,
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function MaintenanceRow({
  item,
  index,
  onPress,
}: {
  item: ComputedStatus;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const statusColor = getStatusColor(item.status, Colors.dark);

  const { label, percent, gaugeStatus } = computeGaugeData(
    item.daysRemaining,
    item.hoursRemaining,
    item.item.intervalDays,
    item.item.intervalHours,
    item.status,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.row, animatedStyle]}
        testID={`row-maintenance-${item.item.id}`}
      >
        <View style={styles.rowLeft}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <View style={styles.rowTextContainer}>
            <View style={styles.rowHeader}>
              <ThemedText style={styles.rowName}>{item.item.name}</ThemedText>
              <Feather name="chevron-right" size={18} color={Colors.dark.textSecondary} />
            </View>
            <RemainingGauge label={label} percent={percent} status={gaugeStatus} />
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function MaintenanceListScreen() {
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { statuses, loading } = useData();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredStatuses = useMemo(() => {
    if (filter === "all") return statuses;
    return statuses.filter((s) => s.status === filter);
  }, [statuses, filter]);

  const handleItemPress = (item: ComputedStatus) => {
    navigation.navigate("MaintenanceDetail", { id: item.item.id });
  };

  const renderItem = ({ item, index }: { item: ComputedStatus; index: number }) => (
    <MaintenanceRow
      item={item}
      index={index}
      onPress={() => handleItemPress(item)}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.filterContainer, { paddingTop: headerHeight + Spacing.md }]}>
        <FilterPill
          label="All"
          active={filter === "all"}
          onPress={() => setFilter("all")}
          testID="filter-all"
        />
        <FilterPill
          label="Due Soon"
          active={filter === "due_soon"}
          onPress={() => setFilter("due_soon")}
          testID="filter-due-soon"
        />
        <FilterPill
          label="Overdue"
          active={filter === "overdue"}
          onPress={() => setFilter("overdue")}
          testID="filter-overdue"
        />
      </View>

      <FlatList
        data={filteredStatuses}
        renderItem={renderItem}
        keyExtractor={(item) => item.item.id}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Card elevation={1} style={styles.emptyCard}>
            <Feather name="check-circle" size={48} color={Colors.dark.statusGreen} />
            <ThemedText style={styles.emptyText}>
              {filter === "all" ? "No maintenance items" : `No ${filter.replace("_", " ")} items`}
            </ThemedText>
          </Card>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
  },
  filterPillActive: {
    backgroundColor: Colors.dark.accent,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.textSecondary,
  },
  filterTextActive: {
    color: Colors.dark.text,
  },
  row: {
    backgroundColor: Colors.dark.backgroundDefault,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.md,
    marginTop: 4,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowName: {
    fontSize: 17,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  rowDue: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  separator: {
    height: Spacing.sm,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
});
