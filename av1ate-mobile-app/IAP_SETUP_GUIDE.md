# AV1ATE In-App Purchase Setup Guide

This guide will walk you through setting up In-App Purchases (IAP) for the AV1ATE app using RevenueCat.

## Overview

Your app is configured with:
- **Product ID**: `av1ate_lifetime_999`
- **Product Type**: Non-consumable (one-time purchase)
- **Price**: $9.99 USD
- **Trial**: 14-day free trial
- **IAP Provider**: RevenueCat (middleware for iOS StoreKit)

## Current Status

✅ **Completed:**
- IAP code implementation (purchases.ts, EntitlementContext)
- PaywallScreen UI
- Trial logic (14 days)
- Product configuration
- RevenueCat SDK installed (`react-native-purchases@^8.3.2`)

❌ **Remaining Steps:**
1. Create RevenueCat account and configure dashboard
2. Set up environment variables
3. Test IAP in sandbox mode
4. Rebuild and resubmit to App Store

---

## Step 1: RevenueCat Account Setup

### 1.1 Create RevenueCat Account
1. Go to https://www.revenuecat.com/
2. Click "Sign Up" and create a free account
3. Verify your email

### 1.2 Create New Project
1. In RevenueCat dashboard, click **"Create new project"**
2. Enter project name: `AV1ATE Tracker`
3. Click **"Create"**

### 1.3 Add iOS App
1. In your project, click **"Apps"** → **"+ New"**
2. Select **"iOS"**
3. Enter details:
   - **App name**: AV1ATE Tracker
   - **Bundle ID**: `com.av1atetracker.app` (matches your app.json)
4. Click **"Save"**

### 1.4 Connect to App Store Connect
1. In RevenueCat, go to your iOS app settings
2. Click **"App Store Connect"** tab
3. Follow instructions to generate and upload:
   - **App Store Connect API Key** (create in App Store Connect → Users & Access → Keys)
   - **Issuer ID** (found in App Store Connect → Users & Access → Keys)
   - **Key ID** (from the API key you created)
4. Upload the `.p8` file downloaded from App Store Connect
5. Click **"Verify"** - RevenueCat will sync your products

---

## Step 2: Configure Products in RevenueCat

### 2.1 Create Entitlement
1. In RevenueCat dashboard, go to **"Entitlements"**
2. Click **"+ New"**
3. Enter:
   - **Identifier**: `pro` (must match ENTITLEMENT_ID in purchases.config.ts)
   - **Display name**: Pro Access
4. Click **"Create"**

### 2.2 Attach Product to Entitlement
1. In **"Entitlements"**, click on **"pro"**
2. Click **"Attach"**
3. Select platform: **"iOS"**
4. Find and select: **"av1ate_lifetime_999"**
5. Click **"Attach"**

### 2.3 Verify Product Configuration
In App Store Connect, verify your IAP product:
1. Go to **App Store Connect** → **My Apps** → **AV1ATE**
2. Click **"In-App Purchases"**
3. Verify **"av1ate_lifetime_999"** exists with:
   - **Type**: Non-Consumable
   - **Reference Name**: Lifetime Access (or similar)
   - **Product ID**: `av1ate_lifetime_999`
   - **Price**: $9.99 USD
   - **Status**: Ready to Submit (or Approved)

---

## Step 3: Get API Keys

### 3.1 Copy RevenueCat API Keys
1. In RevenueCat dashboard, go to your project
2. Click on **iOS app** → **"API Keys"** tab
3. Copy the **"Public iOS SDK key"**
4. Save this key - you'll need it for environment variables

### 3.2 Android Key (Optional - for future)
If you plan to support Android later:
1. Add Android app in RevenueCat
2. Copy the **"Public Android SDK key"**

---

## Step 4: Configure Environment Variables

### 4.1 In Replit
1. Open your AV1ATE project in Replit
2. Click on **"Secrets"** (🔒 icon in left sidebar)
3. Add these secrets:

```
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=<your_ios_sdk_key_here>
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=<your_android_sdk_key_here>
```

Replace `<your_ios_sdk_key_here>` with the key from Step 3.1

### 4.2 For Local Development (Optional)
Create a `.env` file in the AV1ATE-Tracker folder:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=<your_ios_sdk_key_here>
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=<your_android_sdk_key_here>
```

⚠️ **Important**: Never commit this file to Git! It's already in `.gitignore`.

### 4.3 For EAS Build
When building with EAS, add secrets to `eas.json` or pass via EAS Secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value <your_key>
```

---

## Step 5: Test IAP in Sandbox Mode

### 5.1 Create Sandbox Test User
1. Go to **App Store Connect**
2. Click **"Users and Access"**
3. Click **"Sandbox Testers"** tab
4. Click **"+"** to add a new tester
5. Create a test Apple ID (use a unique email)
6. Save credentials - you'll need them for testing

### 5.2 Install TestFlight Build
Your app needs to be built with EAS and installed via TestFlight to test IAP:

```bash
# In Replit terminal:
npx eas build --platform ios --profile preview
```

After build completes, upload to TestFlight and install on your device.

