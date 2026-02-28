import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { t } from "../../i18n";

interface AuthTabsProps {
    activeTab: 'signin' | 'signup';
    onTabChange: (tab: 'signin' | 'signup') => void;
}

export const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab, onTabChange }) => {
    return (
        <View style={styles.tabContainer}>
            <Pressable
                style={[
                    styles.tabItem,
                    activeTab === "signin" && styles.tabItemActive,
                ]}
                onPress={() => onTabChange("signin")}
            >
                {activeTab === "signin" ? (
                    <LinearGradient
                        colors={['#3629B7', '#5655B9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.activeGradient}
                    >
                        <Text style={[styles.tabText, styles.tabTextActive]}>
                            {t("common.sign_in")}
                        </Text>
                    </LinearGradient>
                ) : (
                    <Text style={[styles.tabText, styles.tabTextInactive]}>
                        {t("common.sign_in")}
                    </Text>
                )}
            </Pressable>

            <Pressable
                style={[
                    styles.tabItem,
                    activeTab === "signup" && styles.tabItemActive,
                ]}
                onPress={() => onTabChange("signup")}
            >
                {activeTab === "signup" ? (
                    <LinearGradient
                        colors={['#3629B7', '#5655B9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.activeGradient}
                    >
                        <Text style={[styles.tabText, styles.tabTextActive]}>
                            {t("common.sign_up")}
                        </Text>
                    </LinearGradient>
                ) : (
                    <Text style={[styles.tabText, styles.tabTextInactive]}>
                        {t("common.sign_up")}
                    </Text>
                )}
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#F2F1F9",
        borderRadius: 16,
        padding: 6,
        marginTop: 10,
        marginBottom: 28,
        shadowColor: "#3629B7",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tabItem: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        overflow: 'hidden',
    },
    tabItemActive: {
        shadowColor: "#3629B7",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    activeGradient: {
        flex: 1,
        width: '100%',
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
    },
    tabText: {
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    tabTextActive: {
        color: "#FFFFFF",
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    tabTextInactive: {
        color: "#5655B9",
    },
});