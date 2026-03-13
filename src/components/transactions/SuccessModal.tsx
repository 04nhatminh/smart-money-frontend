import React from "react";
import { Modal, View, Text, Pressable, StyleSheet, Image } from "react-native";

interface Props {
    visible: boolean;
    onDone: () => void;
}

export default function SuccessModal({ visible, onDone }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>

                    <Image
                        source={require("../../../assets/successful.jpg")}
                        style={styles.image}
                    />

                    <Text style={styles.title}>
                        Add transaction successfully!
                    </Text>

                    <Text style={styles.desc}>
                        Your transaction has been recorded.
                    </Text>

                    <Pressable style={styles.doneBtn} onPress={onDone}>
                        <Text style={styles.doneText}>Done</Text>
                    </Pressable>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

    card: {
        width: "80%",
        height: 340,
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 20,
        alignItems: "center",
    },

    image: {
        width: 164,
        height: 120,
        margin: 20,
    },

    title: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        color: "#3629B7",
        margin: 8,
    },

    desc: {
        fontSize: 14,
        textAlign: "center",
        marginBottom: 15,   
    },

    doneBtn: {
        marginTop: 16,
        backgroundColor: "#3629B7",
        paddingVertical: 12,
        paddingHorizontal: "40%",
        borderRadius: 20,
    },

    doneText: {
        color: "#fff",
        fontWeight: "600",
    },
});