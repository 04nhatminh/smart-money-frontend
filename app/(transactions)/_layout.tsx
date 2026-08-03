import React from 'react';
import { Stack } from 'expo-router';
import { useThemeMode } from '../../src/theme/ThemeProvider';

export default function TransactionsLayout() {
    // Header cua stack lien mach voi thanh search ben duoi (list.tsx) nen phai
    // dung chung mau theme.primary thay vi mau hardcode.
    const { theme } = useThemeMode();

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: theme.primary,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 28,
                },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen
                name="list"
                options={{
                    title: "Transactions",
                }}
                />
            <Stack.Screen
                name="detail"
                options={{
                    title: 'Transaction Details',
                    headerStyle: {
                    backgroundColor: "#3D2CCB",
                    },
                    headerTintColor: "#FFFFFF",
                    headerTitleStyle: {
                    fontWeight: "700",
                    fontSize: 24,
                    },
                    headerShadowVisible: false,
                }}
                
            />
        </Stack>
    );
}