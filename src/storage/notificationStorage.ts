import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'UNREAD_NOTIFICATION_COUNT';

export const notificationStorage = {
  async getUnreadCount(): Promise<number> {
    const value = await AsyncStorage.getItem(KEY);
    return value ? parseInt(value, 10) : 0;
  },

  async setUnreadCount(count: number) {
    await AsyncStorage.setItem(KEY, count.toString());
  },

  async clearUnreadCount() {
    await AsyncStorage.removeItem(KEY);
  }
};