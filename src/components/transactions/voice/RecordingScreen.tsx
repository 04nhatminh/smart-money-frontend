import React, { useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../../../theme/ThemeProvider";

type Props = {
  onRecordingComplete: (audioUri: string) => void;
  onCancel: () => void;
};

export function RecordingScreen({ onRecordingComplete, onCancel }: Props) {
  const { theme } = useThemeMode();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Simulate recording (in real implementation, use expo-av)
  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Simulate completion - in real implementation, get actual audio URI
    onRecordingComplete("mock-audio-uri");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={onCancel}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Voice Input</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Recording Area */}
      <View style={[styles.recordingArea, { backgroundColor: theme.card }]}>
        <Text style={[styles.instruction, { color: theme.text }]}>
          {isRecording ? "Recording..." : "Tap to start recording"}
        </Text>

        {isRecording && (
          <Text style={[styles.recordingTime, { color: theme.primary }]}>
            {recordingTime}s
          </Text>
        )}

        {/* Record Button */}
        <Pressable
          style={[
            styles.recordButton,
            {
              backgroundColor: isRecording ? "#ef4444" : theme.primary,
            },
          ]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons
            name={isRecording ? "stop" : "mic"}
            size={40}
            color="white"
          />
        </Pressable>

        {isRecording && (
          <View style={styles.waveform}>
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    backgroundColor: theme.primary,
                    height: 20 + Math.random() * 40,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Cancel Button */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.cancelButton, { borderColor: theme.border }]}
          onPress={onCancel}
        >
          <Text style={[styles.cancelText, { color: theme.text }]}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  recordingArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 40,
    marginBottom: 40,
    borderRadius: 16,
    paddingVertical: 40,
  },
  instruction: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
  },
  recordingTime: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  waveform: {
    flexDirection: "row",
    gap: 8,
    marginTop: 32,
    alignItems: "flex-end",
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  cancelButton: {
    height: 48,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
