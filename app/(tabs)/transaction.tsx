import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { BottomBar } from "../../src/components/BottomBar";
import { CameraModal } from "../../src/components/camera/CameraModal";
import { useTabNavigation } from "../../src/hooks/useTabNavigation";

export default function TransactionListScreen() {
    const [cameraVisible, setCameraVisible] = useState(false);
    const navigation = useTabNavigation(() => setCameraVisible(true));

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.text}>transaction list</Text>
            </View>

            <BottomBar
                active="transaction"
                handlers={navigation}
            />

            <CameraModal
                visible={cameraVisible}
                onClose={() => setCameraVisible(false)} onCaptureBill={function (uri: string): void {
                    throw new Error("Function not implemented.");
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        fontSize: 16,
        color: "#000",
    },
});
