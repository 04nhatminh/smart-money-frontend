import React, { useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeMode } from "../../theme/ThemeProvider";
import { SubmitButton } from "../SubmitButton";
import { ActionButton } from "../ActionButton";

type Props = {
  audioUri: string;
  onRetake: () => void;
  onConfirm: () => void;
};

export function RecordingPreview({ audioUri, onRetake, onConfirm }: Props) {
  const { theme } = useThemeMode();
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In real implementation: play/pause audio
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          Voice Input
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Audio Playback Area */}
        <View style={[styles.playbackArea, { backgroundColor: theme.card }]}>
          <MaterialCommunityIcons
            name="waveform"
            size={80}
            color={theme.primary}
          />

          <Text style={[styles.subtitle, { color: theme.text }]}>
            Review your recording
          </Text>

          {/* Play/Pause Button */}
          <Pressable
            style={[
              styles.playButton,
              {
                backgroundColor: theme.primary,
              },
            ]}
            onPress={handlePlayPause}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={32}
              color="white"
            />
          </Pressable>

          {/* Playback Progress */}
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[styles.progress, { backgroundColor: theme.primary }]}
            />
          </View>

          <Text style={[styles.duration, { color: theme.subtext }]}>
            0:45
          </Text>
        </View>

        {/* Instructions */}
        <Text style={[styles.instructions, { color: theme.subtext }]}>
          If you're happy with your recording, proceed to enter the transaction details. Otherwise, retake the recording.
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <SubmitButton
          label="Confirm"
          onPress={onConfirm}
        />

        <ActionButton
          label="Retake"
          onPress={onRetake}
          variant="secondary"
          color={theme.text}
          borderColor={theme.border}
        />
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
    alignItems: "center",
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  playbackArea: {
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 24,
    marginBottom: 8,
    width: "80%",
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    width: "35%",
  },
  duration: {
    fontSize: 12,
    fontWeight: "500",
  },
  instructions: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
    gap: 12,
  },
});
