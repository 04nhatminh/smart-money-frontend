import React, { useState, useEffect, useRef } from "react";
import {
    View,
    StyleSheet,
    Text,
    TextInput,
    Pressable,
    Alert,
    ActivityIndicator
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { t } from "../../i18n";
import authService from "../../auth/authService";
import { CheckResponse, ApiResponse, SendResetPasswordResponseData } from "../../types/auth.types";

interface OtpVerificationFormProps {
    email: string;
    type: string;
    onBack?: () => void;
    onResendOtp?: (email: string) =>  Promise<CheckResponse<void>>;
    onVerifyOtp?: (email: string, otp: string) => Promise<CheckResponse<void>>;
    OnForgetPassword?: (email: string, otp: string) => Promise<ApiResponse<SendResetPasswordResponseData>>;
}

export default function OtpVerificationForm({
    email,
    type,
    onBack,
    onResendOtp,
    onVerifyOtp,
    OnForgetPassword
}: OtpVerificationFormProps) {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(600); // 10 phút = 600 giây
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const inputRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));

    useEffect(() => {
        // Đếm ngược thời gian
        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Tự động focus vào ô đầu tiên khi component mount
        setTimeout(() => {
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
        }, 100);
    }, []);

    const handleOtpChange = (value: string, index: number) => {
        // Chỉ cho phép số
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Tự động chuyển sang ô tiếp theo
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Nếu xóa thì chuyển về ô trước đó
        if (!value && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Xử lý phím Backspace
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join("");
        
        if (otpString.length !== 6) {
            setError(t("auth.otp_incomplete"));
            return;
        }

        if (timer === 0) {
            setError(t("auth.otp_expired"));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if(type === "VERIFY") {
                let result = await onVerifyOtp?.(email, otpString);
                if(result?.success) {
                    setOtp(["", "", "", "", "", ""]);
                }
            }
            if(type === "UPDATE") {
                let result = await OnForgetPassword?.(email, otpString);
                if(result?.success) {
                    setOtp(["", "", "", "", "", ""]);
                }                
            }

        } catch (err: any) {
            setError(err.message || t("auth.otp_verification_failed"));
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError(null);

        try {
            await onResendOtp?.(email);
            
            // Reset timer và OTP
            setTimer(600);
            setOtp(["", "", "", "", "", ""]);
            
            // Focus vào ô đầu tiên
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
            
            Alert.alert(t("auth.otp_resent"), t("auth.check_email"));
        } catch (err: any) {
            setError(err.message || t("auth.resend_failed"));
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            {/* Header với nút back */}
            <View style={styles.header}>
                {onBack && (
                    <Pressable 
                        style={styles.backButton}
                        onPress={onBack}
                        disabled={loading}
                    >
                        <Ionicons name="arrow-back" size={20} color="#4F46E5" />
                    </Pressable>
                )}
                <View style={styles.headerContent}>
                    <Ionicons name="mail-unread-outline" size={40} color="#4F46E5" />
                    <Text style={styles.title}>{t("auth.verify_email")}</Text>
                    <Text style={styles.subtitle}>
                        {t("auth.otp_sent_to")} {email}
                    </Text>
                </View>
            </View>

            {/* OTP Inputs */}
            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => {
                            inputRefs.current[index] = ref;
                        }}
                        style={[
                            styles.otpInput,
                            error && styles.otpInputError,
                            digit && styles.otpInputFilled
                        ]}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="numeric"
                        maxLength={1}
                        selectTextOnFocus
                        editable={!loading}
                    />
                ))}
            </View>

            {/* Timer và Error */}
            <View style={styles.statusContainer}>
                <View style={styles.timerContainer}>
                    <Ionicons name="time-outline" size={16} color={timer < 60 ? "#EF4444" : "#6B7280"} />
                    <Text style={[
                        styles.timerText,
                        timer < 60 && styles.timerTextWarning
                    ]}>
                        {formatTime(timer)}
                    </Text>
                    {timer === 0 && (
                        <Text style={styles.expiredText}>
                            {t("auth.otp_expired")}
                        </Text>
                    )}
                </View>

                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                <Pressable
                    style={[
                        styles.verifyButton,
                        (loading || otp.join("").length !== 6 || timer === 0) && styles.verifyButtonDisabled
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={loading || otp.join("").length !== 6 || timer === 0}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={styles.buttonText}>{t("auth.verify")}</Text>
                    )}
                </Pressable>

                <Pressable
                    style={[
                        styles.resendButton,
                        (loading || timer > 0) && styles.resendButtonDisabled
                    ]}
                    onPress={handleResendOtp}
                    disabled={loading || timer > 0}
                >
                    <Text style={styles.resendButtonText}>
                        {t("auth.resend_otp")}
                    </Text>
                </Pressable>
            </View>

            {/* Help Text */}
            <View style={styles.helpContainer}>
                <Text style={styles.helpText}>
                    {t("auth.otp_help")}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        width: "100%",
        maxWidth: 400,
        alignSelf: "center",
    },
    header: {
        marginBottom: 24,
    },
    backButton: {
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 1,
        padding: 4,
    },
    headerContent: {
        alignItems: "center",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
        marginTop: 12,
        marginBottom: 4,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 13,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 18,
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    otpInput: {
        width: 44,
        height: 52,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        textAlign: "center",
        fontSize: 20,
        fontWeight: "600",
        color: "#111827",
        backgroundColor: "#F9FAFB",
    },
    otpInputFilled: {
        borderColor: "#4F46E5",
        backgroundColor: "#FFFFFF",
    },
    otpInputError: {
        borderColor: "#EF4444",
    },
    statusContainer: {
        marginBottom: 20,
        gap: 8,
    },
    timerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    timerText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#6B7280",
    },
    timerTextWarning: {
        color: "#EF4444",
    },
    expiredText: {
        fontSize: 12,
        color: "#EF4444",
        fontWeight: "500",
        marginLeft: 6,
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FEF2F2",
        padding: 10,
        borderRadius: 10,
        gap: 6,
    },
    errorText: {
        color: "#DC2626",
        fontSize: 12,
        fontWeight: "500",
        flex: 1,
    },
    buttonContainer: {
        gap: 10,
        marginBottom: 16,
    },
    verifyButton: {
        backgroundColor: "#4F46E5",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
    },
    verifyButtonDisabled: {
        backgroundColor: "#9CA3AF",
        opacity: 0.7,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
    },
    resendButton: {
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    resendButtonDisabled: {
        opacity: 0.5,
    },
    resendButtonText: {
        color: "#4F46E5",
        fontSize: 14,
        fontWeight: "600",
    },
    helpContainer: {
        alignItems: "center",
    },
    helpText: {
        fontSize: 11,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 14,
    },
});