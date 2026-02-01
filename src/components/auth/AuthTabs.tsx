import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

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
                <Text
                    style={[
                        styles.tabText,
                        activeTab === "signin" && styles.tabTextActive,
                    ]}
                >
                    Sign In
                </Text>
            </Pressable>

            <Pressable
                style={[
                    styles.tabItem,
                    activeTab === "signup" && styles.tabItemActive,
                ]}
                onPress={() => onTabChange("signup")}
            >
                <Text
                    style={[
                        styles.tabText,
                        activeTab === "signup" && styles.tabTextActive,
                    ]}
                >
                    Sign Up
                </Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#f1f5f9",
        borderRadius: 36,
        padding: 4,
        marginTop: 10,
        marginBottom: 24
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 36,
        alignItems: "center",
    },
    tabItemActive: {
        backgroundColor: "#3b82f6",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
    },
    tabTextActive: {
        color: "#fff",
    },
});