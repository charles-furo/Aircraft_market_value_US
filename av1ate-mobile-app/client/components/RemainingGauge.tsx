import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius } from "@/constants/theme";

type GaugeStatus = "green" | "yellow" | "red";

interface RemainingGaugeProps {
  label: string;
  percent: number;
  status: GaugeStatus;
}

function getStatusColor(status: GaugeStatus): string {
  switch (status) {
    case "green":
      return Colors.dark.statusGreen;
    case "yellow":
      return Colors.dark.statusYellow;
    case "red":
      return Colors.dark.statusRed;
    default:
      return Colors.dark.statusYellow;
  }
}

export function RemainingGauge({ label, percent, status }: RemainingGaugeProps) {
  const clampedPercent = Math.max(0, Math.min(1, percent));
  const fillColor = getStatusColor(status);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <ThemedText style={[styles.label, { color: fillColor }]}>{label}</ThemedText>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedPercent * 100}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  track: {
    height: 10,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: BorderRadius.xs,
  },
});

export function computeGaugeData(
  daysRemaining?: number,
  hoursRemaining?: number,
  intervalDays?: number,
  intervalHours?: number,
  status?: "good" | "due_soon" | "overdue",
): { label: string; percent: number; gaugeStatus: GaugeStatus } {
  let gaugeStatus: GaugeStatus = "green";
  if (status === "due_soon") gaugeStatus = "yellow";
  if (status === "overdue") gaugeStatus = "red";

  let label = "";
  let percent = 0;

  const hasDateInfo = daysRemaining !== undefined && intervalDays !== undefined && intervalDays > 0;
  const hasHoursInfo = hoursRemaining !== undefined && intervalHours !== undefined && intervalHours > 0;

  if (hasDateInfo && hasHoursInfo) {
    const datePercent = Math.max(0, daysRemaining / intervalDays);
    const hoursPercent = Math.max(0, hoursRemaining / intervalHours);

    if (hoursPercent <= datePercent) {
      label = `${hoursRemaining.toFixed(1)} hrs`;
      percent = hoursPercent;
    } else {
      label = `${Math.round(daysRemaining)} days`;
      percent = datePercent;
    }
  } else if (hasHoursInfo) {
    label = `${hoursRemaining!.toFixed(1)} hrs`;
    percent = Math.max(0, hoursRemaining! / intervalHours!);
  } else if (hasDateInfo) {
    label = `${Math.round(daysRemaining!)} days`;
    percent = Math.max(0, daysRemaining! / intervalDays!);
  } else {
    label = "N/A";
    percent = 0;
  }

  if (status === "overdue") {
    percent = 0;
  }

  return { label, percent: Math.min(1, percent), gaugeStatus };
}
