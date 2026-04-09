import React from 'react';
import { Stack } from 'expo-router';

export default function TransactionsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: '#f5f5f5',
                },
                headerTintColor: '#000',
                headerTitleStyle: {
                    fontWeight: '600',
                    fontSize: 18,
                },
            }}
        >
            <Stack.Screen
                name="list"
                options={{
                    title: "Transactions",
                    headerStyle: {
                    backgroundColor: "#3D2CCB",
                    },
                    headerTintColor: "#FFFFFF",
                    headerTitleStyle: {
                    fontWeight: "700",
                    fontSize: 28,
                    },
                    headerShadowVisible: false,
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
                    fontSize: 28,
                    },
                    headerShadowVisible: false,
                }}
            />
        </Stack>
    );
}