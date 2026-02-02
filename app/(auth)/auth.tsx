import React, { useState } from "react";
import {
    View,
    StyleSheet,
    SafeAreaView,
    Image,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { useRouter } from "expo-router";
import authService from "../../src/auth/authService";
import { t } from "../../src/i18n";
import { LanguageSwitch } from "../../src/components/LanguageSwitch";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { SignInForm } from "../../src/components/auth/SignInForm";
import { SignUpForm } from "../../src/components/auth/SignUpForm";
import OtpVerificationScreen from "../../src/components/auth/OTPVerify";
import { ResetPasswordForm } from "../../src/components/auth/ResetPasswordForm";
import { SocialLogin } from "../../src/components/auth/SocialLogin";
import { AuthTabs } from "../../src/components/auth/AuthTabs";
import { formatDateToDDMMYYYY } from "../../src/utils/dateFormatter";
import { Ionicons } from '@expo/vector-icons';
import { CheckResponse, AuthResponse, RegisterRequest, VerifyEmailRequest, SendResetPasswordOtpRequest, ResetPasswordRequest } from "../../src/types/auth.types";

export default function AuthScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
    
    // Sign In states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    
    // Sign Up states
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date());
    const [avatar, setAvatar] = useState("");

    // OTP states
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpEmail, setOtpEmail] = useState<string | null>(null);
    const [otpType, setOtpType] = useState<"VERIFY" | "UPDATE">("VERIFY");

    // ResetPassword states
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [newConfirmPassword, setNewConfirmPassword] = useState("");

    // Common states
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { lang } = useLanguage();
    
    const loginGif = require("../../assets/pig-bank.gif");
    const themesGif = require("../../assets/themes-login.png");

    const handleSignIn = async () => {
        setError(null);
        setLoading(true);
        
        try {
            const res = await authService.login(email, password);
            if(res.success) {
                router.replace('/(auth)/profile');
            }
        } catch (err: any) {
            setError(err.message || t("auth.login_failed"));
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setError(null);
        setSuccess(null);
        
        // Validation
        if (!fullName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
            setError(t("auth.fill_required_fields"));
            return;
        }
        
        if (signupPassword !== confirmPassword) {
            setError(t("auth.passwords_dont_match"));
            return;
        }
        
        if (signupPassword.length < 6) {
            setError(t("auth.password_too_short"));
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(signupEmail)) {
            setError(t("auth.invalid_email"));
            return;
        }
        
        setLoading(true);
        
        try {
            const formattedDate = formatDateToDDMMYYYY(dateOfBirth);
            
            const registerData: RegisterRequest = {
                username: username.trim(),
                fullName: fullName.trim(),
                email: signupEmail.trim(),
                password: signupPassword,
                confirmPassword: confirmPassword,
                phone: phone.trim(),
                dateOfBirth: formattedDate,
                avatar: avatar.trim()
            };
            
            const response = await authService.register(registerData);
            
            if (response.success) {
                setShowOTPModal(true);
                setOtpEmail(signupEmail);
                setOtpType("VERIFY");
            } else {
                setError(response.message || t("auth.registration_failed"));
                
                // Handle specific errors
                if (response.errors) {
                    const errorMessages = Object.values(response.errors).flat();
                    setError(errorMessages.join(", "));
                }
            }
        } catch (err: any) {
            console.error("Registration error:", err);
            setError(err.message || t("auth.registration_error"));
        } finally {
            setLoading(false);
        }
    };

    const onVerifyOtp = async (email: string, otpString: string) => {
        let request: VerifyEmailRequest = {
            email: email,
            otp: otpString
        };
        const res = await authService.verifyEmail(request);
        if (res.success) {
            setShowOTPModal(false);
            setActiveTab("signin");
            setSuccess(t("auth.email_verified"));
        }
        return res;
    };

    const onVerifyResetPassword = async (email: string, otpString: string) => {
        let request: VerifyEmailRequest = {
            email: email,
            otp: otpString
        };
        const res = await authService.verifyResetPassword(request);
        if (res.success) {
            setShowResetPassword(true);
            setShowOTPModal(false);
            setSuccess(t("auth.email_verified"));
        }
        return res;
    };


    const onResendOtp = async (email: string) => {
        let request: SendResetPasswordOtpRequest = {
            email: email
        };
        
        if (otpType === "VERIFY") {
            // For verify email resend, bạn cần tạo method mới trong authService
            // Hoặc sử dụng forgotPassword cho reset password OTP
            const res = await authService.forgotPassword(request);
            return res;
        } else {
            const res = await authService.resendOTP(request);
            return res;
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            setError(t("auth.require_email"));
            return;
        }
        
        let request: SendResetPasswordOtpRequest = {
            email: email
        };
        
        const res = await authService.forgotPassword(request);
        if (res.success) {
            setOtpEmail(email);
            setOtpType("UPDATE");
            setShowOTPModal(true);
        } else {
            setError(res.message);
        }
        return res;
    };

    const handleResetPassword = async () => {
        setError(null);
        setLoading(true);
        
        if (!otpEmail) {
            setError("Email not found");
            setLoading(false);
            return;
        }
        
        if (newPassword !== newConfirmPassword) {
            setError(t("auth.passwords_dont_match"));
            setLoading(false);
            return;
        }
        
        if (newPassword.length < 6) {
            setError(t("auth.password_too_short"));
            setLoading(false);
            return;
        }
        
        try {
            let request: ResetPasswordRequest = {
                email: otpEmail,
                newPassword: newPassword
            }
            const res = await authService.resetPassword(request);
            if (res.success) {
                setSuccess(t("auth.password_reset_success"));
                setShowResetPassword(false);
                setActiveTab("signin");
                authService.clearAuthData();
            } else {
                setError(res.message);
            }
        } catch (err: any) {
            const message = err.response?.data?.message;

            if (message?.includes('expired')) {
                setError(t('auth.reset_token_expired'));
            } else {
                setError(message ?? t('common.error'));
            }       
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Implement Google login logic
        console.log("Google login");
    };

    const handleFacebookLogin = () => {
        // Implement Facebook login logic
        console.log("Facebook login");
    };

    const onSuccessSocialLogin = () => {
        router.replace('/(auth)/profile');
    }

    const goBack = () => {
        if (showResetPassword) {
            setShowResetPassword(false);
        } else if (showOTPModal) {
            setShowOTPModal(false);
        } else {
            router.back();
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <Pressable style={styles.exitBtn} onPress={goBack}>
                <Ionicons style={styles.exitIcon} name="arrow-back" size={24} color="black" />
            </Pressable>
            <View style={styles.container}>
                {/* GIF Section */}
                <View style={styles.gifContainer}>
                    <Image
                        source={loginGif}
                        style={styles.gif}
                        resizeMode="contain"
                    />
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
                    <View style={styles.themesContainer}>
                        <Image
                            source={themesGif}
                            style={styles.themes}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.card}>
                        {showResetPassword ? (
                            <ResetPasswordForm
                                password={newPassword}
                                setPassword={setNewPassword}
                                confirmPassword={newConfirmPassword}
                                setConfirmPassword={setNewConfirmPassword}
                                error={error}
                                loading={loading}
                                onResetPassword={handleResetPassword}
                            />
                        ) : showOTPModal && otpEmail ? (
                            <OtpVerificationScreen
                                email={otpEmail}
                                type={otpType}
                                onVerifyOtp={onVerifyOtp}
                                OnForgetPassword={onVerifyResetPassword}
                                onResendOtp={onResendOtp}
                            />
                        ) : (
                            <>
                                <AuthTabs
                                    activeTab={activeTab}
                                    onTabChange={setActiveTab}
                                />

                                {activeTab === "signin" ? (
                                    <SignInForm
                                        email={email}
                                        setEmail={setEmail}
                                        password={password}
                                        setPassword={setPassword}
                                        rememberMe={rememberMe}
                                        setRememberMe={setRememberMe}
                                        error={error}
                                        loading={loading}
                                        onSignIn={handleSignIn}
                                        onForgotPassword={handleForgotPassword}
                                    />
                                ) : (
                                    <KeyboardAvoidingView
                                        style={{ flex: 1 }}
                                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                    >
                                        <ScrollView
                                            contentContainerStyle={{ padding: 20 }}
                                            showsVerticalScrollIndicator={false}
                                            keyboardShouldPersistTaps="handled"
                                        >
                                            <SignUpForm
                                                fullName={fullName}
                                                setFullName={setFullName}
                                                email={signupEmail}
                                                setEmail={setSignupEmail}
                                                password={signupPassword}
                                                setPassword={setSignupPassword}
                                                confirmPassword={confirmPassword}
                                                setConfirmPassword={setConfirmPassword}
                                                phone={phone}
                                                setPhone={setPhone}
                                                dateOfBirth={dateOfBirth}
                                                setDateOfBirth={setDateOfBirth}
                                                error={error}
                                                loading={loading}
                                                onSignUp={handleSignUp}
                                            />
                                        </ScrollView>
                                    </KeyboardAvoidingView>
                                )}

                                {activeTab === "signin" && (
                                    <SocialLogin
                                        onGoogleLogin={handleGoogleLogin}
                                        onFacebookLogin={handleFacebookLogin}
                                        onSuccess={onSuccessSocialLogin}
                                    />
                                )}
                            </>
                        )}
                    </View>
                </View>
                
                {/* Language Switch */}
                <View style={styles.languageSwitchContainer}>
                    <LanguageSwitch />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    gifContainer: {
        height: "30%",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    gif: {
        top: -40,
        width: "180%",
        height: "180%",
    },
    formContainer: {
        flex: 1,
        width: "100%",
        height: "70%"
    },
    themesContainer: {
        position: "absolute",
        width: "100%",
        height: "100%"
    },
    themes: {
        display: "flex",
        right: 0,
        width: "100%",
        height: "100%"
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 25,
        padding: 20,
        borderWidth: 1,
        flex: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
    },
    languageSwitchContainer: {
        position: "absolute",
        top: 25,
        right: 20,
    },
    exitBtn: {
        position: "absolute",
        borderColor: "white",
        borderWidth: 1,
        padding: 2,
        top: 30,
        zIndex: 50,
        left: 20,      
        borderRadius: 50, 
    },
    exitIcon: {
        color: "#fff"
    }
});