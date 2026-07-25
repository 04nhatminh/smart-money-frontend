import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Text,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../../../theme/ThemeProvider";
import { Audio } from "expo-av";

type Props = {
  onRecordingComplete: (audioUri: string) => void;
  onCancel: () => void;
};

export function RecordingScreen({ onRecordingComplete, onCancel }: Props) {
  const { theme, mode } = useThemeMode();
  // Theme "green" co token card mau xanh dam (danh cho accent) nen surface dung trang.
  const surface = mode === 'green' ? '#FFFFFF' : theme.card;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const recordingRef = React.useRef<Audio.Recording | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const waveformHeights = useMemo(() => {
    return Array.from({ length: 5 }, () => 20 + Math.random() * 40);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      void cleanupRecording();
    }
  }, []);

  const clearRecordingTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cleanupRecording = async () => {
    try {
      if (recordingRef.current) {
        const status = await recordingRef.current.getStatusAsync();
        if (status.isRecording) {
          await recordingRef.current.stopAndUnloadAsync();
        }
      }
    } catch (error) {
      console.error("🔴 Error during recording cleanup:", error)
    } finally
     {
      recordingRef.current = null
      }
  };

  const startTimer = () => {
    clearRecordingTimer();
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  // Simulate recording (in real implementation, use expo-av)
  const startRecording = async () => {
    try {
      console.log("🎯 Starting recording...");

      const permission = await Audio. requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Denied", 
          "Please allow microphone access to record audio");
        return;
      };

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setRecordingTime(0);

      const recording = new Audio.Recording();

      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.error("🔴 Error starting recording:", error);
      Alert.alert("Recording Error", "An error occurred while starting the recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) {
        throw new Error("No active recording found");
      }

      clearRecordingTimer();

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      setIsRecording(false);
      recordingRef.current = null;

      if (!uri) {
        throw new Error("Failed to retrieve recording URI");
      }
      onRecordingComplete(uri);
    }
      catch (error) {
        console.error("🔴 Error stopping recording:", error);
        Alert.alert("Recording Error", "An error occurred while stopping the recording. Please try again.");
        setIsRecording(false);
      }
  };

  const handleCancel = async () => {
    clearRecordingTimer();
    await cleanupRecording();
    setIsRecording(false);
    setRecordingTime(0);
    onCancel();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={handleCancel}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Voice Input</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Recording Area */}
      <View style={[styles.recordingArea, { backgroundColor: surface }]}>
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
            {waveformHeights.map((height, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    backgroundColor: theme.primary,
                    height,
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
          style={[styles.cancelButton, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
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
    marginTop: 40,
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
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
