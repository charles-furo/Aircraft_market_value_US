import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, Colors } from "@/constants/theme";

interface HeaderTitleProps {
  title: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <ThemedText style={styles.subtitle}>AV1ATE Tracker</ThemedText>
        <ThemedText style={styles.title}>{title}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  icon: {
    width: 32,
    height: 32,
    marginRight: Spacing.md,
    borderRadius: 6,
  },
  textContainer: {
    flexDirection: "column",
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
});
