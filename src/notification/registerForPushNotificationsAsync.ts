import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return;

  const { status } = await Notifications.requestPermissionsAsync();
  console.log("Permission:", status);
  if (status !== 'granted') return;

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (err) {
    // Expected when Firebase/FCM credentials aren't configured for this build
    // (see https://docs.expo.dev/push-notifications/fcm-credentials/). Push
    // notifications are simply unavailable until that's set up — don't let it
    // block the rest of app init (e.g. WebSocket connection).
    console.warn("⚠️ Push notification token unavailable:", err);
    return undefined;
  }
}