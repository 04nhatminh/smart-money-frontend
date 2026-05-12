# 🔧 Troubleshooting: Notification Listener Not Working

## ❌ Problem: "Not receiving notifications from lock screen"

### Quick Diagnosis

1. **Check NotificationModule is available:**
   ```
   Look in React Native console for:
   "✅ NotificationModule found, setting up native listener..."
   OR
   "⚠️ NotificationModule not available"
   ```

2. **Check if NotificationListener is enabled:**
   ```
   Look for:
   "📱 [NativeModule] Notification received:" in logs
   ```

3. **Check if permission granted:**
   ```
   Use <NotificationPermissionStatus /> component
   Should show: ✅ Notification Access Enabled
   ```

## 🔍 Debugging Steps

### Step 1: Verify Native Module Setup

Check logcat for module initialization:
```bash
adb logcat | grep "NotificationModule"
```

Expected output:
```
✅ NotificationModule initialized
✅ BroadcastReceiver registered
✅ Listener added
```

### Step 2: Verify NotificationListener Service

```bash
adb logcat | grep "NotificationListener"
```

Expected output:
```
✅ NotificationListener connected and listening for notifications
📩 Notification posted - Package: com.mbmobile | Title: ...
```

### Step 3: Check Permission Status

**Android Settings:**
1. Settings → Apps → Smart Money (or App permissions)
2. Scroll down to find "Notification" or "Special permissions"
3. Look for "Notification Access" - should be **ON** ✅

**OR via shell:**
```bash
adb shell settings get secure enabled_notification_listeners
```

Should contain:
```
com.ngohaibang.smartmoneyfrontend/.NotificationListener
```

### Step 4: Verify AndroidManifest.xml

Check that NotificationListener is registered:
```bash
adb shell dumpsys notification
```

Should show NotificationListener service listed.

## ⚠️ Common Issues & Fixes

### Issue 1: "NotificationModule not available"

**Cause:** Native module not properly initialized

**Fix:**
```bash
# Rebuild the app
npx expo run:android --clean

# Or from root
npm run build:android
```

### Issue 2: Permission shows as disabled in app

**Cause:** User hasn't enabled NotificationListener in Settings

**Fix:**
1. Tap "Enable Now" button in app (if available)
2. OR manually enable:
   - Settings → Apps → Smart Money
   - Special permissions → Notification Access
   - Toggle **ON**

### Issue 3: Notifications coming but not being captured

**Cause:** Notification filtering not working

**Check in logs:**
```
⏭️ Not a transaction notification, skipping
⏭️ Not from finance app, skipping
```

**Fix:**
1. Check if notification is from finance app:
   ```
   Package: com.mbmobile ✅ (should be in FINANCE_PACKAGES)
   Package: com.vietcombank ❌ (not in list)
   ```

2. Add package to `FINANCE_PACKAGES` in [NotificationListenerService.ts](../src/notification/NotificationListenerService.ts):
   ```typescript
   const FINANCE_PACKAGES = [
     "com.mbmobile",
     "your.new.package", // Add here
   ];
   ```

3. Check if text contains transaction keywords:
   ```
   "chuyển tiền" ✅
   "nhận tiền" ✅
   "ghi có" ✅
   "Random notification" ❌
   ```

4. Add keywords to `isTransactionNotification()` if needed

### Issue 4: AI processing fails after capture

**Cause:** AI API issues

**Check logs:**
```
❌ Failed to submit text to AI
❌ Auto-transaction failed
```

**Fix:**
- Check AI API endpoint is working
- Verify network connection
- Check authentication token

## 📊 Detailed Logging Output

### Expected Flow - Transaction Captured Successfully:

