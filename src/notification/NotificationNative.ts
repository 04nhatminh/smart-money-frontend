import { NativeModules } from 'react-native';

const { NotificationModule } = NativeModules;

// Module native chỉ có trên Android — iOS không có API tương đương
// NotificationListenerService, nên mọi hàm ở đây là no-op trên iOS.
const isAvailable = !!NotificationModule;

export default {
  isAvailable,

  hasPermission: (): Promise<boolean> =>
    isAvailable ? NotificationModule.hasPermission() : Promise.resolve(false),

  openSettings: () =>
    isAvailable ? NotificationModule.openNotificationListenerSettings() : undefined,

  notifyJSReady: () =>
    isAvailable ? NotificationModule.notifyJSReady() : undefined,
};
