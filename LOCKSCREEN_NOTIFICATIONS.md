# Lockscreen Notification Transaction Capture

Hệ thống bắt thông báo từ lockscreen và tự động parse dữ liệu giao dịch.

## 📋 Tổng quan

- 🔔 **Bắt thông báo từ lockscreen** khi app bị kill hoặc background
- 📝 **Parse tự động** dữ liệu giao dịch từ nội dung thông báo
- 💾 **Lưu local** các giao dịch để không mất dữ liệu
- 🔄 **Auto-sync** khi app mở lại
- ✅ **Offline-first** - hoạt động ngay cả khi offline

## 🏗️ Kiến trúc

```
lockscreenNotificationHandler.ts  - Main handler & background task
├─ setupLockscreenNotificationHandler()      - Setup background tasks
├─ processLockscreenNotification()           - Process individual notifications
├─ syncLockscreenTransactions()              - Sync to server
└─ getLockscreenTransactionStats()           - Get stats

transactionParser.ts             - Parse transaction từ text
├─ parseTransactionFromNotification()  - Main parser
├─ parseStructuredTransaction()        - Parse JSON
├─ parseTextTransaction()              - Parse text patterns
└─ guessCategory()                     - Auto-categorize

lockscreenTransactionStorage.ts   - Local storage management
├─ saveLockscreenTransaction()
├─ getUnsyncedTransactions()
├─ markAsSynced()
└─ clearAll()

useSyncLockscreenTransactions.ts  - React hook
└─ Auto-sync khi user login
```

## 🚀 Setup

### 1. Cài dependencies

```bash
npm install expo-background-fetch expo-task-manager
```

### 2. Update native config (eas.json hoặc app.json)

**iOS:**
```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["processing", "remote-notification"]
    }
  }
}
```

**Android (gradle):**
```gradle
// android/app/build.gradle
dependencies {
    implementation "com.google.android.gms:play-services-base:18.2.0"
}
```

### 3. Thêm component debug vào app (optional)

```tsx
import { LockscreenTransactionDebug } from "../src/components/LockscreenTransactionDebug";

export default function HomeScreen() {
  return (
    <View>
      {/* ... other components */}
      <LockscreenTransactionDebug />
    </View>
  );
}
```

## 📬 Notification Format

### Format 1: JSON (Recommended)
```json
{
  "title": "Giao dịch mới",
  "body": "Chi 500k cho ăn uống",
  "data": {
    "transaction": {
      "amount": 500000,
      "type": "EXPENSE",
      "category": "FOOD",
      "description": "Cơm chiều",
      "date": "2024-01-15T12:30:00Z"
    }
  }
}
```

### Format 2: Text (Auto-parse)
```json
{
  "title": "Thông báo",
  "body": "Chi 500k cho ăn uống: Cơm chiều"
}
```

### Format 3: Freeform Text
```
"Thu 2 triệu từ lương tháng 1"
"Chi 50k vé xe buýt"
"Bán sách cũ được 100k"
```

## 🎯 Supported Patterns

### Amount Formats
- `500000` → 500000
- `500k` → 500000
- `2 triệu` → 2000000
- `1.5 tỷ` → 1500000000

### Transaction Types
**EXPENSE keywords:** chi, trả, mua, tệ, tiêu
**INCOME keywords:** thu, nhận, kiếm, được, lãi, lương

### Categories (Auto-detect)
- **FOOD:** ăn, uống, cơm, phở, đồ ăn
- **TRANSPORT:** xăng, xe, taxi, bus, vé
- **UTILITIES:** điện, nước, internet, điện thoại
- **SHOPPING:** mua, quần áo, sách
- **HEALTH:** y tế, bệnh viện, thuốc
- **ENTERTAINMENT:** giải trí, phim, game
- **SALARY:** lương, thưởng
- **OTHER:** default fallback

## 💡 Usage

