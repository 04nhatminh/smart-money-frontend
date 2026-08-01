import { useEffect } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useThemeMode } from "../src/theme/ThemeProvider";

export default function GroupInviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { theme } = useThemeMode();

  useEffect(() => {
    if (!token) {
      Alert.alert("Invalid Link", "This invitation link is missing a token.", [
        { text: "OK", onPress: () => router.replace("/(tabs)/project") },
      ]);
      return;
    }
    router.replace({ pathname: "/accept-invite", params: { token } });
  }, [token]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}
