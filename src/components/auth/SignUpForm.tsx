import React, {useState} from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';
import DateTimePicker from '@react-native-community/datetimepicker';

interface SignUpFormProps {

    fullName: string;
    setFullName: (v: string) => void;

    email: string;
    setEmail: (v: string) => void;

    phone: string;
    setPhone: (v: string) => void;

    dateOfBirth: Date;
    setDateOfBirth: (v: Date) => void;

    password: string;
    setPassword: (v: string) => void;

    confirmPassword: string;
    setConfirmPassword: (v: string) => void;

    error: string | null;
    loading: boolean;
    onSignUp: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    dateOfBirth,
    setDateOfBirth,
    error,
    loading,
    onSignUp
}) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const formatDate = (date: Date) => {
        const d = String(date.getDate()).padStart(2, "0");
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    return (
        <>
            <View style={styles.field}>
                <View style={styles.inputRow}>
                    <Ionicons name="at-outline" size={18} color="#6B7280" />
                    <TextInput
                        placeholder={t("common.full_name")}
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                        autoCapitalize="none"
                        keyboardType="default"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>
            </View>


            <View style={styles.field}>
                <View style={styles.inputRow}>
                    <Ionicons name="mail-outline" size={18} color="#6B7280" />
                    <TextInput
                        placeholder={t("common.email")}
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
            </View>

            <View style={styles.field}>
                <View style={styles.inputRow}>
                    <Ionicons name="phone-portrait-outline" size={18} color="black" />
                    <TextInput
                        placeholder={t("auth.phone")}
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                        autoCapitalize="none"
                        value={phone}
                        onChangeText={setPhone}
                    />
                </View>
            </View>

            <View style={styles.field}>
                <View style={styles.inputRow}>
                    <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
                    <TextInput
                        placeholder={t("common.password")}
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>
            </View>

            <View style={styles.field}>
                <View style={styles.inputRow}>
                    <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
                    <TextInput
                        placeholder={t("common.confirm_password")}
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                </View>
            </View>

            <View style={styles.field}>
                <Pressable onPress={() => setShowDatePicker(true)}>
                    <View style={styles.inputRow}>
                        <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                        <Text
                            style={[
                                styles.input,
                                !dateOfBirth && { color: "#9CA3AF" }
                            ]}
                        >
                            {dateOfBirth ? formatDate(dateOfBirth) : "24/05/2004"}
                        </Text>
                    </View>
                </Pressable>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={dateOfBirth ?? new Date(2004, 4, 24)}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            setDateOfBirth(selectedDate);
                        }
                    }}
                />
            )}


            {error && (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            )}

            <Pressable
                style={({ pressed }) => [
                    styles.signupBtn,
                    pressed && styles.signupBtnPressed,
                    loading && styles.disabledBtn
                ]}
                onPress={onSignUp}
                disabled={loading}
            >
                <Text style={styles.signupBtnText}>
                    {loading ? t("auth.sign_up_loading") : t("auth.create_account")}
                </Text>
            </Pressable>
        </>
    );
};

const styles = StyleSheet.create({
    field: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 8,
    },
    inputRow: {
        height: 50,
        borderRadius: 10,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    input: {
        flex: 1,
        color: "#111827",
        fontSize: 16,
    },
    errorText: {
        color: "#ef4444",
        marginTop: 8,
        fontSize: 12,
        marginBottom: 16,
    },
    signupBtn: {
        marginTop: 8,
        height: 50,
        borderRadius: 50,
        backgroundColor: "#4E71FF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#4E71FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    signupBtnPressed: {
        backgroundColor: "#3a56d4",
        transform: [{ scale: 0.98 }],
    },
    disabledBtn: {
        opacity: 0.7,
    },
    signupBtnText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16,
    },
    termsContainer: {
        marginTop: 24,
        paddingHorizontal: 10,
    },
    termsText: {
        fontSize: 12,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 16,
    },
    termsLink: {
        color: "#2563EB",
        fontWeight: "600",
    },
});