### Auto-sync khi app mở
```tsx
import { useSyncLockscreenTransactions } from "../hooks/useSyncLockscreenTransactions";

export function MyComponent() {
  const { isLoading, stats, syncNow } = useSyncLockscreenTransactions();

  return (
    <Text>Unsynced: {stats.unsynced}</Text>
  );
}
```

### Manual sync
```tsx
const { syncNow } = useSyncLockscreenTransactions();
await syncNow();
```

### Check stats
```tsx
import { getLockscreenTransactionStats } from "../src/notification/lockscreenNotificationHandler";

const stats = await getLockscreenTransactionStats();
console.log(`Total: ${stats.total}, Unsynced: ${stats.unsynced}`);
```

### View cached transactions
```tsx
import { lockscreenTransactionStorage } from "../src/storage/lockscreenTransactionStorage";

const unsynced = await lockscreenTransactionStorage.getUnsyncedTransactions();
console.log(unsynced);
```

## 🔧 Customization

### Thêm category mới
Edit `transactionParser.ts`:
```typescript
const CATEGORY_MAP = {
  "từ khóa": "CATEGORY_NAME",
  // ...
};
```

### Thay đổi parse logic
```typescript
// Thêm pattern mới trong parseTextTransaction()
const patterns = [
  /your-pattern-here/i,
  // ...
];
```

### Custom notification handler
```typescript
export const handleLockscreenNotification = async (notification) => {
  // Custom logic here
  const parsed = parseTransactionFromNotification(content);
  // Do something with parsed data
};
```

## 🐛 Debugging

### Enable detailed logging
```typescript
// In _layout.tsx
useEffect(() => {
  if (__DEV__) {
    // Add detailed logging
    console.log("Lockscreen handler setup");
  }
}, []);
```

### Use debug component
```tsx
<LockscreenTransactionDebug />
```

### Check local storage
```tsx
const all = await lockscreenTransactionStorage.getAll();
const unsynced = await lockscreenTransactionStorage.getUnsyncedTransactions();
console.log({ all, unsynced });
```

## ⚠️ Important Notes

### iOS Limitations
- Background task có thể delay tùy theo system resource
- Notification permission cần explicit request
- Background fetch hoạt động tốt nhất khi device plugin sạc

### Android Limitations
- Doze mode có thể prevent background tasks
- Cần disable battery optimization cho app
- Xiaomi/Huawei devices có custom ROM restrictions

### Best Practices
1. ✅ Always check `isSignedIn` trước khi sync
2. ✅ Handle network errors gracefully
3. ✅ Clear old synced transactions periodically
4. ✅ Use background tasks chỉ khi cần thiết
5. ✅ Test trên real devices, không chỉ emulator

## 🚀 Next Steps

- [ ] Test lockscreen notification capture
- [ ] Configure correct notification format từ backend
- [ ] Add custom category mapping
- [ ] Set up monitoring/analytics
- [ ] Create admin dashboard để view synced transactions
- [ ] Add retry logic cho failed sync attempts

## 📞 Troubleshooting

### Notifications không được bắt
1. Check platform-specific permissions
2. Verify `setupLockscreenNotificationHandler()` được gọi
3. Xem console logs để debug

### Parse failed
1. Verify notification format đúng
2. Check `parseTransactionFromNotification()` logic
3. Add custom pattern nếu format khác

### Sync failed
1. Check network connection
2. Verify authentication token valid
3. Check API endpoint `/api/v1/transactions`
4. Review error logs trong sync function

## 📝 Example Flow

```
┌─────────────────────────────────────┐
│  Notification arrives on lockscreen │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Background task triggered          │
│  (every ~60 seconds)                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Parse transaction data             │
│  (extract: amount, category, etc)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Save to local storage              │
│  (AsyncStorage)                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  App opens & user logs in           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  useSyncLockscreenTransactions hook  │
│  detects unsynced transactions      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Auto-sync to server via API        │
│  POST /api/v1/transactions          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Mark as synced in local storage    │
└──────────────┬──────────────────────┘
               │
               ▼
     ✅ Done! Transaction saved
```
