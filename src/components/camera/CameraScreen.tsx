import React, { useRef, useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  Text,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../../theme/ThemeProvider";
import { t } from "../../i18n";

type Props = {
  onCapture: (uri: string) => void;
  onClose: () => void;
};

export function CameraScreen({ onCapture, onClose }: Props) {
  const { theme } = useThemeMode();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.text }}>{t("camera.loading")}</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={48} color={theme.primary} />
          <Text style={[styles.permissionText, { color: theme.text }]}>
            {t("camera.permission_required")}
          </Text>
          <Pressable
            style={[styles.permissionBtn, { backgroundColor: theme.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>{t("camera.grant_permission")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        onCapture(photo.uri);
      } catch (error) {
        Alert.alert(t("camera.error_capturing"), t("camera.error_capture_failed"));
        console.error(error);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      if (!permission?.granted) {
        await requestPermission();
        return;
      }

      const result = await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        first: 1,
      });

      if (result.assets.length > 0) {
        onCapture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t("camera.error_capturing"), t("camera.error_pick_failed"));
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash="auto"
      />

      {/* Receipt Guide Frame - Overlay */}
      <View style={styles.frameGuideContainer}>
        <View style={styles.frameGuide} />
      </View>

      {/* Header - Overlay */}
      <View style={[styles.header, { position: "absolute", top: 0, left: 0, right: 0 }]}>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{t("camera.capture_receipt")}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Controls - Overlay */}
      <View style={[styles.controls, { position: "absolute", bottom: 0, left: 0, right: 0 }]}>
        {/* Gallery Button */}
        <Pressable
          onPress={handlePickFromLibrary}
          style={[styles.galleryBtn, { backgroundColor: theme.card }]}
        >
          <Ionicons name="image-outline" size={24} color={theme.primary} />
        </Pressable>

        {/* Capture Button */}
        <Pressable
          onPress={handleTakePicture}
          disabled={isRecording}
          style={[
            styles.captureBtn,
            { opacity: isRecording ? 0.6 : 1 },
          ]}
        >
          <View style={styles.captureBtnInner} />
        </Pressable>

        {/* Spacer */}
        <View style={{ width: 56 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  permissionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  header: {
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  controls: {
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 24,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  galleryBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
  frameGuideContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
    paddingBottom: 40,
  },
  frameGuide: {
    width: "80%",
    aspectRatio: 1 / 1.4,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderStyle: "dashed",
    borderRadius: 12,
  },
});
