import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      console.log("🎯 Callback session:", data);

      if (data?.session) {
        // 👉 login thành công → chuyển về home
        router.replace("/");
      } else {
        router.replace("/(auth)/login");
      }
    };

    handleAuth();
  }, []);

  return (
    <View>
      <Text>Processing login...</Text>
    </View>
  );
}