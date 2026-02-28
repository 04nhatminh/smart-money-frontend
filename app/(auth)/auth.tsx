import React, { useState } from "react";
import {
    View,
    StyleSheet,
    SafeAreaView,
    Image,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Text,
    StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
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

const { width, height } = Dimensions.get('window');

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
    
    const loginGif = require("../../assets/auth-background.jpg");
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
            <StatusBar barStyle="light-content" backgroundColor="#3629B7" />
            
            {/* Gradient Background */}
            <LinearGradient
                colors={['#3629B7', '#5655B9', '#A8A3D7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
            >
                {/* Decorative Circles */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />
                <View style={styles.circle3} />
            </LinearGradient>

            {/* Header with Back Button */}
            <Pressable style={styles.exitBtn} onPress={goBack}>
                <View style={styles.exitBtnInner}>
                    <Ionicons name="arrow-back" size={24} color="#3629B7" />
                </View>
            </Pressable>

            {/* Language Switch */}
            <View style={styles.languageSwitchContainer}>
                <LanguageSwitch />
            </View>

            {/* Main Content */}
            <View style={styles.container}>
                {/* Logo/Title Section */}
                <View style={styles.logoContainer}>
                    <Text style={styles.appName}>Smart Money</Text>
                    <Text style={styles.appTagline}>{t("auth.welcome")}</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formWrapper}>
                    <View style={styles.formCard}>
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
                                    <KeyboardAvoidingView
                                        behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
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
                                </KeyboardAvoidingView>

                                ) : (
                                    <KeyboardAvoidingView
                                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                        style={styles.keyboardView}
                                            keyboardVerticalOffset={Platform.select({
                                                ios: 64,
                                                android: 0
                                                })}
                                    >
                                        <ScrollView
                                            showsVerticalScrollIndicator={false}
                                            keyboardShouldPersistTaps="handled"
                                            contentContainerStyle={styles.scrollContent}
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
                                    <View style={styles.socialSection}>
                                        <SocialLogin
                                            onGoogleLogin={handleGoogleLogin}
                                            onFacebookLogin={handleFacebookLogin}
                                            onSuccess={onSuccessSocialLogin}
                                        />
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#3629B7',
    },
    gradientBackground: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    circle1: {
        position: 'absolute',
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -width * 0.2,
        right: -width * 0.2,
    },
    circle2: {
        position: 'absolute',
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: width * 0.3,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: -width * 0.1,
        left: -width * 0.2,
    },
    circle3: {
        position: 'absolute',
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: width * 0.2,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        top: height * 0.3,
        right: width * 0.1,
    },
    container: {
        flex: 1,
    },
    logoContainer: {
        paddingTop: 60,
        display: 'flex',
        height: height * 0.2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    appTagline: {
        fontSize: 16,
        color: '#F2F1F9',
        opacity: 0.9,
        letterSpacing: 0.3,
    },
    formWrapper: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
        minHeight: height * 0.6,
        shadowColor: '#3629B7',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        height: height * 0.8
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    exitBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        zIndex: 100,
    },
    exitBtnInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3629B7',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    languageSwitchContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 100,
    },
    socialSection: {
        marginTop: 20,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#F2F1F9',
    },
    dividerText: {
        marginHorizontal: 12,
        color: '#A8A3D7',
        fontSize: 14,
        fontWeight: '500',
    },
});