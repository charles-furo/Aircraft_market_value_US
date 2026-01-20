import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useEntitlement } from "@/context/EntitlementContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getProductInfo, isRunningInExpoGo, ProductInfo } from "@/lib/purchases";
import { PURCHASES_CONFIG } from "@/lib/purchases.config";

const BENEFITS = [
  { icon: "check-circle", text: "Maintenance status dashboard" },
  { icon: "clock", text: "Track Hobbs/Tach hours" },
  { icon: "edit-3", text: "Log maintenance completions" },
  { icon: "layers", text: "Multi-aircraft support" },
  { icon: "bell", text: "Maintenance reminders" },
];

export default function PaywallScreen() {
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { entitlement, purchase, restore } = useEntitlement();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    available: false,
    price: PURCHASES_CONFIG.DEFAULT_PRICE,
  });
  const [loadingProduct, setLoadingProduct] = useState(true);
  const isExpoGo = isRunningInExpoGo();

  const loadProductInfo = useCallback(async () => {
    setLoadingProduct(true);
    const info = await getProductInfo();
    setProductInfo(info);
    setLoadingProduct(false);
  }, []);

  useEffect(() => {
    loadProductInfo();
  }, [loadProductInfo]);

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadProductInfo();
  };

  const handlePurchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(true);
    const success = await purchase();
    setPurchasing(false);
    if (success) {
      navigation.goBack();
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRestoring(true);
    const success = await restore();
    setRestoring(false);
    if (success) {
      navigation.goBack();
    }
  };

  const handleNotNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const trialExpired = entitlement.trialExpired && !entitlement.isPro;
  const displayPrice = productInfo.price;
  const showStoreError = !isExpoGo && productInfo.error && !loadingProduct;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Feather name="unlock" size={40} color={Colors.dark.accent} />
          </View>
        </View>

        <ThemedText style={styles.title}>Unlock AV1ATE</ThemedText>
        <ThemedText style={styles.subtitle}>
          14-day free trial included
        </ThemedText>

        {entitlement.trialActive && !entitlement.isPro ? (
          <ThemedText style={styles.trialText}>
            {entitlement.trialDaysRemaining} days left in your free trial
          </ThemedText>
        ) : null}

        {trialExpired ? (
          <ThemedText style={styles.expiredText}>
            Your free trial has ended
          </ThemedText>
        ) : null}

        <Card elevation={1} style={styles.benefitsCard}>
          <ThemedText style={styles.benefitsTitle}>Full Access Includes</ThemedText>
          {BENEFITS.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Feather
                name={benefit.icon as any}
                size={18}
                color={Colors.dark.statusGreen}
              />
              <ThemedText style={styles.benefitText}>{benefit.text}</ThemedText>
            </View>
          ))}
        </Card>

        <Card elevation={2} style={styles.priceCard}>
          <ThemedText style={styles.priceLabel}>Lifetime Access</ThemedText>
          {loadingProduct ? (
            <ActivityIndicator color={Colors.dark.accent} style={styles.priceLoader} />
          ) : (
            <ThemedText style={styles.price}>{displayPrice}</ThemedText>
          )}
          <ThemedText style={styles.priceSubtext}>
            One-time purchase. No subscription.
          </ThemedText>
        </Card>

        {showStoreError ? (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{productInfo.error}</ThemedText>
            <Button
              onPress={handleRetry}
              style={styles.retryButton}
              testID="button-retry"
            >
              Retry
            </Button>
          </View>
        ) : null}

        <Button
          onPress={handlePurchase}
          style={styles.purchaseButton}
          testID="button-purchase"
          disabled={purchasing || loadingProduct}
        >
          {purchasing ? (
            <ActivityIndicator color={Colors.dark.text} />
          ) : (
            `Unlock Lifetime — ${displayPrice}`
          )}
        </Button>

        <Button
          onPress={handleRestore}
          style={styles.restoreButton}
          testID="button-restore"
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator color={Colors.dark.accent} size="small" />
          ) : (
            "Restore Purchases"
          )}
        </Button>

        {!trialExpired ? (
          <Button
            onPress={handleNotNow}
            style={styles.continueTrialButton}
            testID="button-continue-trial"
          >
            Continue Trial
          </Button>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.accent + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...Typography.h1,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  trialText: {
    fontSize: 16,
    color: Colors.dark.accent,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  expiredText: {
    fontSize: 16,
    color: Colors.dark.statusRed,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  benefitsCard: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  benefitsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.lg,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  benefitText: {
    fontSize: 16,
    color: Colors.dark.text,
    marginLeft: Spacing.md,
  },
  priceCard: {
    width: "100%",
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  price: {
    ...Typography.h1,
    color: Colors.dark.accent,
    marginBottom: Spacing.sm,
  },
  priceLoader: {
    marginVertical: Spacing.md,
  },
  priceSubtext: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  errorContainer: {
    width: "100%",
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: Colors.dark.statusYellow,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    height: 40,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.dark.statusYellow,
  },
  purchaseButton: {
    width: "100%",
    height: 56,
    marginBottom: Spacing.md,
  },
  restoreButton: {
    width: "100%",
    height: 48,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    marginBottom: Spacing.md,
  },
  continueTrialButton: {
    width: "100%",
    height: 48,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.dark.textSecondary,
  },
});
