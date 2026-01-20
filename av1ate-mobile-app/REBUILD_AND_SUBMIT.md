# Quick Guide: Rebuild and Resubmit AV1ATE

This is a condensed checklist for rebuilding and resubmitting your app after fixing the IAP bug.

## Prerequisites Checklist

Before rebuilding, ensure you've completed:

- [ ] RevenueCat account created
- [ ] iOS app configured in RevenueCat dashboard
- [ ] App Store Connect connected to RevenueCat
- [ ] "pro" entitlement created in RevenueCat
- [ ] Product "av1ate_lifetime_999" attached to "pro" entitlement
- [ ] RevenueCat iOS API key added to Replit Secrets
- [ ] Tested IAP in sandbox with TestFlight build

📖 **If you haven't done these steps, see `IAP_SETUP_GUIDE.md` first!**

---

## Step 1: Install Dependencies in Replit

In your Replit AV1ATE project:

```bash
# Navigate to project folder
cd AV1ATE-Tracker

# Install new dependencies (including react-native-purchases)
npm install
```

---

## Step 2: Verify Configuration

### Check Environment Variables
In Replit, click **Secrets** (🔒 icon) and verify:
```
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = <your_key_from_revenuecat>
```

### Check app.json Version
Open `app.json` and bump the version:
```json
{
  "expo": {
    "version": "1.0.1",  // <-- Increment this (was 1.0.0)
    ...
  }
}
```

---

## Step 3: Create EAS Build

### 3.1 Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
eas login
```

### 3.2 Configure EAS (if first time)
```bash
eas build:configure
```

This creates `eas.json`. Ensure it has iOS configuration:
```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.av1atetracker.app"
      }
    }
  }
}
```

### 3.3 Build for App Store
```bash
# Production build for App Store submission
eas build --platform ios --profile production
```

This will:
- Upload your code to Expo servers
- Build the iOS app in the cloud
- Provide a download link for the `.ipa` file

⏱️ Build typically takes 15-30 minutes.

---

## Step 4: Upload to App Store Connect

### 4.1 Download IPA
When build completes:
1. Copy the download link from EAS CLI output
2. Download the `.ipa` file to your computer

### 4.2 Upload to App Store
**Option A: Using Transporter App (Recommended)**
1. Download **Transporter** app from Mac App Store
2. Open Transporter
3. Sign in with your Apple ID
4. Drag the `.ipa` file into Transporter
5. Click **"Deliver"**

**Option B: Using Xcode**
1. Open Xcode
2. Go to **Window** → **Organizer**
3. Click **"Distribute App"**
4. Select the `.ipa` file
5. Follow prompts to upload

---

## Step 5: Prepare for Resubmission

### 5.1 Select Build in App Store Connect
1. Go to https://appstoreconnect.apple.com/
2. Click **"My Apps"** → **"AV1ATE"**
3. Click **"+ Version"** or edit existing submission
4. Under **"Build"**, click **"+"** and select your new build
5. Wait for build to finish processing (can take 30-60 minutes)

### 5.2 Add IAP to Submission
1. Scroll to **"In-App Purchases and Subscriptions"**
2. Click **"+"** to add
3. Select **"av1ate_lifetime_999"**
4. Click **"Done"**

### 5.3 Add Note to Reviewers
In the **"App Review Information"** section, add this note:

```
In-App Purchase Implementation Update

We have fixed the In-App Purchase bug identified in review (Submission ID: 23919f4b-81a5-405d-b289-39c42ecc5c6d).

Changes made:
- Integrated RevenueCat SDK for IAP functionality
- Connected IAP product "av1ate_lifetime_999" to the app
- Tested purchase and restore flows in sandbox mode
- Verified 14-day trial functionality

Testing the IAP:
1. Launch the app (14-day trial starts automatically)
2. Navigate to Settings (gear icon in top right)
3. Tap "Unlock Premium Features"
4. Complete the purchase for "Lifetime Access - $9.99"
5. App should unlock immediately

To test Restore Purchases:
1. Delete and reinstall the app
2. Tap "Restore Purchases" on the paywall
3. Previous purchase should be restored

Thank you for your patience as we resolved this issue.
```

### 5.4 Submit for Review
1. Review all sections for completeness
2. Click **"Submit for Review"**
3. Wait for Apple's response (typically 1-3 days)

---

## Step 6: Test Before Submitting (Recommended)

### Create TestFlight Build First
```bash
# Preview build for TestFlight testing
eas build --platform ios --profile preview
```

After build completes:
1. Upload to TestFlight via Transporter
2. Add internal testers
3. Install on test device
4. **Test the IAP purchase flow thoroughly**
5. Test "Restore Purchases"
6. Verify 14-day trial countdown

Only proceed to production build after successful testing!

---

## Troubleshooting Build Issues

### Issue: "Could not find RevenueCat SDK"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build fails with "Missing API key"
**Solution:**
- Verify Replit Secrets are set correctly
- Use `eas secret:list` to check EAS secrets
- Add missing secret: `eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value <your_key>`

### Issue: Upload to App Store fails
**Solution:**
- Ensure Bundle ID matches: `com.av1atetracker.app`
- Check Apple Developer account has valid paid membership
- Verify certificates are up to date in EAS

---

## Quick Command Reference

```bash
# Install dependencies
npm install

# Login to EAS
eas login

# Create production build
eas build --platform ios --profile production

# Create TestFlight build (for testing)
eas build --platform ios --profile preview

# Check build status
eas build:list

# View build logs
eas build:view <build-id>

# Manage secrets
eas secret:list
eas secret:create --scope project --name KEY_NAME --value KEY_VALUE
```

---

## Timeline Expectations

| Step | Time |
|------|------|
| npm install | 2-5 minutes |
| EAS build | 15-30 minutes |
| Upload to App Store | 5-10 minutes |
| Build processing in ASC | 30-60 minutes |
| Apple review | 1-3 days |

**Total time to resubmission**: ~1-2 hours (excluding Apple review)

---

## After Approval

Once approved:
1. 🎉 Celebrate!
2. Monitor RevenueCat dashboard for purchases
3. Check for any crash reports in Xcode Organizer
4. Update TestFlight build for ongoing testing

---

## Support

If you encounter issues:
1. Check `IAP_SETUP_GUIDE.md` for detailed troubleshooting
2. Review EAS build logs: `eas build:view <build-id>`
3. Check RevenueCat dashboard for integration status
4. Verify IAP product in App Store Connect

**Need help?** Open an issue in this repository with:
- Error message
- Build logs
- Screenshots of configuration

---

**Ready?** Start with Step 1! 🚀
