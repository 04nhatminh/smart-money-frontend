import React, { use, useState, useEffect } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Audio } from "expo-av";
import { useThemeMode } from "../../../theme/ThemeProvider";
import { t } from "../../../i18n";
import { SubmitButton } from "../../SubmitButton";
import { ActionButton } from "../../ActionButton";

type Props = {
  audioUri: string;
  onRetake: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
};

export function RecordingPreview({ audioUri, onRetake, onConfirm, isSubmitting, onCancel }: Props) {
  const { theme, mode } = useThemeMode();
  // Theme "green" co token card mau xanh dam (danh cho accent) nen surface dung trang.
  const surface = mode === 'green' ? '#FFFFFF' : theme.card;

  const soundRef = React.useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    loadAudio();

    return () => {
      unloadAudio();
    };
  }, [audioUri]);

  const loadAudio = async () => {
    try {
      if (!audioUri) return;

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );

      soundRef.current = sound;

      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
      }

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        setPosition(status.positionMillis || 0);
        setIsPlaying(status.isPlaying);

        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      }); 
    } catch (error) {
      console.error("Error loading audio:", error);
    }
  };

  const unloadAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error("Error unloading audio:", error);
    }
  };

  const handlePlayPause = async () => {
    try {
      if (!soundRef.current) return;

      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        return;
      }

      const isAtEnd =
        status.durationMillis != null &&
        status.positionMillis >= status.durationMillis - 300;

      if (status.didJustFinish || isAtEnd) {
        await soundRef.current.setPositionAsync(0);
      }

      await soundRef.current.playAsync();
    } catch (err) {
      console.error("❌ Play error:", err);
    }
  };

  // ⏱ format time mm:ss
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const progressPercent =
    duration > 0 ? (position / duration) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {isSubmitting ? (
        // 🤖 AI Processing Loading Screen
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <MaterialCommunityIcons
            name="waveform"
            size={80}
            color={theme.primary}
            style={{ marginBottom: 16 }}
          />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            {t("transaction.ai_processing")}
          </Text>
          <Text style={[styles.loadingSubtext, { color: theme.subtext, marginTop: 8 }]}>
            {t("transaction.ai_processing_subtext")}
          </Text>
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Voice Input
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Audio Playback Area */}
            <View style={[styles.playbackArea, { backgroundColor: surface }]}>
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
                  style={[styles.progress, 
                    { 
                      backgroundColor: theme.primary,
                      width: `${progressPercent}%`,
                    }
                  ]}
                />
              </View>
                <Text style={[styles.duration, { color: theme.subtext }]}>
                  {formatTime(position)} / {formatTime(duration)}
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

            <Pressable
              onPress={onRetake}
              style={{
                height: 48,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.inputBg,
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "600" }}>Retake</Text>
            </Pressable>
          </View>
        </>
      )}
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
    alignItems: "center",
    justifyContent: "space-between",
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
    paddingTop: 32,
  },
  playbackArea: {
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 20,
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
    paddingVertical: 8,
    paddingBottom: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
