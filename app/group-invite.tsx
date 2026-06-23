import { useEffect } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function GroupInviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();

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
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#3F2CCB" />
    </View>
  );
}
