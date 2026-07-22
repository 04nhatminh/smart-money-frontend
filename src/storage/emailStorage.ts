import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_VERIFY_EMAIL = "pending_verify_email";

export const setPendingVerifyEmail = async (email: string | null) => {
  try {
    await AsyncStorage.setItem(PENDING_VERIFY_EMAIL, email || "");
  } catch (error) {
    console.error("Error setting pending verify email:", error);
    }
};

export const getPendingVerifyEmail = async (): Promise<string | null> => {
  try {
    const email = await AsyncStorage.getItem(PENDING_VERIFY_EMAIL) || null;
    return email;
  } catch (error) {
    console.error("Error getting pending verify email:", error);
    return null;
  }
};