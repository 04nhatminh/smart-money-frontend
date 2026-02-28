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
import { LinearGradient } from 'expo-linear-gradient';
import { t } from "../../i18n";
import authService from "../../auth/authService";
import { CheckResponse, ApiResponse, SendResetPasswordResponseData } from "../../types/auth.types";

interface OtpVerificationFormProps {
    email: string;
    type: string;
    onBack?: () => void;
    onResendOtp?: (email: string) => Promise<CheckResponse<void>>;
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
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    
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
                setActiveIndex(0);
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
            setActiveIndex(index + 1);
        }

        // Nếu xóa thì chuyển về ô trước đó
        if (!value && index > 0) {
            inputRefs.current[index - 1]?.focus();
            setActiveIndex(index - 1);
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Xử lý phím Backspace
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            setActiveIndex(index - 1);
        }
    };

    const handleFocus = (index: number) => {
        setActiveIndex(index);
        setError(null);
    };

    const handleBlur = () => {
        setActiveIndex(null);
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
                setActiveIndex(0);
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
                        style={({ pressed }) => [
                            styles.backButton,
                            pressed && styles.backButtonPressed
                        ]}
                        onPress={onBack}
                        disabled={loading}
                    >
                        <Ionicons name="arrow-back" size={20} color="#3629B7" />
                    </Pressable>
                )}
                <View style={styles.headerContent}>
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#3629B7', '#5655B9']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="mail-unread-outline" size={24} color="#FFFFFF" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.title}>{t("auth.verify_email")}</Text>
                    <Text style={styles.subtitle}>
                        {t("auth.otp_sent_to")} <Text style={styles.emailText}>{email}</Text>
                    </Text>
                </View>
            </View>

            {/* OTP Inputs */}
            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <Pressable
                        key={index}
                        onPress={() => {
                            inputRefs.current[index]?.focus();
                            setActiveIndex(index);
                        }}
                        style={({ pressed }) => [
                            styles.otpPressable,
                            pressed && styles.otpPressablePressed
                        ]}
                    >
                        <TextInput
                            ref={(ref) => {
                                inputRefs.current[index] = ref;
                            }}
                            style={[
                                styles.otpInput,
                                activeIndex === index && styles.otpInputFocused,
                                error && !digit && styles.otpInputError,
                                digit && styles.otpInputFilled
                            ]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            onFocus={() => handleFocus(index)}
                            onBlur={handleBlur}
                            keyboardType="numeric"
                            maxLength={1}
                            selectTextOnFocus
                            editable={!loading}
                        />
                    </Pressable>
                ))}
            </View>

            {/* Timer và Error */}
            <View style={styles.statusContainer}>
                <View style={[
                    styles.timerContainer,
                    timer < 60 && styles.timerContainerWarning
                ]}>
                    <Ionicons 
                        name="time-outline" 
                        size={16} 
                        color={timer < 60 ? "#EF4444" : "#3629B7"} 
                    />
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
                        <Ionicons name="alert-circle" size={16} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                <Pressable
                    style={({ pressed }) => [
                        styles.verifyButtonWrapper,
                        pressed && styles.verifyButtonPressed,
                        (loading || otp.join("").length !== 6 || timer === 0) && styles.verifyButtonDisabled
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={loading || otp.join("").length !== 6 || timer === 0}
                >
                    <LinearGradient
                        colors={['#3629B7', '#5655B9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.verifyButton}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="#FFFFFF" size="small" />
                                <Text style={styles.buttonText}>Verifying...</Text>
                            </View>
                        ) : (
                            <Text style={styles.buttonText}>{t("auth.verify")}</Text>
                        )}
                    </LinearGradient>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [
                        styles.resendButton,
                        pressed && styles.resendButtonPressed,
                        (loading || timer > 0) && styles.resendButtonDisabled
                    ]}
                    onPress={handleResendOtp}
                    disabled={loading || timer > 0}
                >
                    <Ionicons 
                        name="refresh-outline" 
                        size={16} 
                        color={timer > 0 ? "#A8A3D7" : "#3629B7"} 
                    />
                    <Text style={[
                        styles.resendButtonText,
                        (loading || timer > 0) && styles.resendButtonTextDisabled
                    ]}>
                        {t("auth.resend_otp")}
                    </Text>
                </Pressable>
            </View>

            {/* Help Text */}
            <View style={styles.helpContainer}>
                <Ionicons name="information-circle-outline" size={14} color="#A8A3D7" />
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
        padding: 24,
        borderWidth: 1,
        borderColor: "#F2F1F9",
        shadowColor: "#3629B7",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        width: "100%",
        maxWidth: 400,
        alignSelf: "center",
    },
    header: {
        marginBottom: 28,
    },
    backButton: {
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 1,
        padding: 8,
        borderRadius: 20,
    },
    backButtonPressed: {
        opacity: 0.7,
        backgroundColor: "#F2F1F9",
    },
    headerContent: {
        alignItems: "center",
    },
    iconContainer: {
        marginBottom: 16,
    },
    iconGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#3629B7",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1F2937",
        marginBottom: 6,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 13,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 18,
    },
    emailText: {
        color: "#3629B7",
        fontWeight: "600",
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
        gap: 8,
    },
    otpPressable: {
        flex: 1,
    },
    otpPressablePressed: {
        opacity: 0.8,
    },
    otpInput: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#F2F1F9",
        textAlign: "center",
        fontSize: 22,
        fontWeight: "600",
        color: "#1F2937",
        backgroundColor: "#F9FAFB",
    },
    otpInputFocused: {
        borderColor: "#3629B7",
        backgroundColor: "#FFFFFF",
        shadowColor: "#3629B7",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    otpInputFilled: {
        borderColor: "#3629B7",
        backgroundColor: "#FFFFFF",
    },
    otpInputError: {
        borderColor: "#EF4444",
        backgroundColor: "#FEF2F2",
    },
    statusContainer: {
        marginBottom: 24,
        gap: 10,
    },
    timerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: "#F2F1F9",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignSelf: "center",
    },
    timerContainerWarning: {
        backgroundColor: "#FEF2F2",
    },
    timerText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#3629B7",
    },
    timerTextWarning: {
        color: "#EF4444",
    },
    expiredText: {
        fontSize: 12,
        color: "#EF4444",
        fontWeight: "500",
        marginLeft: 4,
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        padding: 12,
        borderRadius: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: "#FEE2E2",
    },
    errorText: {
        color: "#DC2626",
        fontSize: 13,
        fontWeight: "500",
        flex: 1,
    },
    buttonContainer: {
        gap: 12,
        marginBottom: 20,
    },
    verifyButtonWrapper: {
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: '#3629B7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    verifyButton: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    verifyButtonPressed: {
        transform: [{ scale: 0.98 }],
    },
    verifyButtonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    resendButton: {
        height: 48,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        borderWidth: 1.5,
        borderColor: "#F2F1F9",
        backgroundColor: "#FFFFFF",
    },
    resendButtonPressed: {
        backgroundColor: "#F2F1F9",
        borderColor: "#3629B7",
    },
    resendButtonDisabled: {
        opacity: 0.5,
        borderColor: "#E5E7EB",
    },
    resendButtonText: {
        color: "#3629B7",
        fontSize: 14,
        fontWeight: "600",
    },
    resendButtonTextDisabled: {
        color: "#A8A3D7",
    },
    helpContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#F2F1F9",
    },
    helpText: {
        fontSize: 11,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 14,
        flex: 1,
    },
});