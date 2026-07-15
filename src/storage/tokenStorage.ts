import * as SecureStore from "expo-secure-store";

export const tokenStorage = {
  setAccessToken: (t: string) =>
    SecureStore.setItemAsync("accessToken", t),

  setRefreshToken: (t: string) =>
    SecureStore.setItemAsync("refreshToken", t),

  setResetToken: (t: string) =>
    SecureStore.setItemAsync('resetToken', t),

  getAccessToken: () =>
    SecureStore.getItemAsync("accessToken"),

  getRefreshToken: () =>
    SecureStore.getItemAsync("refreshToken"),

  getResetToken: () =>
    SecureStore.getItemAsync("resetToken"),

  clear: async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("resetToken");
  },
};