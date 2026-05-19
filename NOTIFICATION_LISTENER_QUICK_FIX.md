## 🔥 Notification Listener Setup Guide

Lý do không nhận được notifications từ lock screen:

### 🎯 Nguyên nhân chính:
**User chưa enable NotificationListener permission trong Android Settings**

### ✅ Quick Fix (3 bước):

#### 1. Xác nhận native module được setup
```bash
adb logcat | grep "NotificationModule"
```
Nên thấy:
```
✅ NotificationModule initialized
✅ BroadcastReceiver registered
```

#### 2. Kiểm tra permission trong Settings

**Android 13+ (MIUI, OneUI, v.v):**
- Settings → Apps → All apps
- Tìm "Smart Money"
- Tap → Permissions
- Scroll down → Notifications
- **Toggle ON** ✅

**Hoặc thông qua Settings:**
- Settings → Special permissions (hoặc Advanced settings)
- Notification access / Notification listener
- Enable "Smart Money" ✅

#### 3. Xác nhận trong App
- Mở app
- Xem console log: `"✅ NotificationListener connected"`
- Hoặc dùng component [NotificationPermissionStatus](../src/components/NotificationPermissionStatus.tsx)

### 🧪 Test:

**Cách 1: Real bank notification**
- Gửi money từ bank app
- Sẽ nhận notification, app sẽ auto-capture

**Cách 2: ADB test**
```bash
adb shell am broadcast -a com.ngohaibang.smartmoneyfrontend.NOTIFICATION \
  -e title "Test" \
  -e text "Chi 500k cho ăn" \
  -e package "com.mbmobile"
```

**Cách 3: Enable debug component**
```tsx
// In profile/settings screen
import { NotificationPermissionStatus } from "../src/components/NotificationPermissionStatus";

<NotificationPermissionStatus />
```

### 📊 Debug Flow:

```
1. App starts
   ↓
2. NotificationListenerService.initialize()
   ↓
3. Check NotificationModule available?
   ├─ Yes → Setup native listener ✅
   └─ No → Warn in console ⚠️
   ↓
4. Bank notification arrives
   ↓
5. NotificationListener.onNotificationPosted() triggered
   ↓
6. Send event to React Native
   ↓
7. NotificationListenerService.handleLockScreenNotification()
   ↓
8. Check: Is transaction? Is finance app?
   ├─ Yes → Process & create transaction ✅
   └─ No → Skip ⏭️
```

### 🐛 Common Issues:

| Issue | Cause | Fix |
|-------|-------|-----|
| "NotificationModule not available" | Native not initialized | `npx expo run:android --clean` |
| Permission shows disabled | User didn't enable | Manual enable in Settings |
| Notifications not captured | Finance app not in list | Add package to FINANCE_PACKAGES |
| Text not recognized | Missing keywords | Add keywords to transaction detection |
| AI processing fails | API error | Check AI service health |

### 📱 Supported Finance Apps:

Currently recognizing notifications from:
- Vietcombank (VCB)
- MB Bank / MB Mobile
- Techcombank
- VPBank
- BIDV
- Vietinbank
- ZaloPay
- Momo
- Agribank

**Missing your bank?** Add package name to [NotificationListenerService.ts](../src/notification/NotificationListenerService.ts):

```typescript
const FINANCE_PACKAGES = [
  // ... existing
  "com.your.bank.package", // Add here
];
```

### 📖 Full Troubleshooting:

See [NOTIFICATION_LISTENER_TROUBLESHOOTING.md](./NOTIFICATION_LISTENER_TROUBLESHOOTING.md) for detailed debugging.

### 🚀 Related Files:

- **Logs:** [Debugger console logs]
- **Permission UI:** [NotificationPermissionStatus](../src/components/NotificationPermissionStatus.tsx)
- **Hook:** [useNotificationListenerPermission](../src/hooks/useNotificationListenerPermission.ts)
- **Native Module:** [NotificationModule.kt](../android/app/src/main/java/com/ngohaibang/smartmoneyfrontend/NotificationModule.kt)
- **Listener Service:** [NotificationListener.kt](../android/app/src/main/java/com/ngohaibang/smartmoneyfrontend/NotificationListener.kt)
- **JS Handler:** [NotificationListenerService.ts](../src/notification/NotificationListenerService.ts)
- **Manifest:** [AndroidManifest.xml](../android/app/src/main/AndroidManifest.xml)

### ✨ Expected Behavior After Setup:

1. ✅ Bank notification arrives on lock screen
2. ✅ App automatically detects it (even if app not open)
3. ✅ Extracts: amount, type (CHI/THU), description
4. ✅ Sends to AI for verification
5. ✅ AI validates and suggests category
6. ✅ Auto-creates transaction
7. ✅ User sees notification in app

---

**Still not working?** Check [NOTIFICATION_LISTENER_TROUBLESHOOTING.md](./NOTIFICATION_LISTENER_TROUBLESHOOTING.md) for detailed debugging steps.
