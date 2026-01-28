import React from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { BottomBar } from "../src/components/BottomBar";

export default function LandingHome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>Home</Text>
      </View>

      <BottomBar
        active="home"
        onHome={() => {}}
        onStats={() => {}}
        onAdd={() => console.log("scan/add")}
        onWallet={() => {}}
        onProfile={() => router.push("/(auth)/login")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  authBox: { marginTop: 16, gap: 10 },
  btn: { height: 44, borderRadius: 10, backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
  btnOutline: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#111", alignItems: "center", justifyContent: "center" },
  btnOutlineText: { color: "#111", fontWeight: "700" },
  navbar: { height: 64, borderTopWidth: 1, borderColor: "#eee", alignItems: "center", justifyContent: "center" },
});