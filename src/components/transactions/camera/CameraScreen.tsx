import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  Text,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../../../theme/ThemeProvider";
import { t } from "../../../i18n";
import * as ImageManipulator from "expo-image-manipulator";


type Props = {
  onCapture: (uri: string) => void;
  onClose: () => void;
};

// Guide frame geometry — MUST stay in sync with styles.frameGuide / frameGuideContainer below
const GUIDE_WIDTH_FRACTION = 0.8; // frameGuide width: "80%"
const GUIDE_ASPECT = 1.4; // frameGuide aspectRatio 1 / 1.4  (height = width * 1.4)
const GUIDE_PADDING_BOTTOM = 40; // frameGuideContainer paddingBottom

export function CameraScreen({ onCapture, onClose }: Props) {
  const { theme, mode } = useThemeMode();
  // Theme "green" co token card mau xanh dam (danh cho accent) nen surface dung trang.
  const surface = mode === 'green' ? '#FFFFFF' : theme.card;
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraLayout, setCameraLayout] = useState<{ width: number; height: number } | null>(null);

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
          <View style={styles.permissionActions}>
            <Pressable
              style={[styles.permissionBtn, { backgroundColor: theme.primary }]}
              onPress={requestPermission}
            >
              <Text style={styles.permissionBtnText}>{t("camera.grant_permission")}</Text>
            </Pressable>
            <Pressable
              style={[styles.permissionBtn, { backgroundColor: surface }]}
              onPress={handlePickFromLibrary}
            >
              <Text style={[styles.permissionBtnText, { color: theme.text }]}>
                {t("camera.upload_again")}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  async function handleTakePicture() {
    if (!cameraReady || !cameraRef.current) return;

    try {
      setIsRecording(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      // 🔥 crop to match the on-screen guide frame.
      // The preview renders "cover" (sensor image scaled to fill the view, overflow
      // clipped), so the guide rect covers only a small central part of the full
      // sensor image. Invert that transform to map the guide into sensor pixels.
      const { uri, width, height } = photo;

      let cropW: number, cropH: number, originX: number, originY: number;

      if (cameraLayout && cameraLayout.width > 0 && cameraLayout.height > 0) {
        const Lw = cameraLayout.width;
        const Lh = cameraLayout.height;

        // "cover" scale + centering offsets of the sensor image within the view
        const scale = Math.max(Lw / width, Lh / height);
        const offsetX = (Lw - width * scale) / 2;
        const offsetY = (Lh - height * scale) / 2;

        // Guide rect in view coords: centered horizontally, centered within the
        // padded content box vertically (frameGuideContainer paddingBottom).
        const frameW = Lw * GUIDE_WIDTH_FRACTION;
        const frameH = frameW * GUIDE_ASPECT;
        const frameLeft = (Lw - frameW) / 2;
        const frameTop = (Lh - GUIDE_PADDING_BOTTOM) / 2 - frameH / 2;

        cropW = frameW / scale;
        cropH = frameH / scale;
        originX = (frameLeft - offsetX) / scale;
        originY = (frameTop - offsetY) / scale;

        // Clamp to image bounds
        cropW = Math.min(cropW, width);
        cropH = Math.min(cropH, height);
        originX = Math.max(0, Math.min(originX, width - cropW));
        originY = Math.max(0, Math.min(originY, height - cropH));
      } else {
        // Fallback: centered portrait crop when layout isn't measured yet
        const targetRatio = 1 / GUIDE_ASPECT;
        cropW = width * GUIDE_WIDTH_FRACTION;
        cropH = cropW / targetRatio;
        if (cropH > height) {
          cropH = height;
          cropW = cropH * targetRatio;
        }
        originX = (width - cropW) / 2;
        originY = (height - cropH) / 2;
      }

      console.log("📷 photo dims:", width, "x", height, "layout:", cameraLayout);
      console.log("✂️ crop rect:", { originX, originY, cropW, cropH });

      const cropped = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX,
              originY,
              width: cropW,
              height: cropH,
            },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      onCapture(cropped.uri);

    } catch (error) {
      console.error(error);
      Alert.alert(t("camera.error_capturing"), t("camera.error_capture_failed"));
    } finally {
      setIsRecording(false);
    }
  }

  async function handlePickFromLibrary() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 5],
      });

      if (!result.canceled && result.assets.length > 0) {
        onCapture(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking from library:", error);
      setTimeout(() => {
        Alert.alert(t("camera.error_capturing"), t("camera.error_pick_failed"));
      }, 100);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash="auto"
        onCameraReady={() => setCameraReady(true)}
        onLayout={(e) =>
          setCameraLayout({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
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
          style={[styles.galleryBtn, { backgroundColor: surface }]}
        >
          <Ionicons name="image-outline" size={24} color={theme.primary} />
        </Pressable>

        {/* Capture Button */}
        <Pressable
          onPress={handleTakePicture}
          disabled={isRecording || !cameraReady}
          style={[
            styles.captureBtn,
            { opacity: isRecording || !cameraReady ? 0.6 : 1 },
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
  permissionActions: {
    gap: 12,
    alignItems: "stretch",
    width: "100%",
    paddingHorizontal: 24,
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