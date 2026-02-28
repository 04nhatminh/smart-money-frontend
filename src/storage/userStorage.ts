import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserResponse } from "../types/auth.types";

const USER_KEY = "currentUser";

export const userStorage = {
  setUser: async (user: UserResponse) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser: async (): Promise<UserResponse | null> => {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  clear: async () => {
    await AsyncStorage.removeItem(USER_KEY);
  },
};
