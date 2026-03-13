import React from "react";
import { Modal, View, Text, StyleSheet, Pressable, Image } from "react-native";
import { ButtonSave } from "../ButtonSave";

interface Props {
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function ConfirmExitModal({ visible, onCancel, onConfirm }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>

                    <Image
                        source={require("../../../assets/confirm-exit.jpg")}
                        style={styles.image}
                    />

                    <Text style={styles.title}>
                        The transaction isn't saved!
                    </Text>

                    <Text style={styles.desc}>
                        Are you sure you want to exit?
                    </Text>

                    <View style={styles.buttons}>
                        <ButtonSave
                            label="Cancel"
                            variant="secondary"
                            onPress={onCancel}
                        />

                        <ButtonSave
                            label="Continue"
                            variant="danger"
                            onPress={onConfirm}
                        />
                    </View>
                
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
        color: "#FF4D6D",
        margin: 8,
    },
    desc: {
        fontSize: 14,
        marginTop: 6,
        textAlign: "center",
    },
    buttons: {
        flexDirection: "row",
        gap: 10,
        marginTop: 20,
    },
    cancelBtn: {
        backgroundColor: "#E9E9EF",
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 18,
    },

    continueBtn: {
        backgroundColor: "#FF4D6D",
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 18,
    },
});