### 5.3 Test Purchase Flow
1. On your test device, sign out of your real Apple ID
2. In **Settings** → **App Store** → **Sandbox Account**
3. Sign in with your sandbox test user
4. Open AV1ATE app from TestFlight
5. Go to Settings or wait for paywall
6. Tap **"Unlock Lifetime — $9.99"**
7. Complete sandbox purchase (you won't be charged)
8. Verify the app unlocks and shows "Pro" status

### 5.4 Test Restore Purchases
1. Delete and reinstall the app
2. Tap **"Restore Purchases"**
3. Verify your purchase is restored

---

## Step 6: Build and Submit to App Store

### 6.1 Create Production Build
```bash
# In Replit terminal:
npx eas build --platform ios --profile production
```

### 6.2 Update Version
In `app.json`, increment the version:
```json
"version": "1.0.1"
```

### 6.3 Submit to App Store
1. Download the `.ipa` file from EAS
2. Upload to App Store Connect using **Transporter** app or **Xcode**
3. Go to **App Store Connect** → **My Apps** → **AV1ATE**
4. Select your build for submission
5. In **"In-App Purchases"** section, select **"av1ate_lifetime_999"**
6. Submit for review

---

## Step 7: Respond to Apple Review

When resubmitting, include this note to reviewers:

> **In-App Purchase Implementation Update**
>
> We have fixed the In-App Purchase bug identified in review (Submission ID: 23919f4b-81a5-405d-b289-39c42ecc5c6d).
>
> **Changes made:**
> - Integrated RevenueCat SDK for IAP functionality
> - Connected IAP product "av1ate_lifetime_999" to the app
> - Tested purchase and restore flows in sandbox mode
> - Verified 14-day trial functionality
>
> **Testing the IAP:**
> 1. Launch the app (14-day trial starts automatically)
> 2. Navigate to Settings (gear icon in top right)
> 3. Tap "Unlock Premium Features"
> 4. Complete the purchase for "Lifetime Access - $9.99"
> 5. App should unlock immediately
>
> **To test Restore Purchases:**
> 1. Delete and reinstall the app
> 2. Tap "Restore Purchases" on the paywall
> 3. Previous purchase should be restored
>
> Thank you for your patience as we resolved this issue.

---

## Troubleshooting

### Issue: "Store unavailable" error
**Solution:**
- Verify RevenueCat API keys are correct in Replit Secrets
- Ensure you're testing on a real device with TestFlight build (not Expo Go)
- Check RevenueCat dashboard for connection status

### Issue: Product not loading
**Solution:**
- Verify product ID `av1ate_lifetime_999` exists in App Store Connect
- Check product is attached to "pro" entitlement in RevenueCat
- Wait 24 hours after creating product in App Store Connect (sometimes takes time to propagate)
- Check RevenueCat → App Store Connect integration is verified

### Issue: Purchase succeeds but doesn't unlock
**Solution:**
- Check RevenueCat dashboard → Customers to see if purchase recorded
- Verify entitlement ID is "pro" in both RevenueCat and purchases.config.ts
- Check app logs for errors in `purchaseLifetime()` function

### Issue: Build fails in Replit
**Solution:**
- Ensure `react-native-purchases` is in package.json dependencies
- Run `npm install` to install new dependencies
- Clear Replit cache and rebuild

---

## Architecture Overview

### How IAP Works in AV1ATE:

1. **Trial Management** (`lib/entitlement.ts`):
   - 14-day trial starts on first app launch
   - Stored in AsyncStorage (not server-dependent)
   - Counts down days remaining

2. **Purchase Flow** (`lib/purchases.ts`):
   - User taps "Unlock Lifetime"
   - RevenueCat SDK calls iOS StoreKit
   - Apple processes payment
   - RevenueCat receives webhook
   - App checks entitlement and unlocks

3. **Entitlement Check** (`context/EntitlementContext.tsx`):
   - On app launch, checks RevenueCat for active entitlements
   - If "pro" entitlement is active, sets `isPro: true`
   - UI shows/hides features based on `canEdit` flag

4. **Restore Flow**:
   - User taps "Restore Purchases"
   - RevenueCat queries Apple for previous purchases
   - If found, grants "pro" entitlement
   - App unlocks

---

## Support & Resources

- **RevenueCat Docs**: https://www.revenuecat.com/docs
- **Expo IAP Guide**: https://docs.expo.dev/guides/in-app-purchases/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **RevenueCat Dashboard**: https://app.revenuecat.com/

---

## Quick Reference

### Key Files Modified:
- ✅ `package.json` - Added `react-native-purchases@^8.3.2`
- ✅ `app.json` - Added RevenueCat plugin
- ✅ `lib/purchases.config.ts` - Product ID configured
- ✅ `lib/purchases.ts` - IAP logic implemented

### Environment Variables Needed:
```
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=<from_revenuecat>
```

### Product Configuration:
- **Product ID**: `av1ate_lifetime_999`
- **Entitlement ID**: `pro`
- **Bundle ID**: `com.av1atetracker.app`
- **Trial**: 14 days (managed in app, not in Apple)

---

**Next Steps**: Follow Step 1 to create your RevenueCat account and configure the dashboard!