```
🔍 Lock-screen notification text: "Ghi có VND 500,000..."
   - Is Transaction: true
   - Is Finance App: true
🚀 Processing transaction notification...
📤 Emitting: ai:processing-start
📡 Submitting text to AI API...
🔔 AI job submitted, jobId: abc-123
⏳ Waiting for AI result...
🤖 AI result: { amount: 500000, category: "OTHER", ... }
💾 Transaction payload: { ... }
🚀 Creating transaction via API...
📤 Emitting: ai:transaction-created
✅ Auto-transaction created: { id: "123", ... }
```

### Expected Flow - Notification Filtered Out:

```
🔍 Lock-screen notification text: "Battery low"
   - Is Transaction: false
⏭️ Not a transaction notification, skipping
```

## 🧪 Testing

### Option 1: Using App Component

Add to profile/settings screen:
```tsx
import { NotificationPermissionStatus } from "../src/components/NotificationPermissionStatus";

export default function SettingsScreen() {
  return (
    <View>
      <NotificationPermissionStatus />
    </View>
  );
}
```

### Option 2: Via Simulator Notification

```bash
# Send test notification via adb
adb shell am broadcast -a com.ngohaibang.smartmoneyfrontend.NOTIFICATION \
  -e title "Giao dịch" \
  -e text "Ghi có VND 500,000" \
  -e package "com.mbmobile"
```

### Option 3: Real Bank Notification

Send a test transaction from your bank app to trigger real notification capture.

## 📱 Platform-Specific Notes

### Android 12+ (SDK 31+)

- Foreground services require notification channel setup
- Notification listener service needs `android:exported="true"`
- POST_NOTIFICATIONS permission may be required

### Xiaomi/MIUI, Oppo, Vivo

These custom ROMs have aggressive background process killing:

**Fix:**
1. Settings → Permissions → Permission Manager
2. Smart Money → Notifications → Allow
3. Settings → Battery & device care → Battery optimization
4. Exclude "Smart Money"
5. Settings → Special permissions → Notification access → Enable

### Samsung

1. Settings → Apps → Permissions
2. Notifications → Allow
3. Settings → Apps → Smart Money → Permissions
4. Enable all permission requests

## 🆘 Still Not Working?

### Collect Debug Logs:

```bash
# Clear and capture logs
adb logcat -c
# Run your flow
adb logcat > notif-debug.log

# Include all logs mentioning:
# - NotificationModule
# - NotificationListener
# - NotificationListenerService
# - onNotificationReceived
```

### Share when asking for help:
1. Full logcat output
2. Device model and Android version
3. Bank app package name you're testing with
4. Screenshots of Settings permissions

## 📞 Emergency Fallback

If native notification listener doesn't work, you can:

1. **Use clipboard monitoring** (less reliable but always works)
2. **Manual entry** - user manually enters transactions
3. **Screenshot recognition** - OCR-based capture

These are backups if NotificationListener doesn't work.

## ✅ Verification Checklist

- [ ] App installed on device
- [ ] NotificationListener service in AndroidManifest.xml ✅
- [ ] NotificationModule initialized ✅
- [ ] BIND_NOTIFICATION_LISTENER_SERVICE permission granted ✅
- [ ] User enabled NotificationListener in Settings
- [ ] Bank app package in FINANCE_PACKAGES list
- [ ] Transaction keywords in notification text
- [ ] Received "📩 Notification posted" log
- [ ] AI processing started
- [ ] Transaction created successfully

## 📝 Related Files

- [NotificationListenerService.ts](../src/notification/NotificationListenerService.ts) - JS handler
- [NotificationModule.kt](../android/app/src/main/java/com/ngohaibang/smartmoneyfrontend/NotificationModule.kt) - Native module
- [NotificationListener.kt](../android/app/src/main/java/com/ngohaibang/smartmoneyfrontend/NotificationListener.kt) - Native listener
- [AndroidManifest.xml](../android/app/src/main/AndroidManifest.xml) - Service registration
- [notificationListenerPermissionHelper.ts](../src/utils/notificationListenerPermissionHelper.ts) - Permission helper
- [NotificationPermissionStatus.tsx](../src/components/NotificationPermissionStatus.tsx) - Permission UI
