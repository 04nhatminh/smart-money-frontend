import React from "react";
import { SafeAreaView, View } from "react-native";
import { useThemeMode } from "../../theme/ThemeProvider";
import { makeAuthStyles } from "../../styles/authStyles";

export function AuthCardLayout({
  children,
  bottomControls,
}: {
  children: React.ReactNode;
  bottomControls?: React.ReactNode;
}) {
  const { theme } = useThemeMode();
  const styles = React.useMemo(() => makeAuthStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bg}>
        <View style={styles.card}>{children}</View>
      </View>

      {bottomControls ? (
        <View style={styles.bottomControls}>{bottomControls}</View>
      ) : null}
    </SafeAreaView>
  );
}
