import React, { useRef, useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  Text,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../../../theme/ThemeProvider";
import { t } from "../../../i18n";

type Props = {
  onCapture: (uri: string) => void;
  onClose: () => void;
};

export function CameraScreen({ onCapture, onClose }: Props) {
  const { theme } = useThemeMode();
  const cameraRef = useRef<CameraView>(null);

  // Camera permission
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Image picker permission (🔥 FIX)
  const [imagePickerPermission, requestImagePickerPermission] =
    ImagePicker.useMediaLibraryPermissions();

  const [isProcessing, setIsProcessing] = useState(false);

  // ================= CAMERA PERMISSION =================
  if (!cameraPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <ActivityIndicator />
        <Text style={{ color: theme.text }}>{t("camera.loading")}</Text>
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={48} color={theme.primary} />
          <Text style={[styles.permissionText, { color: theme.text }]}>
            {t("camera.permission_required")}
          </Text>
          <Pressable
            style={[styles.permissionBtn, { backgroundColor: theme.primary }]}
            onPress={requestCameraPermission}
          >
            <Text style={styles.permissionBtnText}>
              {t("camera.grant_permission")}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ================= TAKE PHOTO =================
  const handleTakePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      onCapture(photo.uri);
    } catch (error) {
      Alert.alert(
        t("camera.error_capturing"),
        t("camera.error_capture_failed")
      );
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ================= PICK FROM GALLERY =================
  const handlePickFromLibrary = async () => {
    try {
      setIsProcessing(true);

      // 🔥 FIX: xin permission riêng cho ImagePicker
      let permission = imagePickerPermission;

      if (!permission || !permission.granted) {
        const res = await requestImagePickerPermission();
        permission = res;

        if (!res.granted) {
          Alert.alert(
            "Permission required",
            "Please allow photo library access"
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        onCapture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        t("camera.error_capturing"),
        t("camera.error_pick_failed")
      );
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ================= UI =================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash="auto"
      />

      {/* Loading overlay */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Frame guide */}
      <View style={styles.frameGuideContainer}>
        <View style={styles.frameGuide} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t("camera.capture_receipt")}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          onPress={handlePickFromLibrary}
          style={[styles.galleryBtn, { backgroundColor: theme.card }]}
        >
          <Ionicons name="image-outline" size={24} color={theme.primary} />
        </Pressable>

        <Pressable
          onPress={handleTakePicture}
          disabled={isProcessing}
          style={[
            styles.captureBtn,
            { opacity: isProcessing ? 0.6 : 1 },
          ]}
        >
          <View style={styles.captureBtnInner} />
        </Pressable>

        <View style={{ width: 56 }} />
      </View>
    </SafeAreaView>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },

  loadingOverlay: {
    position: "absolute",
    zIndex: 20,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#fff",
    fontWeight: "700",
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
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },

  frameGuideContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },

  frameGuide: {
    width: "80%",
    aspectRatio: 1 / 1.4,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
    borderStyle: "dashed",
    borderRadius: 12,
  },
});