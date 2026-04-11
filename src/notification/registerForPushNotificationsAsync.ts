import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return;

  const { status } = await Notifications.requestPermissionsAsync();
  console.log("Permission:", status);
  if (status !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  return token;
}