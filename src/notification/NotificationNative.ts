import { NativeModules } from 'react-native';

const { NotificationModule } = NativeModules;

export default {
  hasPermission: (): Promise<boolean> =>
      NotificationModule.hasPermission(),

  openSettings: () =>
    NotificationModule.openNotificationListenerSettings(),

  notifyJSReady: () =>
    NotificationModule.notifyJSReady(),
};