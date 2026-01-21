import * as SecureStore from "expo-secure-store";

export const tokenStorage = {
  setAccessToken: (t: string) =>
    SecureStore.setItemAsync("accessToken", t),

  setRefreshToken: (t: string) =>
    SecureStore.setItemAsync("refreshToken", t),

  getAccessToken: () =>
    SecureStore.getItemAsync("accessToken"),

  getRefreshToken: () =>
    SecureStore.getItemAsync("refreshToken"),

  clear: async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
  },
};