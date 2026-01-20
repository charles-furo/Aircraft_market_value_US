import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { RemainingGauge, computeGaugeData } from "@/components/RemainingGauge";
import { AircraftSelectorSheet } from "@/components/AircraftSelectorSheet";
import { useData } from "@/context/DataContext";
import { useEntitlement } from "@/context/EntitlementContext";
import { getStatusColor, getStatusLabel } from "@/lib/statusCalculator";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { StatusType, ComputedStatus } from "@/types/data";

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StatusPill({ status }: { status: StatusType }) {
  const color = getStatusColor(status, Colors.dark);
  const label = getStatusLabel(status);

  return (
    <View testID="status-pill" style={[styles.statusPill, { backgroundColor: color + "20" }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <ThemedText testID="text-status" style={[styles.statusLabel, { color }]}>{label}</ThemedText>
    </View>
  );
}

function AircraftInfo({ 
  model, 
  tail, 
  onPress 
}: { 
  model: string; 
  tail: string; 
  onPress: () => void;
}) {
  return (
    <Pressable 
      testID="aircraft-info" 
      style={styles.aircraftInfo}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <ThemedText testID="text-aircraft-model" style={styles.aircraftModel}>{model}</ThemedText>
      <View style={styles.tailRow}>
        <ThemedText testID="text-tail-number" style={styles.tailNumber}>{tail}</ThemedText>
        <Feather name="chevron-down" size={20} color={Colors.dark.accent} style={styles.tailChevron} />
      </View>
    </Pressable>
  );
}

function HoursCard({
  hobbs,
  tach,
  updatedAt,
  onUpdate,
}: {
  hobbs?: number;
  tach?: number;
  updatedAt?: string;
  onUpdate: () => void;
}) {
  const formatUpdatedAt = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Card elevation={1} style={styles.hoursCard} testID="card-hours">
      <View style={styles.hoursHeader}>
        <ThemedText style={styles.hoursTitle}>Hours</ThemedText>
        <Button onPress={onUpdate} style={styles.updateButton} testID="button-update-hours">
          Update
        </Button>
      </View>
      <View style={styles.hoursRow}>
        <View style={styles.hourItem}>
          <ThemedText style={styles.hourLabel}>Hobbs</ThemedText>
          <ThemedText testID="text-hobbs-value" style={styles.hourValue}>
            {hobbs?.toFixed(1) ?? "0.0"}
          </ThemedText>
        </View>
        <View style={styles.hourDivider} />
        <View style={styles.hourItem}>
          <ThemedText style={styles.hourLabel}>Tach</ThemedText>
          <ThemedText testID="text-tach-value" style={styles.hourValue}>
            {tach?.toFixed(1) ?? "0.0"}
          </ThemedText>
        </View>
      </View>
      {updatedAt ? (
        <ThemedText style={styles.lastUpdated}>
          Last updated {formatUpdatedAt(updatedAt)}
        </ThemedText>
      ) : null}
    </Card>
  );
}

function MaintenanceItemRow({
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
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.maintenanceItem, animatedStyle]}
        testID={`row-maintenance-${item.item.id}`}
      >
        <View style={styles.maintenanceLeft}>
          <View style={[styles.itemStatusDot, { backgroundColor: statusColor }]} />
          <View style={styles.maintenanceTextContainer}>
            <View style={styles.maintenanceHeader}>
              <ThemedText style={styles.maintenanceName}>{item.item.name}</ThemedText>
              <Feather name="chevron-right" size={18} color={Colors.dark.textSecondary} />
            </View>
            <RemainingGauge label={label} percent={percent} status={gaugeStatus} />
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function MaintenanceList({
  items,
  onItemPress,
  onViewAll,
}: {
  items: ComputedStatus[];
  onItemPress: (id: string) => void;
  onViewAll: () => void;
}) {
  const topItems = items.slice(0, 3);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Next Due</ThemedText>
        <Pressable onPress={onViewAll} testID="button-view-all-maintenance">
          <ThemedText style={styles.viewAllText}>View All</ThemedText>
        </Pressable>
      </View>
      <Card elevation={1} style={styles.maintenanceCard}>
        {topItems.length > 0 ? (
          topItems.map((item, index) => (
            <React.Fragment key={item.item.id}>
              <MaintenanceItemRow
                item={item}
                index={index}
                onPress={() => onItemPress(item.item.id)}
              />
              {index < topItems.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))
        ) : (
          <View style={styles.emptyList}>
            <Feather name="check-circle" size={32} color={Colors.dark.statusGreen} />
            <ThemedText style={styles.emptyText}>All items current</ThemedText>
          </View>
        )}
      </Card>
    </View>
  );
}

function FeedbackCard({ onPress }: { onPress: () => void }) {
  return (
    <Card elevation={1} style={styles.feedbackCard} testID="card-feedback">
      <Pressable onPress={onPress} style={styles.feedbackContent}>
        <Feather name="message-circle" size={20} color={Colors.dark.accent} />
        <ThemedText style={styles.feedbackText}>Send Feedback</ThemedText>
        <Feather name="chevron-right" size={18} color={Colors.dark.textSecondary} />
      </Pressable>
    </Card>
  );
}

function SettingsButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.settingsButton} testID="button-settings">
      <Feather name="settings" size={20} color={Colors.dark.textSecondary} />
      <ThemedText style={styles.settingsText}>Settings</ThemedText>
    </Pressable>
  );
}

