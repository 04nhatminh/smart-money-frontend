import { NativeModules, Platform, Alert, Linking } from "react-native";

const { NotificationModule } = NativeModules;

/**
 * Helper to check and enable NotificationListener on Android
 */
export class NotificationListenerPermissionHelper {
  /**
   * Check if user has enabled NotificationListener
   */
  static checkPermission = async (): Promise<boolean> => {
    if (Platform.OS !== "android") {
      console.log("NotificationListener only available on Android");
      return false;
    }

    try {
      if (!NotificationModule) {
        console.warn("NotificationModule not available");
        return false;
      }

      const hasPermission = await NotificationModule.hasNotificationListenerPermission?.();
      console.log("🔍 NotificationListener permission check:", hasPermission);
      return hasPermission || false;
    } catch (error) {
      console.error("Error checking notification permission:", error);
      return false;
    }
  };

  /**
   * Request user to enable NotificationListener
   */
  static requestPermission = async (): Promise<boolean> => {
    if (Platform.OS !== "android") {
      return false;
    }

    try {
      const hasPermission = await this.checkPermission();

      if (hasPermission) {
        console.log("✅ NotificationListener already enabled");
        return true;
      }

      // Prompt user
      return new Promise((resolve) => {
        Alert.alert(
          "📱 Enable Notification Access",
          "To capture bank notifications automatically, we need access to notifications.\n\n" +
            "You'll be taken to Settings to enable it.",
          [
            {
              text: "Cancel",
              onPress: () => resolve(false),
              style: "cancel",
            },
            {
              text: "Open Settings",
              onPress: async () => {
                try {
                  // Open notification listener settings
                  Linking.openSettings();
                  // Give user time to enable, then check again
                  setTimeout(async () => {
                    const enabled = await this.checkPermission();
                    resolve(enabled);
                  }, 3000);
                } catch (error) {
                  console.error("Error opening settings:", error);
                  resolve(false);
                }
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  /**
   * Show detailed guide to enable NotificationListener
   */
  static showEnableGuide = () => {
    Alert.alert(
      "📝 How to Enable Notification Access",
      "1. Tap 'Open Settings' below\n" +
        "2. Go to 'Notification access' or 'Special app access'\n" +
        "3. Find 'Smart Money' app\n" +
        "4. Enable 'Allow notification access'\n" +
        "5. Come back to the app\n\n" +
        "After enabling, the app will automatically capture bank notifications.",
      [
        {
          text: "Got it",
          style: "cancel",
        },
        {
          text: "Open Settings",
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  };

  /**
   * Test notification listener by sending a test notification
   */
  static async testNotificationListener(): Promise<boolean> {
    try {
      if (!NotificationModule?.sendTestNotification) {
        console.warn("sendTestNotification not available");
        return false;
      }

      console.log("📤 Sending test notification...");
      const result = await NotificationModule.sendTestNotification();
      console.log("✅ Test notification sent:", result);
      return true;
    } catch (error) {
      console.error("Error sending test notification:", error);
      return false;
    }
  }
}