function TrialBanner({
  isPro,
  trialActive,
  trialExpired,
  remainingDays,
  onUpgrade,
}: {
  isPro: boolean;
  trialActive: boolean;
  trialExpired: boolean;
  remainingDays: number;
  onUpgrade: () => void;
}) {
  if (isPro) {
    return (
      <View style={styles.proBadge} testID="badge-pro">
        <Feather name="award" size={14} color={Colors.dark.accent} />
        <ThemedText style={styles.proBadgeText}>Pro</ThemedText>
      </View>
    );
  }

  if (trialExpired) {
    return (
      <Pressable onPress={onUpgrade} style={styles.trialExpiredBanner} testID="banner-trial-expired">
        <ThemedText style={styles.trialExpiredText}>Trial ended</ThemedText>
        <View style={styles.upgradeButtonSmall}>
          <ThemedText style={styles.upgradeButtonText}>Upgrade</ThemedText>
        </View>
      </Pressable>
    );
  }

  if (trialActive) {
    return (
      <Pressable onPress={onUpgrade} style={styles.trialBanner} testID="banner-trial">
        <ThemedText style={styles.trialBannerText}>
          Free trial: {remainingDays} {remainingDays === 1 ? "day" : "days"} left
        </ThemedText>
        <ThemedText style={styles.trialUpgradeLink}>Upgrade</ThemedText>
      </Pressable>
    );
  }

  return null;
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { activeAircraft, multiData, loading, statuses, overallStatus, setActiveAircraft } = useData();
  const { entitlement } = useEntitlement();
  const [selectorVisible, setSelectorVisible] = useState(false);

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Paywall");
  };

  const handleUpdateHours = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("UpdateHours");
  };

  const handleViewAllMaintenance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MaintenanceList");
  };

  const handleMaintenanceItemPress = (id: string) => {
    navigation.navigate("MaintenanceDetail", { id });
  };

  const handleSendFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Feedback");
  };

  const handleOpenSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Settings");
  };

  const handleOpenAircraftSelector = () => {
    setSelectorVisible(true);
  };

  const handleSelectAircraft = async (id: string) => {
    await setActiveAircraft(id);
  };

  const handleAddAircraft = () => {
    navigation.navigate("AddAircraft");
  };

  if (loading || !activeAircraft) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <AircraftInfo 
            model={activeAircraft.model} 
            tail={activeAircraft.tail} 
            onPress={handleOpenAircraftSelector}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <TrialBanner
            isPro={entitlement.isPro}
            trialActive={entitlement.trialActive}
            trialExpired={entitlement.trialExpired}
            remainingDays={entitlement.trialDaysRemaining}
            onUpgrade={handleUpgrade}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <StatusPill status={overallStatus} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <HoursCard
            hobbs={activeAircraft.current.hobbs}
            tach={activeAircraft.current.tach}
            updatedAt={activeAircraft.current.updatedAt}
            onUpdate={handleUpdateHours}
          />
        </Animated.View>

        <MaintenanceList
          items={statuses}
          onItemPress={handleMaintenanceItemPress}
          onViewAll={handleViewAllMaintenance}
        />

        <Animated.View entering={FadeInDown.delay(450).springify()}>
          <FeedbackCard onPress={handleSendFeedback} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).springify()}>
          <SettingsButton onPress={handleOpenSettings} />
        </Animated.View>
      </ScrollView>

      {multiData ? (
        <AircraftSelectorSheet
          visible={selectorVisible}
          onClose={() => setSelectorVisible(false)}
          aircraftList={multiData.aircraftList}
          activeAircraftId={multiData.activeAircraftId}
          onSelectAircraft={handleSelectAircraft}
          onAddAircraft={handleAddAircraft}
        />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  aircraftInfo: {
    marginBottom: Spacing.lg,
  },
  aircraftModel: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    marginBottom: 2,
  },
  tailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tailNumber: {
    ...Typography.h2,
    color: Colors.dark.text,
    letterSpacing: 2,
  },
  tailChevron: {
    marginLeft: Spacing.sm,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing["2xl"],
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
  hoursCard: {
    marginBottom: Spacing["2xl"],
  },
  hoursHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  hoursTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  updateButton: {
    paddingHorizontal: Spacing["2xl"],
    height: 40,
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  hourItem: {
    flex: 1,
  },
  hourDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.backgroundSecondary,
    marginHorizontal: Spacing.lg,
  },
  hourLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  hourValue: {
    ...Typography.metric,
    color: Colors.dark.text,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.dark.accent,
    fontWeight: "500",
  },
  maintenanceCard: {
    padding: 0,
    overflow: "hidden",
  },
  maintenanceItem: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  maintenanceLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  itemStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.md,
    marginTop: 4,
  },
  maintenanceTextContainer: {
    flex: 1,
  },
  maintenanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  maintenanceName: {
    fontSize: 17,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  maintenanceDue: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.backgroundSecondary,
    marginLeft: Spacing.xl + 10 + Spacing.md,
  },
  emptyList: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: Colors.dark.textSecondary,
  },
  feedbackCard: {
    marginBottom: Spacing.md,
  },
  feedbackContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  feedbackText: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: "500",
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  settingsText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    fontWeight: "500",
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.dark.accent + "20",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  proBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  trialBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  trialBannerText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  trialUpgradeLink: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  trialExpiredBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.statusRed + "15",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  trialExpiredText: {
    fontSize: 14,
    color: Colors.dark.statusRed,
    fontWeight: "500",
  },
  upgradeButtonSmall: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.text,
  },
});
